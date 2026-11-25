import type { Metadata } from "next";
import Link from "next/link";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { NoteForm } from "@/components/portal/note-form";
import { PageHeader } from "@/components/portal/page-header";
import { Timeline } from "@/components/portal/timeline";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AwardForm } from "@/features/scholarship-awards/award-form";
import { DeleteAwardButton } from "@/features/scholarship-awards/delete-award-button";
import { AWARD_PERIOD_LABELS, AWARD_STATUS_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDay, formatPkr } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { getAward } from "@/server/services/scholarship-award.service";

export const metadata: Metadata = { title: "Scholarship award" };

export default async function AwardPage({ params }: PageProps<"/portal/scholarship-awards/[id]">) {
  const access = await checkPagePermission("awards:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { id } = await params;
  const award = await orNotFound(getAward(id));
  const canManage = hasPermission(access.staff, "awards:manage");
  const canDelete = canManage && hasPermission(access.staff, "content:delete");

  return (
    <>
      <PageHeader
        title={award.studentName}
        description={`Scholarship award for application ${award.referenceNumber}.`}
        actions={
          canDelete ? (
            <DeleteAwardButton awardId={award.id} studentName={award.studentName} />
          ) : null
        }
      />
      <p>
        <Link
          href={`/portal/applications/${award.applicationId}`}
          className="font-semibold text-navy underline underline-offset-2"
        >
          Open application {award.referenceNumber}
        </Link>
      </p>
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Award</CardTitle>
            <CardDescription>
              A record only. No payment is made or tracked in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {canManage ? (
              <AwardForm award={award} />
            ) : (
              <DetailList
                items={[
                  { label: "Amount", value: formatPkr(award.amountPkr) },
                  { label: "Paid", value: AWARD_PERIOD_LABELS[award.period] },
                  { label: "Start date", value: formatDay(award.startDate) },
                  {
                    label: "Renewal date",
                    value: award.renewalDate ? formatDay(award.renewalDate) : "Not set",
                  },
                  { label: "Status", value: AWARD_STATUS_LABELS[award.status] },
                ]}
              />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Progress notes</CardTitle>
            <CardDescription>Term results and other updates, newest first.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canManage ? (
              <NoteForm
                endpoint={`/scholarship-awards/${award.id}/notes`}
                label="Progress note"
                placeholder="How the student is doing"
              />
            ) : null}
            <Timeline
              items={award.notes.map((note) => ({
                id: note.id,
                at: note.createdAt,
                actorName: note.authorName,
                text: note.body,
              }))}
              emptyText="No progress notes yet."
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

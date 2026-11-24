import type { Metadata } from "next";
import Link from "next/link";

import { ForbiddenView } from "@/components/portal/forbidden-view";
import { NoteForm } from "@/components/portal/note-form";
import { PageHeader } from "@/components/portal/page-header";
import { StatusBadge } from "@/components/portal/status-badge";
import { Timeline, type TimelineItem } from "@/components/portal/timeline";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationDetails } from "@/features/application-review/application-details";
import { ApplicationDocuments } from "@/features/application-review/application-documents";
import { ChecklistForm } from "@/features/application-review/checklist-form";
import { StatusChangeDialog } from "@/features/application-review/status-change-dialog";
import {
  allowedNextStatuses,
  applicationStatusTone,
  CHECKLIST_EDITABLE_STATUSES,
} from "@/lib/constants/application-workflow";
import { APPLICATION_STATUS_LABELS, APPLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import type { ApplicationDetail } from "@/server/repositories/application-review.repository";
import { getApplicationDetail } from "@/server/services/application-review.service";

export const metadata: Metadata = { title: "Application" };

function describeChange(entry: ApplicationDetail["timeline"][number]): string | undefined {
  if (entry.kind !== "STATUS" || !entry.to) {
    return undefined;
  }
  const from = entry.from ? APPLICATION_STATUS_LABELS[entry.from] : "New";
  return `${from} → ${APPLICATION_STATUS_LABELS[entry.to]}`;
}

function toTimelineItems(application: ApplicationDetail): TimelineItem[] {
  return application.timeline.map((entry, index) => ({
    id: `${entry.at}-${String(index)}`,
    at: entry.at,
    actorName: entry.actorName,
    change: describeChange(entry),
    text: entry.text,
  }));
}

export default async function ApplicationPage({ params }: PageProps<"/portal/applications/[id]">) {
  const access = await checkPagePermission("applications:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { staff } = access;
  const { id } = await params;
  const application = await orNotFound(getApplicationDetail(id));
  const nextStatuses = allowedNextStatuses(staff, application.status);
  const canReview = hasPermission(staff, "applications:review");

  return (
    <>
      <PageHeader
        title={application.referenceNumber}
        description={`${APPLICATION_TYPE_LABELS[application.type]} application from ${application.applicant.fullName}, submitted ${formatDateTime(application.createdAt)}.`}
        actions={
          <StatusBadge
            label={APPLICATION_STATUS_LABELS[application.status]}
            tone={applicationStatusTone(application.status)}
          />
        }
      />

      {nextStatuses.length > 0 ? (
        <section aria-label="Status actions" className="flex flex-wrap gap-2">
          {nextStatuses.map((target) => (
            <StatusChangeDialog
              key={target}
              applicationId={application.id}
              target={target}
              needsAwardTerms={target === "APPROVED" && application.type === "SCHOLARSHIP"}
            />
          ))}
        </section>
      ) : null}

      {application.status === "INCOMPLETE" ? (
        <Alert>
          <AlertTitle>Waiting for the applicant</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc pl-5">
              {application.missingItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      {application.decision ? (
        <Alert>
          <AlertTitle>
            {APPLICATION_STATUS_LABELS[application.status]} by {application.decision.decidedByName},{" "}
            {formatDateTime(application.decision.decidedAt)}
          </AlertTitle>
          <AlertDescription>
            <p>{application.decision.reason}</p>
            {application.awardId ? (
              <Link
                href={`/portal/scholarship-awards/${application.awardId}`}
                className="font-semibold text-navy underline underline-offset-2"
              >
                View the scholarship award
              </Link>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <ApplicationDetails application={application} />
          <ApplicationDocuments documents={application.documents} />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification checklist</CardTitle>
              <CardDescription>
                All four must be ticked before the application is verified.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChecklistForm
                applicationId={application.id}
                checklist={application.checklist}
                isEditable={canReview && CHECKLIST_EDITABLE_STATUSES.includes(application.status)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>History and notes</CardTitle>
              <CardDescription>Internal. Applicants never see this.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {canReview ? (
                <NoteForm
                  endpoint={`/applications/${application.id}/notes`}
                  label="Internal note"
                />
              ) : null}
              <Timeline items={toTimelineItems(application)} emptyText="Nothing recorded yet." />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

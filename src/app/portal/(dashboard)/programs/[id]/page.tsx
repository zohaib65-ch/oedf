import type { Metadata } from "next";
import Link from "next/link";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { StatusBadge } from "@/components/portal/status-badge";
import { FormattedText } from "@/components/shared/formatted-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteProgramButton } from "@/features/program-management/delete-program-button";
import { ProgramForm } from "@/features/program-management/program-form";
import { CONTENT_STATUS_LABELS, PROGRAM_CATEGORY_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { toPublicImage } from "@/server/services/image.service";
import {
  getInstitutionChoices,
  getProgramForStaff,
} from "@/server/services/program-management.service";

export const metadata: Metadata = { title: "Program" };

const TONE = { DRAFT: "progress", PUBLISHED: "positive", ARCHIVED: "closed" } as const;
const linkClass = "font-semibold text-navy underline underline-offset-2";

export default async function ProgramPage({ params }: PageProps<"/portal/programs/[id]">) {
  const access = await checkPagePermission("programs:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { staff } = access;
  const { id } = await params;
  const [program, institutions] = await Promise.all([
    orNotFound(getProgramForStaff(id)),
    getInstitutionChoices(),
  ]);
  const canPublish = hasPermission(staff, "programs:publish");
  const canEdit =
    hasPermission(staff, "programs:write") && (program.status === "DRAFT" || canPublish);
  const canDelete = canEdit && program.applicationCount === 0;
  const institutionName = new Map(
    institutions.map((institution) => [institution.id, institution.name]),
  );

  return (
    <>
      <PageHeader
        title={program.title}
        description={`${PROGRAM_CATEGORY_LABELS[program.category]} program. ${program.summary}`}
        actions={
          <StatusBadge label={CONTENT_STATUS_LABELS[program.status]} tone={TONE[program.status]} />
        }
      />
      {canDelete ? (
        <section aria-label="Program actions" className="flex flex-wrap gap-2">
          <DeleteProgramButton programId={program.id} title={program.title} />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{canEdit ? "Edit program" : "Program"}</CardTitle>
            <CardDescription>
              {program.status === "PUBLISHED"
                ? "Changes appear on the public site at once."
                : "Visitors cannot see this program."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canEdit ? (
              <ProgramForm
                programId={program.id}
                canPublish={canPublish}
                currentImage={toPublicImage(program.image, 480)}
                institutions={institutions.map((institution) => ({
                  value: institution.id,
                  label: `${institution.name} (${institution.city})`,
                }))}
                defaultValues={{
                  title: program.title,
                  category: program.category,
                  summary: program.summary,
                  description: program.description,
                  duration: program.duration,
                  eligibility: program.eligibility,
                  institutionIds: program.institutionIds,
                  acceptsApplications: program.acceptsApplications,
                  status: program.status,
                  image: program.image
                    ? {
                        publicId: program.image.publicId,
                        resourceType: "image",
                        originalName: "Current photo",
                      }
                    : undefined,
                  imageAlt: program.image?.alt ?? "",
                }}
              />
            ) : (
              <>
                <DetailList
                  items={[
                    { label: "Duration", value: program.duration },
                    {
                      label: "Accepts applications",
                      value: program.acceptsApplications ? "Yes" : "No",
                    },
                    {
                      label: "Offered at",
                      value: program.institutionIds
                        .map((institutionId) => institutionName.get(institutionId) ?? "")
                        .filter(Boolean)
                        .join(", "),
                    },
                  ]}
                />
                {program.description ? (
                  <div>
                    <h2 className="mb-2 font-semibold">Description</h2>
                    <FormattedText text={program.description} size="base" />
                  </div>
                ) : null}
                {program.eligibility ? (
                  <div>
                    <h2 className="mb-2 font-semibold">Eligibility</h2>
                    <FormattedText text={program.eligibility} size="base" />
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>At a glance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <DetailList
              columns={1}
              items={[
                {
                  label: "Applications",
                  value:
                    program.applicationCount === 0 ? (
                      "None"
                    ) : (
                      <Link
                        href={`/portal/applications?programId=${program.id}`}
                        className={linkClass}
                      >
                        View {program.applicationCount}{" "}
                        {program.applicationCount === 1 ? "application" : "applications"}
                      </Link>
                    ),
                },
                { label: "Created", value: formatDateTime(program.createdAt) },
                { label: "Last changed", value: formatDateTime(program.updatedAt) },
              ]}
            />
            {program.status === "PUBLISHED" ? (
              <Link
                href={`/programs/${program.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                View on the public site<span className="sr-only"> (opens in a new tab)</span>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

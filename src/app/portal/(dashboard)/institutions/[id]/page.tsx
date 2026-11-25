import type { Metadata } from "next";
import Link from "next/link";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { PrivateFileLink } from "@/components/portal/private-file-link";
import { FormattedText } from "@/components/shared/formatted-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AgreementDialog } from "@/features/institution-management/agreement-dialog";
import { InstitutionForm } from "@/features/institution-management/institution-form";
import { InstitutionStatus } from "@/features/institution-management/institution-status";
import { ReviewDialog } from "@/features/institution-management/review-dialog";
import { AGREEMENT_STATUS_LABELS, INSTITUTION_TYPE_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDay, formatDateTime } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { toPublicImage } from "@/server/services/image.service";
import { getInstitutionForStaff } from "@/server/services/institution-management.service";

export const metadata: Metadata = { title: "Institution" };

const linkClass = "font-semibold text-navy underline underline-offset-2";

export default async function InstitutionPage({ params }: PageProps<"/portal/institutions/[id]">) {
  const access = await checkPagePermission("institutions:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { staff } = access;
  const { id } = await params;
  const institution = await orNotFound(getInstitutionForStaff(id));
  const canWrite = hasPermission(staff, "institutions:write");
  const canPublish = hasPermission(staff, "institutions:publish");
  const canEdit = canWrite && (!institution.isPublic || canPublish);
  const isOnPublicSite = institution.isPublic && institution.status === "ACTIVE";

  return (
    <>
      <PageHeader
        title={institution.name}
        description={`${INSTITUTION_TYPE_LABELS[institution.type]}, ${institution.city}.`}
        actions={<InstitutionStatus status={institution.status} isPublic={institution.isPublic} />}
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{canEdit ? "Edit institution" : "Institution"}</CardTitle>
            <CardDescription>
              {isOnPublicSite
                ? "On the public site: changes appear there at once."
                : "Visitors cannot see this institution."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canEdit ? (
              <InstitutionForm
                institutionId={institution.id}
                canPublish={canPublish}
                currentImage={toPublicImage(institution.image, 480)}
                defaultValues={{
                  name: institution.name,
                  type: institution.type,
                  city: institution.city,
                  address: institution.address,
                  description: institution.description,
                  status: institution.status,
                  isPublic: institution.isPublic,
                  image: institution.image
                    ? {
                        publicId: institution.image.publicId,
                        resourceType: "image",
                        originalName: "Current photo",
                      }
                    : undefined,
                  imageAlt: institution.image?.alt ?? "",
                }}
              />
            ) : (
              <>
                <DetailList items={[{ label: "Address", value: institution.address }]} />
                {institution.description ? (
                  <FormattedText text={institution.description} size="base" />
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>At a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DetailList
                columns={1}
                items={[
                  {
                    label: "Programs offered",
                    value:
                      institution.programs.length === 0 ? (
                        "None"
                      ) : (
                        <ul className="space-y-1">
                          {institution.programs.map((program) => (
                            <li key={program.id}>
                              <Link href={`/portal/programs/${program.id}`} className={linkClass}>
                                {program.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ),
                  },
                  {
                    label: "Average rating",
                    value:
                      institution.averageRating === null
                        ? "No reviews yet"
                        : `${institution.averageRating.toFixed(1)} of 5 (${String(institution.reviews.length)} ${institution.reviews.length === 1 ? "review" : "reviews"})`,
                  },
                  { label: "Last changed", value: formatDateTime(institution.updatedAt) },
                ]}
              />
              {isOnPublicSite ? (
                <Link
                  href={`/institutions/${institution.slug}`}
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
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Agreements</CardTitle>
            <CardDescription>
              Internal. Signed copies open through a five-minute link.
            </CardDescription>
          </div>
          {canWrite ? <AgreementDialog institutionId={institution.id} /> : null}
        </CardHeader>
        <CardContent>
          {institution.agreements.length === 0 ? (
            <p className="text-muted-foreground">No agreements recorded.</p>
          ) : (
            <ul className="divide-y">
              {institution.agreements.map((agreement) => (
                <li
                  key={agreement.id}
                  className="flex flex-wrap items-start justify-between gap-3 py-4"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{agreement.title}</p>
                    <p className="text-sm text-muted-foreground">
                      With {agreement.partner}. {AGREEMENT_STATUS_LABELS[agreement.status]}. From{" "}
                      {formatDay(agreement.startDate)}
                      {agreement.endDate ? ` to ${formatDay(agreement.endDate)}` : ""}.
                      {agreement.renewalDate ? ` Renewal ${formatDay(agreement.renewalDate)}.` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {agreement.document ? (
                      <PrivateFileLink
                        fileId={agreement.document.fileId}
                        name={`signed copy of ${agreement.title}`}
                      />
                    ) : null}
                    {canWrite ? (
                      <AgreementDialog institutionId={institution.id} agreement={agreement} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Performance reviews</CardTitle>
            <CardDescription>Internal, newest first.</CardDescription>
          </div>
          {canWrite ? <ReviewDialog institutionId={institution.id} /> : null}
        </CardHeader>
        <CardContent>
          {institution.reviews.length === 0 ? (
            <p className="text-muted-foreground">No reviews yet.</p>
          ) : (
            <ul className="divide-y">
              {institution.reviews.map((review) => (
                <li key={review.id} className="space-y-1 py-4">
                  <p className="font-semibold">
                    {String(review.rating)} of 5, {formatDay(review.reviewDate)}
                    <span className="font-normal text-muted-foreground">
                      {" "}
                      by {review.reviewerName}
                    </span>
                  </p>
                  <p className="whitespace-pre-line">{review.summary}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}

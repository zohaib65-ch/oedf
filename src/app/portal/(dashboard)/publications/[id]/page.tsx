import type { Metadata } from "next";
import Link from "next/link";

import { DetailList } from "@/components/portal/detail-list";
import { ForbiddenView } from "@/components/portal/forbidden-view";
import { PageHeader } from "@/components/portal/page-header";
import { PrivateFileLink } from "@/components/portal/private-file-link";
import { StatusBadge } from "@/components/portal/status-badge";
import { FormattedText } from "@/components/shared/formatted-text";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeletePublicationButton } from "@/features/publication-management/delete-publication-button";
import { PublicationForm } from "@/features/publication-management/publication-form";
import { CONTENT_STATUS_LABELS, PUBLICATION_TYPE_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { formatDateTime, formatDay } from "@/lib/format";
import { checkPagePermission } from "@/server/auth/session";
import { orNotFound } from "@/server/http/or-not-found";
import { toPublicImage } from "@/server/services/image.service";
import { getPublicationForStaff } from "@/server/services/publication-management.service";

export const metadata: Metadata = { title: "Publication" };

const TONE = { DRAFT: "progress", PUBLISHED: "positive", ARCHIVED: "closed" } as const;
const linkClass = "font-semibold text-navy underline underline-offset-2";

export default async function PublicationPage({ params }: PageProps<"/portal/publications/[id]">) {
  const access = await checkPagePermission("publications:read");
  if (!access.isAllowed) {
    return <ForbiddenView />;
  }
  const { staff } = access;
  const { id } = await params;
  const publication = await orNotFound(getPublicationForStaff(id));
  const canPublish = hasPermission(staff, "publications:publish");
  const canEdit =
    hasPermission(staff, "publications:write") && (publication.status === "DRAFT" || canPublish);
  const canDelete = canPublish && hasPermission(staff, "content:delete");

  return (
    <>
      <PageHeader
        title={publication.title}
        description={`${PUBLICATION_TYPE_LABELS[publication.type]}.`}
        actions={
          <StatusBadge
            label={CONTENT_STATUS_LABELS[publication.status]}
            tone={TONE[publication.status]}
          />
        }
      />
      {canDelete ? (
        <section aria-label="Publication actions" className="flex flex-wrap gap-2">
          <DeletePublicationButton publicationId={publication.id} title={publication.title} />
        </section>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{canEdit ? "Edit publication" : "Publication"}</CardTitle>
            <CardDescription>
              {publication.status === "PUBLISHED"
                ? "Changes appear on the public site at once."
                : "Visitors cannot see this publication."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {canEdit ? (
              <PublicationForm
                publicationId={publication.id}
                canPublish={canPublish}
                currentImage={toPublicImage(publication.cover, 480)}
                defaultValues={{
                  title: publication.title,
                  type: publication.type,
                  summary: publication.summary,
                  authors: publication.authors.join(", "),
                  tags: publication.tags.join(", "),
                  publishedOn: publication.publishedOn ?? "",
                  status: publication.status,
                  pdf: publication.pdf
                    ? {
                        publicId: publication.pdf.publicId,
                        resourceType: publication.pdf.resourceType,
                        originalName: publication.pdf.originalName,
                      }
                    : undefined,
                  image: publication.cover
                    ? {
                        publicId: publication.cover.publicId,
                        resourceType: "image",
                        originalName: "Current cover",
                      }
                    : undefined,
                  imageAlt: publication.cover?.alt ?? "",
                }}
              />
            ) : (
              <>
                <DetailList
                  items={[
                    { label: "Authors", value: publication.authors.join(", ") },
                    { label: "Topics", value: publication.tags.join(", ") },
                  ]}
                />
                <div>
                  <h2 className="mb-2 font-semibold">Summary</h2>
                  <FormattedText text={publication.summary} size="base" />
                </div>
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
                  label: "Publish date",
                  value: publication.publishedOn ? formatDay(publication.publishedOn) : "Not set",
                },
                {
                  label: "Full PDF",
                  value: publication.pdf ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-all">{publication.pdf.originalName}</span>
                      <PrivateFileLink fileId={publication.pdf.fileId} name="full PDF" />
                    </span>
                  ) : (
                    "None"
                  ),
                },
                { label: "Created", value: formatDateTime(publication.createdAt) },
                { label: "Last changed", value: formatDateTime(publication.updatedAt) },
              ]}
            />
            {publication.status === "PUBLISHED" ? (
              <Link
                href={`/research/${publication.slug}`}
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

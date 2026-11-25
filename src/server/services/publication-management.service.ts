import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { hasPermission } from "@/lib/constants/permissions";
import { parseSort } from "@/lib/validations/common";
import type { ListPublicationsQuery, PublicationFormInput } from "@/lib/validations/publication";
import type { StaffContext } from "@/server/auth/api-session";
import { newId } from "@/server/db/object-id";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";
import { toPakistanDay } from "@/server/lib/day-range";
import {
  createFileAssets,
  deleteFileAsset,
  FILE_OWNER_TYPES,
} from "@/server/repositories/file-asset.repository";
import {
  createPublication as createPublicationRecord,
  deletePublication as deletePublicationRecord,
  findPublicationForStaff,
  listPublicationsForStaff,
  updatePublication as updatePublicationRecord,
  type PublicationFields,
  type PublicationPdf,
  type StaffPublicationDetail,
  type StaffPublicationListItem,
} from "@/server/repositories/publication-management.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { resolveImage, settleImage } from "@/server/services/image.service";
import { uniqueSlug } from "@/server/services/slug.service";
import { verifyUploads, type VerifiedUpload } from "@/server/services/upload-verification";
import { deleteUploads, markUploadsConfirmed } from "@/server/storage/cloudinary";

const ENTITY_TYPE = "Publication";
const STALE_MESSAGE =
  "This publication was changed by someone else. Reload the page and try again.";
// Route handlers cannot use `updateTag`, so the public pages are expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message);
}

export function getPublicationsForStaff(
  query: ListPublicationsQuery,
): Promise<{ items: StaffPublicationListItem[]; total: number }> {
  return listPublicationsForStaff({
    q: query.q,
    status: query.status,
    type: query.type,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getPublicationForStaff(id: string): Promise<StaffPublicationDetail> {
  const publication = isObjectId(id) ? await findPublicationForStaff(id) : null;
  if (!publication) {
    throw new AppError("NOT_FOUND", "This publication could not be found.");
  }
  return publication;
}

/** Staff write drafts; publishing, or changing anything already published or archived, is a Director's. */
function assertMayChange(
  staff: StaffContext,
  current: StaffPublicationDetail | null,
  input: PublicationFormInput,
): void {
  if (!hasPermission(staff, "publications:write")) {
    throw forbidden("You do not have permission to change publications.");
  }
  const touchesPublicSite = current !== null && current.status !== "DRAFT";
  if (
    (touchesPublicSite || input.status !== "DRAFT") &&
    !hasPermission(staff, "publications:publish")
  ) {
    throw forbidden("Only a Director can publish a publication or change one that was published.");
  }
}

/** The PDF the form wants: none, the current one, or a new upload that is checked with Cloudinary. */
async function resolvePdf(
  current: PublicationPdf | null,
  input: PublicationFormInput,
): Promise<{ kept: PublicationPdf | null; upload: VerifiedUpload | null }> {
  if (!input.pdf) {
    return { kept: null, upload: null };
  }
  if (current && input.pdf.publicId === current.publicId) {
    return { kept: current, upload: null };
  }
  const [upload] = await verifyUploads([{ field: "pdf", file: input.pdf }], "PUBLICATION_PDF");
  return { kept: null, upload: upload ?? null };
}

async function toFields(
  input: PublicationFormInput,
  current: StaffPublicationDetail | null,
  pdfFileId: string | null,
): Promise<PublicationFields> {
  const { title, type, summary, authors, tags, status, image, imageAlt, publishedOn } = input;
  return {
    title,
    type,
    summary,
    authors,
    tags,
    status,
    // A published publication always has a date, so the public list can sort by it.
    publishedOn: publishedOn || (input.status === "PUBLISHED" ? toPakistanDay(new Date()) : null),
    pdfFileId,
    cover: await resolveImage(current?.cover ?? null, { image, imageAlt }),
  };
}

function pdfAsset(upload: VerifiedUpload, fileId: string, ownerId: string) {
  return {
    id: fileId,
    publicId: upload.file.publicId,
    resourceType: upload.file.resourceType,
    format: upload.format,
    bytes: upload.bytes,
    originalName: upload.file.originalName,
    purpose: "PUBLICATION_PDF" as const,
    ownerType: FILE_OWNER_TYPES.publication,
    ownerId,
  };
}

function expirePublicPages(): void {
  revalidateTag(CACHE_TAGS.publications, EXPIRE_NOW);
}

/** Saves a new publication. Staff save drafts; a Director may publish at once. */
export async function createPublication(
  staff: StaffContext,
  input: PublicationFormInput,
): Promise<StaffPublicationDetail> {
  assertMayChange(staff, null, input);
  const { upload } = await resolvePdf(null, input);
  const fileId = upload ? newId() : null;
  const fields = await toFields(input, null, fileId);
  const id = newId();
  const slug = await uniqueSlug("publication", input.title);

  await withTransaction(async (session) => {
    if (upload && fileId) {
      await createFileAssets([pdfAsset(upload, fileId, id)], session);
    }
    await createPublicationRecord(id, slug, fields, session);
  });
  if (upload) {
    await markUploadsConfirmed([upload.file]);
  }
  await settleImage(null, fields.cover);
  await recordAudit(staff, {
    action: "publication.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: input.title, status: input.status },
  });
  if (input.status !== "DRAFT") {
    expirePublicPages();
  }
  return getPublicationForStaff(id);
}

function changedFields(publication: StaffPublicationDetail, fields: PublicationFields): string[] {
  const before: Record<string, unknown> = {
    title: publication.title,
    type: publication.type,
    summary: publication.summary,
    authors: publication.authors.join("|"),
    tags: publication.tags.join("|"),
    publishedOn: publication.publishedOn,
    pdfFileId: publication.pdf?.fileId ?? null,
    status: publication.status,
    cover: publication.cover ? `${publication.cover.publicId}|${publication.cover.alt}` : "",
  };
  const after: Record<string, unknown> = {
    ...fields,
    authors: fields.authors.join("|"),
    tags: fields.tags.join("|"),
    cover: fields.cover ? `${fields.cover.publicId}|${fields.cover.alt}` : "",
  };
  return Object.keys(before).filter((key) => before[key] !== after[key]);
}

export async function updatePublication(
  staff: StaffContext,
  id: string,
  input: PublicationFormInput,
): Promise<StaffPublicationDetail> {
  const publication = await getPublicationForStaff(id);
  assertMayChange(staff, publication, input);
  const { kept, upload } = await resolvePdf(publication.pdf, input);
  const newFileId = upload ? newId() : null;
  const fields = await toFields(input, publication, kept?.fileId ?? newFileId);
  const changed = changedFields(publication, fields);
  if (changed.length === 0) {
    return publication;
  }
  // The PDF that was replaced or removed, deleted once the change is saved.
  const removedPdf =
    publication.pdf && publication.pdf.fileId !== kept?.fileId ? publication.pdf : null;

  await withTransaction(async (session) => {
    if (upload && newFileId) {
      await createFileAssets([pdfAsset(upload, newFileId, id)], session);
    }
    if (removedPdf) {
      await deleteFileAsset(removedPdf.fileId, session);
    }
    if (!(await updatePublicationRecord(id, publication.status, fields, session))) {
      throw new AppError("CONFLICT", STALE_MESSAGE);
    }
  });
  if (upload) {
    await markUploadsConfirmed([upload.file]);
  }
  if (removedPdf) {
    await deleteUploads([removedPdf]);
  }
  await settleImage(publication.cover, fields.cover);
  await recordAudit(staff, {
    action: "publication.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (publication.status !== "DRAFT" || fields.status !== "DRAFT") {
    expirePublicPages();
  }
  return getPublicationForStaff(id);
}

/** Deletes a publication, its PDF and its cover for good. A Director's decision, recorded in the audit log. */
export async function deletePublication(staff: StaffContext, id: string): Promise<void> {
  if (!hasPermission(staff, "publications:publish") || !hasPermission(staff, "content:delete")) {
    throw forbidden("Only a Director can delete a publication.");
  }
  const publication = await getPublicationForStaff(id);
  await withTransaction(async (session) => {
    if (publication.pdf) {
      await deleteFileAsset(publication.pdf.fileId, session);
    }
    if (!(await deletePublicationRecord(id, publication.status, session))) {
      throw new AppError("CONFLICT", STALE_MESSAGE);
    }
  });
  if (publication.pdf) {
    await deleteUploads([publication.pdf]);
  }
  await settleImage(publication.cover, null);
  await recordAudit(staff, {
    action: "publication.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: publication.title, status: publication.status },
  });
  if (publication.status !== "DRAFT") {
    expirePublicPages();
  }
}

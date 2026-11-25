import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { hasPermission } from "@/lib/constants/permissions";
import { parseSort } from "@/lib/validations/common";
import type {
  AgreementFormInput,
  InstitutionFormInput,
  ListInstitutionsQuery,
  ReviewFormInput,
} from "@/lib/validations/institution";
import type { StaffContext } from "@/server/auth/api-session";
import { newId } from "@/server/db/object-id";
import { withTransaction } from "@/server/db/transaction";
import { AppError } from "@/server/http/errors";
import { createFileAssets, FILE_OWNER_TYPES } from "@/server/repositories/file-asset.repository";
import {
  addAgreement as addAgreementRecord,
  addReview as addReviewRecord,
  createInstitution as createInstitutionRecord,
  deleteInstitution as deleteInstitutionRecord,
  findInstitutionForStaff,
  listInstitutionsForStaff,
  updateAgreement as updateAgreementRecord,
  updateInstitution as updateInstitutionRecord,
  type AgreementRecord,
  type InstitutionFields,
  type StaffInstitutionDetail,
  type StaffInstitutionListItem,
} from "@/server/repositories/institution-management.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { resolveImage, settleImage } from "@/server/services/image.service";
import { uniqueSlug } from "@/server/services/slug.service";
import { verifyUploads } from "@/server/services/upload-verification";
import { markUploadsConfirmed } from "@/server/storage/cloudinary";

const ENTITY_TYPE = "Institution";
const STALE_MESSAGE =
  "This institution was changed by someone else. Reload the page and try again.";
// Route handlers cannot use `updateTag`, so the public pages are expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message);
}

/** Institutions appear on their own pages and on program pages. */
function expirePublicPages(): void {
  revalidateTag(CACHE_TAGS.institutions, EXPIRE_NOW);
  revalidateTag(CACHE_TAGS.programs, EXPIRE_NOW);
}

function assertMayWrite(staff: StaffContext): void {
  if (!hasPermission(staff, "institutions:write")) {
    throw forbidden("You do not have permission to change institutions.");
  }
}

export function getInstitutionsForStaff(
  query: ListInstitutionsQuery,
): Promise<{ items: StaffInstitutionListItem[]; total: number }> {
  return listInstitutionsForStaff({
    q: query.q,
    status: query.status,
    type: query.type,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
    now: new Date(),
  });
}

export async function getInstitutionForStaff(id: string): Promise<StaffInstitutionDetail> {
  const institution = isObjectId(id) ? await findInstitutionForStaff(id, new Date()) : null;
  if (!institution) {
    throw new AppError("NOT_FOUND", "This institution could not be found.");
  }
  return institution;
}

async function toFields(
  input: InstitutionFormInput,
  current: StaffInstitutionDetail | null,
): Promise<InstitutionFields> {
  const { image, imageAlt, ...rest } = input;
  return { ...rest, image: await resolveImage(current?.image ?? null, { image, imageAlt }) };
}

/** Making an institution public, or changing one that is, changes the public site: a Director's call. */
function assertMayPublish(
  staff: StaffContext,
  current: StaffInstitutionDetail | null,
  input: InstitutionFormInput,
): void {
  if (
    (current?.isPublic === true || input.isPublic) &&
    !hasPermission(staff, "institutions:publish")
  ) {
    throw forbidden("Only a Director can make an institution public or change a public one.");
  }
}

export async function createInstitution(
  staff: StaffContext,
  input: InstitutionFormInput,
): Promise<StaffInstitutionDetail> {
  assertMayWrite(staff);
  assertMayPublish(staff, null, input);
  const fields = await toFields(input, null);
  const id = await createInstitutionRecord(await uniqueSlug("institution", input.name), fields);
  await settleImage(null, fields.image);
  await recordAudit(staff, {
    action: "institution.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { name: input.name },
  });
  if (input.isPublic) {
    expirePublicPages();
  }
  return getInstitutionForStaff(id);
}

function changedFields(institution: StaffInstitutionDetail, fields: InstitutionFields): string[] {
  const before: Record<string, unknown> = {
    name: institution.name,
    type: institution.type,
    city: institution.city,
    address: institution.address,
    description: institution.description,
    status: institution.status,
    isPublic: institution.isPublic,
    image: institution.image ? `${institution.image.publicId}|${institution.image.alt}` : "",
  };
  const after: Record<string, unknown> = {
    ...fields,
    image: fields.image ? `${fields.image.publicId}|${fields.image.alt}` : "",
  };
  return Object.keys(before).filter((key) => before[key] !== after[key]);
}

export async function updateInstitution(
  staff: StaffContext,
  id: string,
  input: InstitutionFormInput,
): Promise<StaffInstitutionDetail> {
  assertMayWrite(staff);
  const institution = await getInstitutionForStaff(id);
  assertMayPublish(staff, institution, input);
  const fields = await toFields(input, institution);
  const changed = changedFields(institution, fields);
  if (changed.length === 0) {
    return institution;
  }
  if (!(await updateInstitutionRecord(id, institution.isPublic, fields))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await settleImage(institution.image, fields.image);
  await recordAudit(staff, {
    action: "institution.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (institution.isPublic || fields.isPublic) {
    expirePublicPages();
  }
  return getInstitutionForStaff(id);
}

/**
 * Deletes an institution that has no agreements or reviews (those are history: close it instead).
 * Needs the delete permission, and a public one needs a Director too. Programs that list it drop
 * it in the same transaction, and its photo is removed.
 */
export async function deleteInstitution(staff: StaffContext, id: string): Promise<void> {
  assertMayWrite(staff);
  if (!hasPermission(staff, "content:delete")) {
    throw forbidden("You do not have permission to delete institutions.");
  }
  const institution = await getInstitutionForStaff(id);
  if (institution.isPublic && !hasPermission(staff, "institutions:publish")) {
    throw forbidden("Only a Director can delete an institution on the public site.");
  }
  if (institution.agreements.length > 0 || institution.reviews.length > 0) {
    throw new AppError(
      "CONFLICT",
      "This institution has agreements or reviews, so it cannot be deleted. Set its status to Closed instead.",
    );
  }
  const isDeleted = await withTransaction((session) =>
    deleteInstitutionRecord(id, institution.isPublic, session),
  );
  if (!isDeleted) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await settleImage(institution.image, null);
  await recordAudit(staff, {
    action: "institution.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { name: institution.name },
  });
  // Program pages list their institutions, so they change even when this one was not public.
  expirePublicPages();
}

/**
 * Saves an agreement, adding it or replacing one by ID. A new signed copy is checked with
 * Cloudinary and saved as a private file in the same transaction; an unchanged one is kept.
 */
async function saveAgreement(
  staff: StaffContext,
  id: string,
  agreementId: string | null,
  input: AgreementFormInput,
): Promise<StaffInstitutionDetail> {
  assertMayWrite(staff);
  const institution = await getInstitutionForStaff(id);
  const current: AgreementRecord | undefined = agreementId
    ? institution.agreements.find((agreement) => agreement.id === agreementId)
    : undefined;
  if (agreementId && !current) {
    throw new AppError("NOT_FOUND", "This agreement could not be found.");
  }

  // The signed copy the form still shows is kept as it is; any other file is a new upload.
  const keptDocument =
    current?.document && input.document?.publicId === current.document.publicId
      ? current.document
      : null;
  const [upload] =
    input.document && !keptDocument
      ? await verifyUploads([{ field: "document", file: input.document }], "AGREEMENT")
      : [];
  const newFileId = upload ? newId() : null;
  const documentFileId = keptDocument ? keptDocument.fileId : newFileId;
  const savedId = agreementId ?? newId();

  await withTransaction(async (session) => {
    if (upload && newFileId) {
      await createFileAssets(
        [
          {
            id: newFileId,
            publicId: upload.file.publicId,
            resourceType: upload.file.resourceType,
            format: upload.format,
            bytes: upload.bytes,
            originalName: upload.file.originalName,
            purpose: "AGREEMENT",
            ownerType: FILE_OWNER_TYPES.institution,
            ownerId: id,
          },
        ],
        session,
      );
    }
    const fields = {
      title: input.title,
      partner: input.partner,
      startDate: input.startDate,
      endDate: input.endDate || null,
      renewalDate: input.renewalDate || null,
      status: input.status,
      documentFileId,
    };
    const isSaved = agreementId
      ? await updateAgreementRecord(id, agreementId, fields, session)
      : await addAgreementRecord(id, savedId, fields, session);
    if (!isSaved) {
      throw new AppError("CONFLICT", STALE_MESSAGE);
    }
  });
  if (upload) {
    await markUploadsConfirmed([upload.file]);
  }
  await recordAudit(staff, {
    action: agreementId ? "institution.agreement_updated" : "institution.agreement_added",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { agreementId: savedId, title: input.title, status: input.status },
  });
  return getInstitutionForStaff(id);
}

export function addAgreement(
  staff: StaffContext,
  id: string,
  input: AgreementFormInput,
): Promise<StaffInstitutionDetail> {
  return saveAgreement(staff, id, null, input);
}

export function updateAgreement(
  staff: StaffContext,
  id: string,
  agreementId: string,
  input: AgreementFormInput,
): Promise<StaffInstitutionDetail> {
  if (!isObjectId(agreementId)) {
    throw new AppError("NOT_FOUND", "This agreement could not be found.");
  }
  return saveAgreement(staff, id, agreementId, input);
}

/** Adds a performance review, signed with the reviewer's name. */
export async function addReview(
  staff: StaffContext,
  id: string,
  input: ReviewFormInput,
): Promise<StaffInstitutionDetail> {
  assertMayWrite(staff);
  const isAdded =
    isObjectId(id) &&
    (await addReviewRecord(id, { ...input, reviewer: { id: staff.id, name: staff.name } }));
  if (!isAdded) {
    throw new AppError("NOT_FOUND", "This institution could not be found.");
  }
  await recordAudit(staff, {
    action: "institution.review_added",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { rating: String(input.rating) },
  });
  return getInstitutionForStaff(id);
}

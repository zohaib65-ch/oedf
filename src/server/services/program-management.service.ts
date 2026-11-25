import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { hasPermission } from "@/lib/constants/permissions";
import { parseSort } from "@/lib/validations/common";
import type { ListProgramsQuery, ProgramFormInput } from "@/lib/validations/program";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import {
  countExistingInstitutions,
  createProgram as createProgramRecord,
  deleteProgram as deleteProgramRecord,
  findProgramForStaff,
  listInstitutionChoices,
  listProgramsForStaff,
  updateProgram as updateProgramRecord,
  type ProgramFields,
  type StaffProgramDetail,
  type StaffProgramListItem,
} from "@/server/repositories/program-management.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { resolveImage, settleImage } from "@/server/services/image.service";
import { uniqueSlug } from "@/server/services/slug.service";

const ENTITY_TYPE = "Program";
const STALE_MESSAGE = "This program was changed by someone else. Reload the page and try again.";
// Route handlers cannot use `updateTag`, so the public pages are expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message);
}

/** Programs appear on program, institution and application pages, so all of them are refreshed. */
function expirePublicPages(): void {
  revalidateTag(CACHE_TAGS.programs, EXPIRE_NOW);
  revalidateTag(CACHE_TAGS.institutions, EXPIRE_NOW);
}

export function getProgramsForStaff(
  query: ListProgramsQuery,
): Promise<{ items: StaffProgramListItem[]; total: number }> {
  return listProgramsForStaff({
    q: query.q,
    status: query.status,
    category: query.category,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getProgramForStaff(id: string): Promise<StaffProgramDetail> {
  const program = isObjectId(id) ? await findProgramForStaff(id) : null;
  if (!program) {
    throw new AppError("NOT_FOUND", "This program could not be found.");
  }
  return program;
}

export function getInstitutionChoices(): Promise<{ id: string; name: string; city: string }[]> {
  return listInstitutionChoices();
}

async function assertInstitutionsExist(ids: readonly string[]): Promise<void> {
  const unique = [...new Set(ids)];
  if (unique.length > 0 && (await countExistingInstitutions(unique)) !== unique.length) {
    throw new AppError("VALIDATION_ERROR", "Choose institutions from the list", {
      fieldErrors: { institutionIds: ["Choose institutions from the list"] },
    });
  }
}

async function toFields(
  input: ProgramFormInput,
  current: StaffProgramDetail | null,
): Promise<ProgramFields> {
  const { image, imageAlt, institutionIds, ...rest } = input;
  await assertInstitutionsExist(institutionIds);
  return {
    ...rest,
    institutionIds: [...new Set(institutionIds)],
    image: await resolveImage(current?.image ?? null, { image, imageAlt }),
  };
}

/** A program is on the public site (or about to be) unless it stays a draft. */
function assertMayChange(
  staff: StaffContext,
  current: StaffProgramDetail | null,
  input: ProgramFormInput,
): void {
  if (!hasPermission(staff, "programs:write")) {
    throw forbidden("You do not have permission to change programs.");
  }
  const touchesPublicSite = current?.status !== undefined && current.status !== "DRAFT";
  if (
    (touchesPublicSite || input.status !== "DRAFT") &&
    !hasPermission(staff, "programs:publish")
  ) {
    throw forbidden("Only a Director can publish a program or change one that was published.");
  }
}

/** Saves a new program. Staff save drafts; a Director may publish at once. */
export async function createProgram(
  staff: StaffContext,
  input: ProgramFormInput,
): Promise<StaffProgramDetail> {
  assertMayChange(staff, null, input);
  const fields = await toFields(input, null);
  const id = await createProgramRecord(await uniqueSlug("program", input.title), fields);
  await settleImage(null, fields.image);
  await recordAudit(staff, {
    action: "program.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: input.title, status: input.status },
  });
  if (input.status !== "DRAFT") {
    expirePublicPages();
  }
  return getProgramForStaff(id);
}

function changedFields(program: StaffProgramDetail, fields: ProgramFields): string[] {
  const before: Record<string, unknown> = {
    title: program.title,
    category: program.category,
    summary: program.summary,
    description: program.description,
    duration: program.duration,
    eligibility: program.eligibility,
    institutionIds: [...program.institutionIds].sort().join(","),
    acceptsApplications: program.acceptsApplications,
    status: program.status,
    image: program.image ? `${program.image.publicId}|${program.image.alt}` : "",
  };
  const after: Record<string, unknown> = {
    ...fields,
    institutionIds: [...fields.institutionIds].sort().join(","),
    image: fields.image ? `${fields.image.publicId}|${fields.image.alt}` : "",
  };
  return Object.keys(before).filter((key) => before[key] !== after[key]);
}

export async function updateProgram(
  staff: StaffContext,
  id: string,
  input: ProgramFormInput,
): Promise<StaffProgramDetail> {
  const program = await getProgramForStaff(id);
  assertMayChange(staff, program, input);
  const fields = await toFields(input, program);
  const changed = changedFields(program, fields);
  if (changed.length === 0) {
    return program;
  }
  if (!(await updateProgramRecord(id, program.status, fields))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await settleImage(program.image, fields.image);
  await recordAudit(staff, {
    action: "program.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (program.status !== "DRAFT" || fields.status !== "DRAFT") {
    expirePublicPages();
  }
  return getProgramForStaff(id);
}

/**
 * Deletes a program nobody applied to. Staff may delete drafts; a published or archived program
 * needs a Director. One with applications is archived instead.
 */
export async function deleteProgram(staff: StaffContext, id: string): Promise<void> {
  if (!hasPermission(staff, "programs:write")) {
    throw forbidden("You do not have permission to delete programs.");
  }
  const program = await getProgramForStaff(id);
  if (program.status !== "DRAFT" && !hasPermission(staff, "programs:publish")) {
    throw forbidden("Only a Director can delete a program that was published.");
  }
  if (program.applicationCount > 0) {
    throw new AppError(
      "CONFLICT",
      "Applications chose this program, so it cannot be deleted. Archive it instead.",
    );
  }
  if (!(await deleteProgramRecord(id, program.status))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await settleImage(program.image, null);
  await recordAudit(staff, {
    action: "program.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: program.title },
  });
  if (program.status !== "DRAFT") {
    expirePublicPages();
  }
}

import "server-only";
import { revalidateTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/constants/cache-tags";
import { VACANCY_STATUS_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { VACANCY_TRANSITIONS } from "@/lib/constants/vacancy-workflow";
import { parseSort } from "@/lib/validations/common";
import type {
  ListVacanciesQuery,
  VacancyFormInput,
  VacancyStatusChangeInput,
} from "@/lib/validations/vacancy";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import { endOfPakistanDay } from "@/server/lib/day-range";
import {
  createVacancyDraft,
  deleteDraftVacancy,
  departmentExists,
  findVacancyForStaff,
  listVacanciesForStaff,
  listVacancyOptions,
  setVacancyStatus,
  updateVacancyFields,
  type StaffVacancyDetail,
  type StaffVacancyListItem,
  type VacancyFields,
} from "@/server/repositories/vacancy-management.repository";
import { recordAudit } from "@/server/services/audit-log.service";
import { uniqueSlug } from "@/server/services/slug.service";

const ENTITY_TYPE = "Vacancy";
const STALE_MESSAGE = "This vacancy was changed by someone else. Reload the page and try again.";
// Route handlers cannot use `updateTag`, so the public pages are expired with `revalidateTag`.
const EXPIRE_NOW = { expire: 0 } as const;

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message);
}

export function getVacanciesForStaff(
  query: ListVacanciesQuery,
): Promise<{ items: StaffVacancyListItem[]; total: number }> {
  return listVacanciesForStaff({
    q: query.q,
    status: query.status,
    departmentId: query.departmentId,
    type: query.type,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
    now: new Date(),
  });
}

export async function getVacancyForStaff(id: string): Promise<StaffVacancyDetail> {
  const vacancy = isObjectId(id) ? await findVacancyForStaff(id, new Date()) : null;
  if (!vacancy) {
    throw new AppError("NOT_FOUND", "This vacancy could not be found.");
  }
  return vacancy;
}

export function getVacancyOptions(): Promise<{ id: string; title: string }[]> {
  return listVacancyOptions();
}

async function assertOfficeExists(departmentId: string): Promise<void> {
  if (!(await departmentExists(departmentId))) {
    throw new AppError("VALIDATION_ERROR", "Choose an office", {
      fieldErrors: { departmentId: ["Choose an office"] },
    });
  }
}

const toFields = (input: VacancyFormInput): VacancyFields => ({
  ...input,
  deadline: endOfPakistanDay(input.deadline),
});

/** Saves a new vacancy as a draft. Nothing reaches the public site until a Director publishes it. */
export async function createVacancy(
  staff: StaffContext,
  input: VacancyFormInput,
): Promise<StaffVacancyDetail> {
  if (!hasPermission(staff, "vacancies:write")) {
    throw forbidden("You do not have permission to create vacancies.");
  }
  await assertOfficeExists(input.departmentId);
  const id = await createVacancyDraft(await uniqueSlug("vacancy", input.title), toFields(input));
  await recordAudit(staff, {
    action: "vacancy.created",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: input.title },
  });
  return getVacancyForStaff(id);
}

function changedFields(vacancy: StaffVacancyDetail, input: VacancyFormInput): string[] {
  const current: VacancyFormInput = {
    title: vacancy.title,
    departmentId: vacancy.departmentId,
    city: vacancy.city,
    employmentType: vacancy.employmentType,
    description: vacancy.description,
    requirements: vacancy.requirements,
    deadline: vacancy.deadlineDay,
  };
  return (Object.keys(input) as (keyof VacancyFormInput)[]).filter(
    (key) => input[key] !== current[key],
  );
}

/**
 * Saves changes. Staff may change drafts; a published or closed vacancy is (or was) on the public
 * site, so only someone who may publish can change it.
 */
export async function updateVacancy(
  staff: StaffContext,
  id: string,
  input: VacancyFormInput,
): Promise<StaffVacancyDetail> {
  if (!hasPermission(staff, "vacancies:write")) {
    throw forbidden("You do not have permission to change vacancies.");
  }
  const vacancy = await getVacancyForStaff(id);
  if (vacancy.status !== "DRAFT" && !hasPermission(staff, "vacancies:publish")) {
    throw forbidden("Only a Director can change a vacancy that has been published.");
  }
  const changed = changedFields(vacancy, input);
  if (changed.length === 0) {
    return vacancy;
  }
  await assertOfficeExists(input.departmentId);
  if (!(await updateVacancyFields(id, vacancy.status, toFields(input)))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "vacancy.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { fields: changed.join(", ") },
  });
  if (vacancy.status !== "DRAFT") {
    revalidateTag(CACHE_TAGS.vacancies, EXPIRE_NOW);
  }
  return getVacancyForStaff(id);
}

/** Publishes, closes or reopens a vacancy. Only someone who may publish (a Director) can. */
export async function changeVacancyStatus(
  staff: StaffContext,
  id: string,
  input: VacancyStatusChangeInput,
): Promise<StaffVacancyDetail> {
  if (!hasPermission(staff, "vacancies:publish")) {
    throw forbidden("Only a Director can publish or close a vacancy.");
  }
  const vacancy = await getVacancyForStaff(id);
  if (!VACANCY_TRANSITIONS[vacancy.status].includes(input.status)) {
    throw new AppError(
      "CONFLICT",
      `This vacancy is ${VACANCY_STATUS_LABELS[vacancy.status].toLowerCase()}, so it cannot be ${input.status === "PUBLISHED" ? "published" : "closed"}.`,
    );
  }
  if (input.status === "PUBLISHED" && new Date(vacancy.deadline).getTime() < Date.now()) {
    throw new AppError(
      "CONFLICT",
      "The deadline has passed. Move it to today or later, then publish.",
    );
  }
  const isMoved = await setVacancyStatus(id, {
    from: vacancy.status,
    to: input.status,
    publishedAt: input.status === "PUBLISHED" && !vacancy.publishedAt ? new Date() : undefined,
  });
  if (!isMoved) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "vacancy.status_changed",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { from: vacancy.status, to: input.status },
  });
  revalidateTag(CACHE_TAGS.vacancies, EXPIRE_NOW);
  return getVacancyForStaff(id);
}

/** Deletes a draft that nobody has applied to. Anything else is closed instead, never deleted. */
export async function deleteVacancy(staff: StaffContext, id: string): Promise<void> {
  if (!hasPermission(staff, "vacancies:write")) {
    throw forbidden("You do not have permission to delete vacancies.");
  }
  const vacancy = await getVacancyForStaff(id);
  if (vacancy.status !== "DRAFT") {
    throw new AppError(
      "CONFLICT",
      "Only a draft can be deleted. Close a published vacancy instead.",
    );
  }
  if (vacancy.applicationCount > 0) {
    throw new AppError("CONFLICT", "People have applied to this vacancy, so it cannot be deleted.");
  }
  if (!(await deleteDraftVacancy(id))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "vacancy.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { title: vacancy.title },
  });
}

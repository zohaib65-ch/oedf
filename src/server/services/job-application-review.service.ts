import "server-only";

import {
  INTERVIEW_STATUSES,
  JOB_APPLICATION_TRANSITIONS,
} from "@/lib/constants/job-application-workflow";
import { JOB_APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import { parseSort } from "@/lib/validations/common";
import type {
  JobApplicationStatusChangeInput,
  JobApplicationUpdateInput,
  ListJobApplicationsQuery,
} from "@/lib/validations/job-application-review";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import { fromPakistanDateTime } from "@/server/lib/day-range";
import {
  addJobApplicationNote,
  changeJobApplicationStatus,
  findJobApplicationDetail,
  listJobApplicationsForReview,
  setInterviewTime,
  setJobApplicationArchived,
  type JobApplicationDetail,
  type JobApplicationListItem,
} from "@/server/repositories/job-application-review.repository";
import { recordAudit } from "@/server/services/audit-log.service";

const ENTITY_TYPE = "JobApplication";
const STALE_MESSAGE =
  "This application was changed by someone else. Reload the page and try again.";
const ARCHIVED_MESSAGE = "Restore this application before changing it.";

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function assertMayReview(staff: StaffContext): void {
  if (!hasPermission(staff, "job-applications:review")) {
    throw new AppError("FORBIDDEN", "You do not have permission to review job applications.");
  }
}

export function getJobApplications(
  query: ListJobApplicationsQuery,
): Promise<{ items: JobApplicationListItem[]; total: number }> {
  return listJobApplicationsForReview({
    q: query.q,
    vacancyId: query.vacancyId,
    status: query.status,
    isArchived: query.view === "ARCHIVED",
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getJobApplicationDetail(id: string): Promise<JobApplicationDetail> {
  const application = isObjectId(id) ? await findJobApplicationDetail(id) : null;
  if (!application) {
    throw new AppError("NOT_FOUND", "This job application could not be found.");
  }
  return application;
}

/**
 * Moves a job application along the status flow and records who, when and why. Selection records
 * a recommendation only; candidates are not emailed about status changes.
 */
export async function changeStatus(
  staff: StaffContext,
  id: string,
  input: JobApplicationStatusChangeInput,
): Promise<JobApplicationDetail> {
  assertMayReview(staff);
  const application = await getJobApplicationDetail(id);
  if (application.archivedAt) {
    throw new AppError("CONFLICT", ARCHIVED_MESSAGE);
  }
  if (!JOB_APPLICATION_TRANSITIONS[application.status].includes(input.status)) {
    throw new AppError(
      "CONFLICT",
      `An application that is ${JOB_APPLICATION_STATUS_LABELS[application.status].toLowerCase()} cannot move to ${JOB_APPLICATION_STATUS_LABELS[input.status].toLowerCase()}.`,
    );
  }
  const isMoved = await changeJobApplicationStatus(id, {
    from: application.status,
    to: input.status,
    reason: input.reason,
    actor: { id: staff.id, name: staff.name },
  });
  if (!isMoved) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "job_application.status_changed",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { from: application.status, to: input.status, reason: input.reason },
  });
  return getJobApplicationDetail(id);
}

async function saveInterviewTime(
  staff: StaffContext,
  application: JobApplicationDetail,
  interviewAtLocal: string,
): Promise<void> {
  if (interviewAtLocal === application.interviewAtLocal) {
    return;
  }
  if (!INTERVIEW_STATUSES.includes(application.status)) {
    throw new AppError(
      "CONFLICT",
      "An interview time can be set only for a shortlisted candidate, one at the interview stage or one on hold.",
    );
  }
  const interviewAt = interviewAtLocal ? fromPakistanDateTime(interviewAtLocal) : null;
  if (!(await setInterviewTime(application.id, interviewAt, INTERVIEW_STATUSES))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "job_application.interview_set",
    entityType: ENTITY_TYPE,
    entityId: application.id,
    metadata: { interviewAt: interviewAt ? interviewAt.toISOString() : "cleared" },
  });
}

async function saveArchived(staff: StaffContext, id: string, isArchived: boolean): Promise<void> {
  if (!(await setJobApplicationArchived(id, isArchived))) {
    throw new AppError("NOT_FOUND", "This job application could not be found.");
  }
  await recordAudit(staff, {
    action: isArchived ? "job_application.archived" : "job_application.restored",
    entityType: ENTITY_TYPE,
    entityId: id,
  });
}

/**
 * Sets the interview time, or archives or restores the application. Job applications are never
 * deleted; an archived one is read-only until it is restored.
 */
export async function updateJobApplication(
  staff: StaffContext,
  id: string,
  input: JobApplicationUpdateInput,
): Promise<JobApplicationDetail> {
  assertMayReview(staff);
  const application = await getJobApplicationDetail(id);
  const isArchived = application.archivedAt !== null;

  if (input.isArchived === false && isArchived) {
    await saveArchived(staff, id, false);
  }
  if (input.interviewAt !== undefined) {
    if (isArchived && input.isArchived !== false) {
      throw new AppError("CONFLICT", ARCHIVED_MESSAGE);
    }
    await saveInterviewTime(staff, application, input.interviewAt);
  }
  if (input.isArchived === true && !isArchived) {
    await saveArchived(staff, id, true);
  }
  return getJobApplicationDetail(id);
}

export async function addNote(
  staff: StaffContext,
  id: string,
  body: string,
): Promise<JobApplicationDetail> {
  assertMayReview(staff);
  if ((await getJobApplicationDetail(id)).archivedAt) {
    throw new AppError("CONFLICT", ARCHIVED_MESSAGE);
  }
  if (!(await addJobApplicationNote(id, { id: staff.id, name: staff.name }, body))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "job_application.note_added",
    entityType: ENTITY_TYPE,
    entityId: id,
  });
  return getJobApplicationDetail(id);
}

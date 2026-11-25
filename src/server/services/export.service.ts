import "server-only";

import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TYPE_LABELS,
  JOB_APPLICATION_STATUS_LABELS,
} from "@/lib/constants/labels";
import { hasPermission, type Permission } from "@/lib/constants/permissions";
import type { ListApplicationsQuery } from "@/lib/validations/application-review";
import type { ListJobApplicationsQuery } from "@/lib/validations/job-application-review";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import { toCsv } from "@/server/lib/csv";
import { toPakistanDateTime, toPakistanDay } from "@/server/lib/day-range";
import { getApplications } from "@/server/services/application-review.service";
import { recordAudit } from "@/server/services/audit-log.service";
import { getJobApplications } from "@/server/services/job-application-review.service";

/** A larger export is refused; narrowing the filters keeps the file useful and the server quick. */
const MAX_EXPORT_ROWS = 5000;

export interface CsvExport {
  fileName: string;
  csv: string;
}

/** Exports are about a list, not one record. */
const LIST_ENTITY_ID = "list";

const dateTime = (iso: string) => toPakistanDateTime(new Date(iso)).replace("T", " ");

function assertMayExport(staff: StaffContext, permission: Permission): void {
  if (!hasPermission(staff, permission)) {
    throw new AppError("FORBIDDEN", "You do not have permission to export this list.");
  }
}

function assertNotTooLarge(total: number): void {
  if (total > MAX_EXPORT_ROWS) {
    throw new AppError(
      "VALIDATION_ERROR",
      `This list has ${String(total)} rows. Narrow the filters to ${String(MAX_EXPORT_ROWS)} or fewer to export it.`,
    );
  }
}

/** Only the filters that were used, for the audit log. */
function usedFilters(filters: Record<string, string | undefined>): string {
  return Object.entries(filters)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${value ?? ""}`)
    .join(", ");
}

/**
 * The filtered applications list as CSV, in the list's order. It has the list's columns only:
 * no CNIC, contact or financial details. Every export is recorded in the audit log.
 */
export async function exportApplications(
  staff: StaffContext,
  query: ListApplicationsQuery,
): Promise<CsvExport> {
  assertMayExport(staff, "applications:export");
  const { items, total } = await getApplications({ ...query, page: 1, pageSize: MAX_EXPORT_ROWS });
  assertNotTooLarge(total);
  await recordAudit(staff, {
    action: "applications.exported",
    entityType: "Application",
    entityId: LIST_ENTITY_ID,
    metadata: {
      rows: String(items.length),
      filters: usedFilters({
        q: query.q,
        type: query.type,
        status: query.status,
        programId: query.programId,
        city: query.city,
        from: query.from,
        to: query.to,
        view: query.view,
      }),
    },
  });
  return {
    fileName: `applications-${toPakistanDay(new Date())}.csv`,
    csv: toCsv(
      ["Reference", "Type", "Status", "Applicant", "City", "Program", "Submitted (PKT)"],
      items.map((item) => [
        item.referenceNumber,
        APPLICATION_TYPE_LABELS[item.type],
        APPLICATION_STATUS_LABELS[item.status],
        item.applicantName,
        item.city,
        item.programTitle,
        dateTime(item.createdAt),
      ]),
    ),
  };
}

/** The filtered job applications list as CSV, without CNIC or contact details. Audit-logged. */
export async function exportJobApplications(
  staff: StaffContext,
  query: ListJobApplicationsQuery,
): Promise<CsvExport> {
  assertMayExport(staff, "job-applications:export");
  const { items, total } = await getJobApplications({
    ...query,
    page: 1,
    pageSize: MAX_EXPORT_ROWS,
  });
  assertNotTooLarge(total);
  await recordAudit(staff, {
    action: "job_applications.exported",
    entityType: "JobApplication",
    entityId: LIST_ENTITY_ID,
    metadata: {
      rows: String(items.length),
      filters: usedFilters({
        q: query.q,
        vacancyId: query.vacancyId,
        status: query.status,
        view: query.view,
      }),
    },
  });
  return {
    fileName: `job-applications-${toPakistanDay(new Date())}.csv`,
    csv: toCsv(
      ["Reference", "Status", "Candidate", "City", "Vacancy", "Interview (PKT)", "Received (PKT)"],
      items.map((item) => [
        item.referenceNumber,
        JOB_APPLICATION_STATUS_LABELS[item.status],
        item.candidateName,
        item.city,
        item.vacancyTitle,
        item.interviewAt ? dateTime(item.interviewAt) : null,
        dateTime(item.createdAt),
      ]),
    ),
  };
}

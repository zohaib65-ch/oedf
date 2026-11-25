import "server-only";

import { AWARD_PERIOD_LABELS, AWARD_STATUS_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import type {
  AwardDeleteInput,
  AwardFormInput,
  ListAwardsQuery,
} from "@/lib/validations/application-review";
import { parseSort } from "@/lib/validations/common";
import type { StaffContext } from "@/server/auth/api-session";
import { withTransaction } from "@/server/db/transaction";
import { sendEmail } from "@/server/email/send-email";
import { ScholarshipEndedEmail } from "@/server/email/templates/scholarship-ended-email";
import { AppError } from "@/server/http/errors";
import { toDayRange } from "@/server/lib/day-range";
import { findApplicationDetail } from "@/server/repositories/application-review.repository";
import {
  addAwardNote,
  deleteAward as deleteAwardRecord,
  findAwardById,
  listAwards,
  updateAward,
  type AwardDetail,
  type AwardListItem,
} from "@/server/repositories/scholarship-award.repository";
import { recordAudit } from "@/server/services/audit-log.service";

const ENTITY_TYPE = "ScholarshipAward";
const NOT_FOUND = "This award could not be found.";

export async function getAwards(
  query: ListAwardsQuery,
): Promise<{ items: AwardListItem[]; total: number }> {
  return listAwards({
    q: query.q,
    status: query.status,
    renewalBefore: toDayRange(undefined, query.renewalBefore).to,
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getAward(id: string): Promise<AwardDetail> {
  const award = /^[0-9a-f]{24}$/.test(id) ? await findAwardById(id) : null;
  if (!award) {
    throw new AppError("NOT_FOUND", NOT_FOUND);
  }
  return award;
}

/** What changed, in words, for the audit log: "Amount: 5000 to 6000". */
function describeChanges(before: AwardDetail, after: AwardFormInput): Record<string, string> {
  const changes: Record<string, string> = {};
  if (before.amountPkr !== after.amountPkr) {
    changes.amountPkr = `${before.amountPkr} to ${after.amountPkr}`;
  }
  if (before.period !== after.period) {
    changes.period = `${AWARD_PERIOD_LABELS[before.period]} to ${AWARD_PERIOD_LABELS[after.period]}`;
  }
  if (before.startDate !== after.startDate) {
    changes.startDate = `${before.startDate} to ${after.startDate}`;
  }
  const renewalDate = after.renewalDate || null;
  if (before.renewalDate !== renewalDate) {
    changes.renewalDate = `${before.renewalDate ?? "none"} to ${renewalDate ?? "none"}`;
  }
  if (before.status !== after.status) {
    changes.status = `${AWARD_STATUS_LABELS[before.status]} to ${AWARD_STATUS_LABELS[after.status]}`;
  }
  return changes;
}

export async function saveAward(
  staff: StaffContext,
  id: string,
  input: AwardFormInput,
): Promise<AwardDetail> {
  const before = await getAward(id);
  const changes = describeChanges(before, input);
  if (Object.keys(changes).length === 0) {
    return before;
  }
  await updateAward(id, {
    amountPkr: input.amountPkr,
    period: input.period,
    startDate: new Date(`${input.startDate}T00:00:00Z`),
    renewalDate: input.renewalDate ? new Date(`${input.renewalDate}T00:00:00Z`) : null,
    status: input.status,
  });
  await recordAudit(staff, {
    action: "award.updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: changes,
  });
  return getAward(id);
}

export async function addAwardProgressNote(
  staff: StaffContext,
  id: string,
  body: string,
): Promise<AwardDetail> {
  const isAdded =
    /^[0-9a-f]{24}$/.test(id) && (await addAwardNote(id, { id: staff.id, name: staff.name }, body));
  if (!isAdded) {
    throw new AppError("NOT_FOUND", NOT_FOUND);
  }
  await recordAudit(staff, { action: "award.note_added", entityType: ENTITY_TYPE, entityId: id });
  return getAward(id);
}

/**
 * Deletes an award and ends the scholarship, after a confirmation with a reason. Needs
 * `awards:manage` and `content:delete` (the Admissions Director, Super Admin). The application is
 * marked as ended with the reason, the student is emailed the reason, and the status page shows it.
 */
export async function deleteAward(
  staff: StaffContext,
  id: string,
  input: AwardDeleteInput,
): Promise<void> {
  if (!hasPermission(staff, "awards:manage") || !hasPermission(staff, "content:delete")) {
    throw new AppError("FORBIDDEN", "You do not have permission to delete awards.");
  }
  const award = await getAward(id);
  const application = await findApplicationDetail(award.applicationId);
  const isDeleted = await withTransaction((session) =>
    deleteAwardRecord(
      { id, applicationId: award.applicationId },
      { reason: input.reason, actor: { id: staff.id, name: staff.name } },
      session,
    ),
  );
  if (!isDeleted) {
    throw new AppError("NOT_FOUND", NOT_FOUND);
  }
  if (application) {
    await sendEmail({
      to: application.applicant.email,
      subject: `Your scholarship has ended (${award.referenceNumber})`,
      template: ScholarshipEndedEmail({
        applicantName: application.applicant.fullName,
        referenceNumber: award.referenceNumber,
        reason: input.reason,
      }),
    });
  }
  await recordAudit(staff, {
    action: "award.deleted",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: {
      referenceNumber: award.referenceNumber,
      studentName: award.studentName,
      reason: input.reason,
    },
  });
}

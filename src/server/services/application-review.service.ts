import "server-only";

import {
  APPLICATION_TRANSITIONS,
  CHECKLIST_EDITABLE_STATUSES,
  permissionForStatus,
} from "@/lib/constants/application-workflow";
import { APPLICATION_STATUS_LABELS } from "@/lib/constants/labels";
import { hasPermission } from "@/lib/constants/permissions";
import type {
  ApplicationStatusChangeInput,
  ChecklistInput,
  ListApplicationsQuery,
} from "@/lib/validations/application-review";
import { splitLines } from "@/lib/validations/application-review";
import { parseSort } from "@/lib/validations/common";
import type { StaffContext } from "@/server/auth/api-session";
import { withTransaction } from "@/server/db/transaction";
import { sendEmail } from "@/server/email/send-email";
import { ApplicationDecisionEmail } from "@/server/email/templates/application-decision-email";
import { ApplicationIncompleteEmail } from "@/server/email/templates/application-incomplete-email";
import { AppError } from "@/server/http/errors";
import { toDayRange } from "@/server/lib/day-range";
import {
  addApplicationNote,
  changeApplicationStatus,
  findApplicationDetail,
  listApplicationsForReview,
  saveChecklist,
  type ApplicationDetail,
  type ApplicationListItem,
} from "@/server/repositories/application-review.repository";
import { createAward } from "@/server/repositories/scholarship-award.repository";
import { recordAudit } from "@/server/services/audit-log.service";

const ENTITY_TYPE = "Application";
const STALE_MESSAGE =
  "This application was changed by someone else. Reload the page and try again.";

export async function getApplications(
  query: ListApplicationsQuery,
): Promise<{ items: ApplicationListItem[]; total: number }> {
  return listApplicationsForReview({
    q: query.q,
    type: query.type,
    status: query.status,
    programId: query.programId,
    city: query.city,
    ...toDayRange(query.from, query.to),
    sort: parseSort(query.sort),
    page: query.page,
    pageSize: query.pageSize,
  });
}

export async function getApplicationDetail(id: string): Promise<ApplicationDetail> {
  const application = /^[0-9a-f]{24}$/.test(id) ? await findApplicationDetail(id) : null;
  if (!application) {
    throw new AppError("NOT_FOUND", "This application could not be found.");
  }
  return application;
}

/** Saves the verification checklist. Only possible while the application is still being checked. */
export async function updateChecklist(
  staff: StaffContext,
  id: string,
  checklist: ChecklistInput,
): Promise<ApplicationDetail> {
  const application = await getApplicationDetail(id);
  if (!CHECKLIST_EDITABLE_STATUSES.includes(application.status)) {
    throw new AppError("CONFLICT", "The checklist cannot change once the application is verified.");
  }
  const changed = (Object.keys(checklist) as (keyof ChecklistInput)[]).filter(
    (key) => checklist[key] !== application.checklist[key],
  );
  if (changed.length === 0) {
    return application;
  }
  if (!(await saveChecklist(id, checklist, CHECKLIST_EDITABLE_STATUSES))) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
  await recordAudit(staff, {
    action: "application.checklist_updated",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: Object.fromEntries(changed.map((key) => [key, String(checklist[key])])),
  });
  return getApplicationDetail(id);
}

const isChecklistComplete = (checklist: ApplicationDetail["checklist"]) =>
  checklist.identity && checklist.education && checklist.eligibility && checklist.documents;

/** Every rule a move must pass before anything is written. */
function assertMoveAllowed(
  staff: StaffContext,
  application: ApplicationDetail,
  input: ApplicationStatusChangeInput,
): void {
  if (!hasPermission(staff, permissionForStatus(input.status))) {
    throw new AppError("FORBIDDEN", "You do not have permission to make this decision.");
  }
  if (!APPLICATION_TRANSITIONS[application.status].includes(input.status)) {
    throw new AppError(
      "CONFLICT",
      `An application that is ${APPLICATION_STATUS_LABELS[application.status].toLowerCase()} cannot move to ${APPLICATION_STATUS_LABELS[input.status].toLowerCase()}.`,
    );
  }
  if (input.status === "VERIFIED" && !isChecklistComplete(application.checklist)) {
    throw new AppError(
      "CONFLICT",
      "Complete the verification checklist before marking it verified.",
    );
  }
  if (input.status === "APPROVED" && application.type === "SCHOLARSHIP" && !input.award) {
    const message = "Enter the award details to approve a scholarship";
    throw new AppError("VALIDATION_ERROR", message, {
      fieldErrors: {
        "award.amountPkr": [message],
        "award.period": ["Choose a period"],
        "award.startDate": ["Enter a valid date"],
      },
    });
  }
}

/** Emails the applicant when the status is one they must hear about. A failed email never undoes the move. */
async function notifyApplicant(
  application: ApplicationDetail,
  input: ApplicationStatusChangeInput,
): Promise<void> {
  const { email, fullName } = application.applicant;
  if (input.status === "INCOMPLETE") {
    await sendEmail({
      to: email,
      subject: `We need more documents (${application.referenceNumber})`,
      template: ApplicationIncompleteEmail({
        applicantName: fullName,
        referenceNumber: application.referenceNumber,
        missingItems: splitLines(input.missingItems),
      }),
    });
  }
  if (input.status === "APPROVED" || input.status === "REJECTED") {
    await sendEmail({
      to: email,
      subject: `A decision on your application (${application.referenceNumber})`,
      template: ApplicationDecisionEmail({
        applicantName: fullName,
        referenceNumber: application.referenceNumber,
        type: application.type,
        isApproved: input.status === "APPROVED",
      }),
    });
  }
}

/**
 * Moves an application along the status flow and records who, when and why. Approving a
 * scholarship also creates its award, in the same transaction.
 */
export async function changeStatus(
  staff: StaffContext,
  id: string,
  input: ApplicationStatusChangeInput,
): Promise<ApplicationDetail> {
  // Someone who may neither review nor decide learns nothing about the application, not even its status.
  if (
    !hasPermission(staff, "applications:review") &&
    !hasPermission(staff, "applications:decide")
  ) {
    throw new AppError("FORBIDDEN", "You do not have permission to change applications.");
  }
  const application = await getApplicationDetail(id);
  assertMoveAllowed(staff, application, input);

  const isDecision = input.status === "APPROVED" || input.status === "REJECTED";
  const award =
    input.status === "APPROVED" && application.type === "SCHOLARSHIP" ? input.award : undefined;
  await withTransaction(async (session) => {
    const isMoved = await changeApplicationStatus(
      id,
      {
        from: application.status,
        to: input.status,
        reason: input.reason,
        actor: { id: staff.id, name: staff.name },
        missingItems: input.status === "INCOMPLETE" ? splitLines(input.missingItems) : [],
        requiresCompleteChecklist: input.status === "VERIFIED",
        isDecision,
      },
      session,
    );
    if (!isMoved) {
      throw new AppError("CONFLICT", STALE_MESSAGE);
    }
    if (award) {
      await createAward(
        {
          applicationId: id,
          referenceNumber: application.referenceNumber,
          studentName: application.applicant.fullName,
          amountPkr: award.amountPkr,
          period: award.period,
          startDate: award.startDate,
          renewalDate: award.renewalDate || null,
        },
        session,
      );
    }
  });

  await recordAudit(staff, {
    action: "application.status_changed",
    entityType: ENTITY_TYPE,
    entityId: id,
    metadata: { from: application.status, to: input.status, reason: input.reason },
  });
  await notifyApplicant(application, input);
  return getApplicationDetail(id);
}

export async function addNote(
  staff: StaffContext,
  id: string,
  body: string,
): Promise<ApplicationDetail> {
  const isAdded =
    /^[0-9a-f]{24}$/.test(id) &&
    (await addApplicationNote(id, { id: staff.id, name: staff.name }, body));
  if (!isAdded) {
    throw new AppError("NOT_FOUND", "This application could not be found.");
  }
  await recordAudit(staff, {
    action: "application.note_added",
    entityType: ENTITY_TYPE,
    entityId: id,
  });
  return getApplicationDetail(id);
}

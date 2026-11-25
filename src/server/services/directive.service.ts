import "server-only";

import {
  CLARIFIABLE_ASSIGNMENT_STATUSES,
  isFinished,
  isOverdue,
  PROGRESS_TRANSITIONS,
} from "@/lib/constants/directive-workflow";
import type { ASSIGNMENT_STATUSES } from "@/lib/constants/enums";
import {
  ASSIGNMENT_STATUS_LABELS,
  CLARIFICATION_DECISION_LABELS,
  CLARIFICATION_REASON_LABELS,
  DIRECTIVE_PRIORITY_LABELS,
} from "@/lib/constants/labels";
import { hasPermission, type Permission } from "@/lib/constants/permissions";
import { formatDay } from "@/lib/format";
import { parseSort } from "@/lib/validations/common";
import type {
  ClarificationRequestInput,
  ClarificationResolutionInput,
  DirectiveNoteInput,
  IssueDirectiveInput,
  ListDirectivesQuery,
  UpdateAssignmentInput,
} from "@/lib/validations/directive";
import type { StaffContext } from "@/server/auth/api-session";
import { newId } from "@/server/db/object-id";
import { withTransaction } from "@/server/db/transaction";
import { sendEmail } from "@/server/email/send-email";
import { ClarificationRequestedEmail } from "@/server/email/templates/clarification-requested-email";
import { DirectiveIssuedEmail } from "@/server/email/templates/directive-issued-email";
import { AppError } from "@/server/http/errors";
import { toPakistanDay } from "@/server/lib/day-range";
import { logger } from "@/server/lib/logger";
import { nextSequence } from "@/server/repositories/counter.repository";
import {
  listDepartmentsForStaff,
  type StaffDepartmentRecord,
} from "@/server/repositories/department.repository";
import {
  acknowledgementFields,
  addAssignmentUpdate,
  clarificationFields,
  createDirective,
  findDirective,
  listDirectives,
  moveAssignment,
  resolutionFields,
  setAssignmentOwner,
  type AssignmentDetail,
  type DirectiveDetail,
  type DirectiveListItem,
} from "@/server/repositories/directive.repository";
import { listActiveStaff, type StaffMember } from "@/server/repositories/user.repository";
import { recordAudit } from "@/server/services/audit-log.service";

type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

const ENTITY_TYPE = "Directive";
const SEQUENCE_DIGITS = 3;
const STALE_MESSAGE = "This directive was changed by someone else. Reload the page and try again.";
const NOT_FOUND_MESSAGE = "This directive could not be found.";
/** Roles that oversee every office's directives. */
const OVERSEEING_ROLES: ReadonlySet<string> = new Set(["SUPER_ADMIN", "CEO_OFFICE"]);

const isObjectId = (id: string) => /^[0-9a-f]{24}$/.test(id);

function forbidden(message: string): AppError {
  return new AppError("FORBIDDEN", message);
}

function assertPermission(staff: StaffContext, permission: Permission, message: string): void {
  if (!hasPermission(staff, permission)) {
    throw forbidden(message);
  }
}

/** The CEO Office, Super Admin and the issuing Research & Policy Institute see every directive. */
function seesEveryDirective(staff: StaffContext): boolean {
  return OVERSEEING_ROLES.has(staff.role) || staff.departmentCode === "RESEARCH_POLICY";
}

export interface AssignmentView extends AssignmentDetail {
  departmentName: string;
  isOverdue: boolean;
}

export interface DirectiveView extends Omit<DirectiveDetail, "assignments"> {
  assignments: AssignmentView[];
  isOverdue: boolean;
}

export interface DirectiveListView extends Omit<DirectiveListItem, "assignments"> {
  assignments: (DirectiveListItem["assignments"][number] & {
    departmentName: string;
    isOverdue: boolean;
  })[];
  isOverdue: boolean;
}

async function getDepartmentNames(): Promise<Map<string, StaffDepartmentRecord>> {
  const departments = await listDepartmentsForStaff();
  return new Map(departments.map((department) => [department.id, department]));
}

function withOfficeDetails<T extends { departmentId: string; status: AssignmentStatus }>(
  assignment: T,
  dueDate: string,
  departments: Map<string, StaffDepartmentRecord>,
  today: string,
): T & { departmentName: string; isOverdue: boolean } {
  return {
    ...assignment,
    departmentName: departments.get(assignment.departmentId)?.name ?? "Unknown office",
    isOverdue: isOverdue(dueDate, assignment.status, today),
  };
}

/** Directives this person may see: every one, or those addressed to their office. */
export async function getDirectives(
  staff: StaffContext,
  query: ListDirectivesQuery,
): Promise<{ items: DirectiveListView[]; total: number }> {
  const today = toPakistanDay(new Date());
  const isOfficeView = !seesEveryDirective(staff);
  if (isOfficeView && !staff.departmentId) {
    return { items: [], total: 0 };
  }
  const [{ items, total }, departments] = await Promise.all([
    listDirectives({
      q: query.q,
      priority: query.priority,
      status: query.status,
      overdueBefore: query.show === "OVERDUE" ? today : undefined,
      departmentId: isOfficeView ? staff.departmentId : null,
      sort: parseSort(query.sort),
      page: query.page,
      pageSize: query.pageSize,
    }),
    getDepartmentNames(),
  ]);
  return {
    total,
    items: items.map((item) => {
      const assignments = item.assignments.map((assignment) =>
        withOfficeDetails(assignment, item.dueDate, departments, today),
      );
      return {
        ...item,
        assignments,
        isOverdue: assignments.some((assignment) => assignment.isOverdue),
      };
    }),
  };
}

/** One directive, if this person may see it. Others get "not found", so nothing leaks. */
export async function getDirective(staff: StaffContext, id: string): Promise<DirectiveView> {
  const [directive, departments] = await Promise.all([
    isObjectId(id) ? findDirective(id) : Promise.resolve(null),
    getDepartmentNames(),
  ]);
  const isVisible =
    directive !== null &&
    (seesEveryDirective(staff) ||
      directive.assignments.some((assignment) => assignment.departmentId === staff.departmentId));
  if (!directive || !isVisible) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  const today = toPakistanDay(new Date());
  const assignments = directive.assignments.map((assignment) =>
    withOfficeDetails(assignment, directive.dueDate, departments, today),
  );
  return {
    ...directive,
    assignments,
    isOverdue: assignments.some((assignment) => assignment.isOverdue),
  };
}

/** Whether this person may act for the office an assignment belongs to. Super Admin acts for any. */
export function actsForOffice(staff: StaffContext, assignment: { departmentId: string }): boolean {
  return staff.role === "SUPER_ADMIN" || staff.departmentId === assignment.departmentId;
}

async function getAssignment(
  staff: StaffContext,
  id: string,
  assignmentId: string,
): Promise<{ directive: DirectiveView; assignment: AssignmentView }> {
  const directive = await getDirective(staff, id);
  const assignment = directive.assignments.find((item) => item.id === assignmentId);
  if (!assignment) {
    throw new AppError("NOT_FOUND", "This office's part of the directive could not be found.");
  }
  return { directive, assignment };
}

function assertOwnOffice(staff: StaffContext, assignment: AssignmentView): void {
  if (!actsForOffice(staff, assignment)) {
    throw forbidden("Only the office this part is addressed to can do this.");
  }
}

function assertStatus(
  assignment: AssignmentView,
  allowed: readonly AssignmentStatus[],
  message: string,
): void {
  if (!allowed.includes(assignment.status)) {
    throw new AppError("CONFLICT", message);
  }
}

async function move(
  id: string,
  assignment: AssignmentView,
  to: AssignmentStatus,
  reason: string,
  staff: StaffContext,
  set?: Record<string, unknown>,
): Promise<void> {
  const isMoved = await moveAssignment(id, assignment.id, {
    from: assignment.status,
    to,
    reason,
    actor: { id: staff.id, name: staff.name },
    ...(set ? { set } : {}),
  });
  if (!isMoved) {
    throw new AppError("CONFLICT", STALE_MESSAGE);
  }
}

async function audit(
  staff: StaffContext,
  action: string,
  id: string,
  metadata: Record<string, string>,
): Promise<void> {
  await recordAudit(staff, { action, entityType: ENTITY_TYPE, entityId: id, metadata });
}

/** Emails the Directors of each target office, or the office's own address when it has no Director. */
async function notifyTargetOffices(
  directive: { id: string; referenceNumber: string; title: string } & Pick<
    IssueDirectiveInput,
    "departmentIds" | "priority" | "dueDate"
  >,
  departments: Map<string, StaffDepartmentRecord>,
): Promise<void> {
  const directors = await listActiveStaff({
    roles: ["DIRECTOR"],
    departmentIds: directive.departmentIds,
  });
  await Promise.all(
    directive.departmentIds.map(async (departmentId) => {
      const office = departments.get(departmentId);
      const recipients = recipientsFor(
        directors.filter((director) => director.departmentId === departmentId),
        office?.notificationEmail,
        office?.name ?? departmentId,
      );
      await Promise.all(
        recipients.map((to) =>
          sendEmail({
            to,
            subject: `New directive ${directive.referenceNumber}: ${directive.title}`,
            template: DirectiveIssuedEmail({
              directiveId: directive.id,
              referenceNumber: directive.referenceNumber,
              title: directive.title,
              officeName: office?.name ?? "your office",
              priorityLabel: DIRECTIVE_PRIORITY_LABELS[directive.priority],
              dueLabel: formatDay(directive.dueDate),
            }),
          }),
        ),
      );
    }),
  );
}

/** The people's addresses, or the office's own address when nobody holds the role. Logged when empty. */
function recipientsFor(
  people: readonly StaffMember[],
  fallback: string | undefined,
  officeName: string,
): string[] {
  const emails = people.map((person) => person.email);
  const recipients = emails.length > 0 ? emails : fallback ? [fallback] : [];
  if (recipients.length === 0) {
    logger.warn({ office: officeName }, "Nobody to email about a directive");
  }
  return recipients;
}

/** Issues a directive to one or more offices, with a reference such as OEDF-DIR-2026-001. */
export async function issueDirective(
  staff: StaffContext,
  input: IssueDirectiveInput,
): Promise<DirectiveView> {
  assertPermission(
    staff,
    "directives:issue",
    "Only the Research & Policy Institute can issue directives.",
  );
  const today = toPakistanDay(new Date());
  if (input.dueDate < today) {
    throw new AppError("VALIDATION_ERROR", "The due date cannot be in the past", {
      fieldErrors: { dueDate: ["The due date cannot be in the past"] },
    });
  }
  const departments = await getDepartmentNames();
  const departmentIds = [...new Set(input.departmentIds)];
  if (departmentIds.some((departmentId) => !departments.has(departmentId))) {
    throw new AppError("VALIDATION_ERROR", "Choose offices from the list", {
      fieldErrors: { departmentIds: ["Choose offices from the list"] },
    });
  }

  const id = newId();
  const year = today.slice(0, 4);
  const referenceNumber = await withTransaction(async (session) => {
    const sequence = await nextSequence(`DIR-${year}`, session);
    const reference = `OEDF-DIR-${year}-${String(sequence).padStart(SEQUENCE_DIGITS, "0")}`;
    await createDirective(
      {
        id,
        referenceNumber: reference,
        title: input.title,
        body: input.body,
        priority: input.priority,
        dueDate: input.dueDate,
        departmentIds,
        issuedBy: { id: staff.id, name: staff.name },
      },
      session,
    );
    return reference;
  });
  await audit(staff, "directive.issued", id, {
    referenceNumber,
    offices: departmentIds.map((departmentId) => departments.get(departmentId)?.name).join(", "),
  });
  await notifyTargetOffices({ ...input, departmentIds, id, referenceNumber }, departments);
  return getDirective(staff, id);
}

/** The office's Director confirms the office has received the directive. */
export async function acknowledgeAssignment(
  staff: StaffContext,
  id: string,
  assignmentId: string,
): Promise<DirectiveView> {
  assertPermission(staff, "directives:respond", "Only a Director can acknowledge a directive.");
  const { assignment } = await getAssignment(staff, id, assignmentId);
  assertOwnOffice(staff, assignment);
  assertStatus(assignment, ["PENDING_ACKNOWLEDGEMENT"], "This directive was already acknowledged.");
  await move(id, assignment, "ACKNOWLEDGED", "Acknowledged", staff, acknowledgementFields(staff));
  await audit(staff, "directive.acknowledged", id, { office: assignment.departmentName });
  return getDirective(staff, id);
}

/** Names the owner (the Director's call), or starts or completes the work (anyone in the office). */
export async function updateAssignment(
  staff: StaffContext,
  id: string,
  assignmentId: string,
  input: UpdateAssignmentInput,
): Promise<DirectiveView> {
  const { assignment } = await getAssignment(staff, id, assignmentId);
  assertOwnOffice(staff, assignment);

  if (input.ownerId !== undefined) {
    assertPermission(staff, "directives:respond", "Only a Director can choose who owns the work.");
    const openStatuses: AssignmentStatus[] = ["ACKNOWLEDGED", "IN_PROGRESS"];
    assertStatus(
      assignment,
      openStatuses,
      "Acknowledge the directive before choosing an owner, and only while the work is open.",
    );
    const [owner] = (
      await listActiveStaff({
        roles: ["DIRECTOR", "STAFF"],
        departmentIds: [assignment.departmentId],
      })
    ).filter((member) => member.id === input.ownerId);
    if (!owner) {
      throw new AppError("VALIDATION_ERROR", "Choose someone from this office", {
        fieldErrors: { ownerId: ["Choose someone from this office"] },
      });
    }
    const body = input.note ? `Owner: ${owner.name}. ${input.note}` : `Owner: ${owner.name}.`;
    const isSaved = await setAssignmentOwner(
      id,
      assignment.id,
      { id: owner.id, name: owner.name },
      { author: { id: staff.id, name: staff.name }, body },
      openStatuses,
    );
    if (!isSaved) {
      throw new AppError("CONFLICT", STALE_MESSAGE);
    }
    await audit(staff, "directive.owner_assigned", id, {
      office: assignment.departmentName,
      owner: owner.name,
    });
  }

  if (input.status !== undefined) {
    assertPermission(staff, "directives:update", "You cannot update this directive.");
    // The owner was just saved, so the status the move expects is re-read.
    const { assignment: current } = await getAssignment(staff, id, assignmentId);
    if (!PROGRESS_TRANSITIONS[current.status]?.includes(input.status)) {
      throw new AppError(
        "CONFLICT",
        `The work cannot move from ${ASSIGNMENT_STATUS_LABELS[current.status].toLowerCase()} to ${ASSIGNMENT_STATUS_LABELS[input.status].toLowerCase()}.`,
      );
    }
    await move(
      id,
      current,
      input.status,
      input.note,
      staff,
      input.status === "COMPLETED" ? { completedAt: new Date() } : undefined,
    );
    await audit(staff, "directive.status_changed", id, {
      office: current.departmentName,
      from: current.status,
      to: input.status,
    });
  }
  return getDirective(staff, id);
}

/** A progress update from the office, while its part is open. */
export async function addDirectiveNote(
  staff: StaffContext,
  id: string,
  input: DirectiveNoteInput,
): Promise<DirectiveView> {
  assertPermission(staff, "directives:update", "You cannot update this directive.");
  const { assignment } = await getAssignment(staff, id, input.assignmentId);
  assertOwnOffice(staff, assignment);
  if (isFinished(assignment.status)) {
    throw new AppError("CONFLICT", "This office's part is finished, so no more updates are added.");
  }
  const isAdded = await addAssignmentUpdate(id, assignment.id, {
    author: { id: staff.id, name: staff.name },
    body: input.body,
  });
  if (!isAdded) {
    throw new AppError("NOT_FOUND", NOT_FOUND_MESSAGE);
  }
  await audit(staff, "directive.note_added", id, { office: assignment.departmentName });
  return getDirective(staff, id);
}

/** The office asks the CEO Office to clarify, for one of the reasons the policy allows. */
export async function requestClarification(
  staff: StaffContext,
  id: string,
  input: ClarificationRequestInput,
): Promise<DirectiveView> {
  assertPermission(staff, "directives:respond", "Only a Director can ask for clarification.");
  const { directive, assignment } = await getAssignment(staff, id, input.assignmentId);
  assertOwnOffice(staff, assignment);
  assertStatus(
    assignment,
    CLARIFIABLE_ASSIGNMENT_STATUSES,
    "Clarification can only be asked for while the office's part is open.",
  );
  const reasonLabel = CLARIFICATION_REASON_LABELS[input.reason];
  await move(
    id,
    assignment,
    "CLARIFICATION_REQUESTED",
    `${reasonLabel}: ${input.text}`,
    staff,
    clarificationFields({
      reason: input.reason,
      text: input.text,
      actor: { id: staff.id, name: staff.name },
    }),
  );
  await audit(staff, "directive.clarification_requested", id, {
    office: assignment.departmentName,
    reason: input.reason,
  });

  const departments = [...(await getDepartmentNames()).values()];
  const ceoOffice = departments.find((department) => department.code === "CEO_OFFICE");
  const recipients = recipientsFor(
    await listActiveStaff({ roles: ["CEO_OFFICE"] }),
    ceoOffice?.notificationEmail,
    "CEO Office",
  );
  await Promise.all(
    recipients.map((to) =>
      sendEmail({
        to,
        subject: `Clarification requested on ${directive.referenceNumber}`,
        template: ClarificationRequestedEmail({
          directiveId: id,
          referenceNumber: directive.referenceNumber,
          title: directive.title,
          officeName: assignment.departmentName,
          reasonLabel,
        }),
      }),
    ),
  );
  return getDirective(staff, id);
}

/**
 * The CEO Office settles a clarification: reopen returns the office's part to where it was before
 * the request; close releases the office from the directive.
 */
export async function resolveClarification(
  staff: StaffContext,
  id: string,
  input: ClarificationResolutionInput,
): Promise<DirectiveView> {
  assertPermission(staff, "directives:resolve", "Only the CEO Office can resolve a clarification.");
  const { assignment } = await getAssignment(staff, id, input.assignmentId);
  assertStatus(
    assignment,
    ["CLARIFICATION_REQUESTED"],
    "There is no open clarification request for this office.",
  );
  const request = assignment.history.findLast((entry) => entry.to === "CLARIFICATION_REQUESTED");
  const reopenTo: AssignmentStatus = request?.from ?? "PENDING_ACKNOWLEDGEMENT";
  await move(
    id,
    assignment,
    input.decision === "REOPEN" ? reopenTo : "CLOSED",
    `${CLARIFICATION_DECISION_LABELS[input.decision]}. ${input.note}`,
    staff,
    resolutionFields({
      decision: input.decision,
      note: input.note,
      actor: { id: staff.id, name: staff.name },
    }),
  );
  await audit(staff, "directive.clarification_resolved", id, {
    office: assignment.departmentName,
    decision: input.decision,
  });
  return getDirective(staff, id);
}

/** People in an office who can own its part of a directive, for the Director's choice. */
export async function getOwnerChoices(
  departmentId: string,
): Promise<{ id: string; name: string }[]> {
  const members = await listActiveStaff({
    roles: ["DIRECTOR", "STAFF"],
    departmentIds: [departmentId],
  });
  return members.map((member) => ({ id: member.id, name: member.name }));
}

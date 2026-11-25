import type { ASSIGNMENT_STATUSES } from "@/lib/constants/enums";

type AssignmentStatus = (typeof ASSIGNMENT_STATUSES)[number];

/** An office's part is done: it completed the work, or the CEO Office released it. */
export const FINISHED_ASSIGNMENT_STATUSES = [
  "COMPLETED",
  "CLOSED",
] as const satisfies readonly AssignmentStatus[];

/** While the office still owes the work, it may ask the CEO Office for clarification. */
export const CLARIFIABLE_ASSIGNMENT_STATUSES = [
  "PENDING_ACKNOWLEDGEMENT",
  "ACKNOWLEDGED",
  "IN_PROGRESS",
] as const satisfies readonly AssignmentStatus[];

/** Moves the office makes itself with a progress update: starting, then completing the work. */
export const PROGRESS_TRANSITIONS: Partial<Record<AssignmentStatus, readonly AssignmentStatus[]>> =
  {
    ACKNOWLEDGED: ["IN_PROGRESS"],
    IN_PROGRESS: ["COMPLETED"],
  };

export function isFinished(status: AssignmentStatus): boolean {
  return (FINISHED_ASSIGNMENT_STATUSES as readonly string[]).includes(status);
}

/** Past its due date and not finished. The due date is a whole day, so the work is late the day after. */
export function isOverdue(dueDay: string, status: AssignmentStatus, today: string): boolean {
  return !isFinished(status) && dueDay < today;
}

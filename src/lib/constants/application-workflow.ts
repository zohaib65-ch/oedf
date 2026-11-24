import type { APPLICATION_STATUSES } from "@/lib/constants/enums";
import {
  hasPermission,
  type Permission,
  type PermissionSubject,
} from "@/lib/constants/permissions";

type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/**
 * Where an application can go from each status. Submitted → Under review → Verified →
 * Recommended → Approved or Rejected; Under review can ask for documents (Incomplete), which
 * returns to Under review; Withdrawn is possible until a decision. Rejection is also possible
 * from Under review, Incomplete and Verified, for an applicant who is clearly not eligible, and
 * like every rejection it needs the decide permission (`permissionForStatus`).
 */
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "WITHDRAWN"],
  UNDER_REVIEW: ["VERIFIED", "INCOMPLETE", "REJECTED", "WITHDRAWN"],
  INCOMPLETE: ["UNDER_REVIEW", "REJECTED", "WITHDRAWN"],
  VERIFIED: ["RECOMMENDED", "REJECTED", "WITHDRAWN"],
  RECOMMENDED: ["APPROVED", "REJECTED", "WITHDRAWN"],
  APPROVED: [],
  REJECTED: [],
  WITHDRAWN: [],
};

/** Approving and rejecting are final decisions; every other move is part of the review. */
export function permissionForStatus(status: ApplicationStatus): Permission {
  return status === "APPROVED" || status === "REJECTED"
    ? "applications:decide"
    : "applications:review";
}

/** The moves this person may make from the current status. The UI shows these; the server checks them again. */
export function allowedNextStatuses(
  subject: PermissionSubject,
  from: ApplicationStatus,
): ApplicationStatus[] {
  return APPLICATION_TRANSITIONS[from].filter((to) =>
    hasPermission(subject, permissionForStatus(to)),
  );
}

/** The verification checklist. Every item must be ticked before an application is Verified. */
export const CHECKLIST_ITEMS = [
  { key: "identity", label: "Identity checked against the CNIC or B-Form" },
  { key: "education", label: "Education history checked" },
  { key: "eligibility", label: "Eligibility for the program confirmed" },
  { key: "documents", label: "All documents present and readable" },
] as const;

/** The checklist can change only while the application is still being checked. */
export const CHECKLIST_EDITABLE_STATUSES: readonly ApplicationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "INCOMPLETE",
];

/** The button text for each move. */
export const STATUS_ACTION_LABELS: Record<ApplicationStatus, string> = {
  SUBMITTED: "Mark submitted",
  UNDER_REVIEW: "Start review",
  INCOMPLETE: "Ask for documents",
  VERIFIED: "Mark verified",
  RECOMMENDED: "Recommend",
  APPROVED: "Approve",
  REJECTED: "Reject",
  WITHDRAWN: "Withdraw",
};

/** How a status looks in a list: still moving, a good outcome, or closed. */
export function applicationStatusTone(
  status: ApplicationStatus,
): "progress" | "positive" | "closed" {
  if (status === "APPROVED") {
    return "positive";
  }
  return status === "REJECTED" || status === "WITHDRAWN" ? "closed" : "progress";
}

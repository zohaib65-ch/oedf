import type { JOB_APPLICATION_STATUSES } from "@/lib/constants/enums";

type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

/**
 * Received → Shortlisted → Interview → Selected, with Rejected and On hold possible along the
 * way. On hold returns to the shortlist or the interview stage. Selected records a recommendation
 * only: no appointment or contract is made in the system.
 */
export const JOB_APPLICATION_TRANSITIONS: Record<
  JobApplicationStatus,
  readonly JobApplicationStatus[]
> = {
  RECEIVED: ["SHORTLISTED", "ON_HOLD", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "ON_HOLD", "REJECTED"],
  INTERVIEW: ["SELECTED", "ON_HOLD", "REJECTED"],
  ON_HOLD: ["SHORTLISTED", "INTERVIEW", "REJECTED"],
  SELECTED: [],
  REJECTED: [],
};

/** An interview time can be set or changed only while the candidate is still in the running. */
export const INTERVIEW_STATUSES: readonly JobApplicationStatus[] = [
  "SHORTLISTED",
  "INTERVIEW",
  "ON_HOLD",
];

/** The button text for each move. */
export const JOB_STATUS_ACTION_LABELS: Record<JobApplicationStatus, string> = {
  RECEIVED: "Mark received",
  SHORTLISTED: "Shortlist",
  INTERVIEW: "Move to interview",
  SELECTED: "Select",
  REJECTED: "Reject",
  ON_HOLD: "Put on hold",
};

export function jobApplicationStatusTone(
  status: JobApplicationStatus,
): "progress" | "positive" | "closed" {
  if (status === "SELECTED") {
    return "positive";
  }
  return status === "REJECTED" ? "closed" : "progress";
}

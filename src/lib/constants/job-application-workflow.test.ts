import { describe, expect, it } from "vitest";

import {
  INTERVIEW_STATUSES,
  JOB_APPLICATION_TRANSITIONS,
} from "@/lib/constants/job-application-workflow";

describe("job application workflow", () => {
  it("ends at Selected or Rejected", () => {
    expect(JOB_APPLICATION_TRANSITIONS.SELECTED).toEqual([]);
    expect(JOB_APPLICATION_TRANSITIONS.REJECTED).toEqual([]);
  });

  it("can reject or put on hold at every open stage, and return from hold", () => {
    for (const status of ["RECEIVED", "SHORTLISTED", "INTERVIEW"] as const) {
      expect(JOB_APPLICATION_TRANSITIONS[status]).toEqual(
        expect.arrayContaining(["REJECTED", "ON_HOLD"]),
      );
    }
    expect(JOB_APPLICATION_TRANSITIONS.ON_HOLD).toEqual(["SHORTLISTED", "INTERVIEW", "REJECTED"]);
  });

  it("allows an interview time only while the candidate is still in the running", () => {
    expect(INTERVIEW_STATUSES).not.toContain("RECEIVED");
    expect(INTERVIEW_STATUSES).not.toContain("SELECTED");
  });
});

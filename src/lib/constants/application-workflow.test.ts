import { describe, expect, it } from "vitest";

import {
  allowedNextStatuses,
  APPLICATION_TRANSITIONS,
  permissionForStatus,
} from "@/lib/constants/application-workflow";

const admissions = "ADMISSIONS_SCHOLARSHIPS" as const;

describe("application workflow", () => {
  it("ends at a decision or a withdrawal", () => {
    for (const status of ["APPROVED", "REJECTED", "WITHDRAWN"] as const) {
      expect(APPLICATION_TRANSITIONS[status]).toEqual([]);
    }
  });

  it("needs the decide permission only to approve or reject", () => {
    expect(permissionForStatus("APPROVED")).toBe("applications:decide");
    expect(permissionForStatus("REJECTED")).toBe("applications:decide");
    expect(permissionForStatus("VERIFIED")).toBe("applications:review");
  });

  it("lets Staff recommend but not approve, and the CEO Office decide but not review", () => {
    const staff = { role: "STAFF", departmentCode: admissions } as const;
    const ceo = { role: "CEO_OFFICE", departmentCode: "CEO_OFFICE" } as const;

    expect(allowedNextStatuses(staff, "VERIFIED")).toEqual(["RECOMMENDED", "WITHDRAWN"]);
    expect(allowedNextStatuses(staff, "RECOMMENDED")).toEqual(["WITHDRAWN"]);
    expect(allowedNextStatuses(ceo, "RECOMMENDED")).toEqual(["APPROVED", "REJECTED"]);
    expect(allowedNextStatuses(ceo, "SUBMITTED")).toEqual([]);
  });

  it("allows an early rejection, but only to someone who may decide", () => {
    const staff = { role: "STAFF", departmentCode: admissions } as const;
    const director = { role: "DIRECTOR", departmentCode: admissions } as const;

    for (const from of ["UNDER_REVIEW", "INCOMPLETE", "VERIFIED"] as const) {
      expect(allowedNextStatuses(director, from)).toContain("REJECTED");
      expect(allowedNextStatuses(staff, from)).not.toContain("REJECTED");
    }
  });

  it("gives another office no moves at all", () => {
    const hr = { role: "DIRECTOR", departmentCode: "HR_TEACHER_MANAGEMENT" } as const;
    expect(allowedNextStatuses(hr, "UNDER_REVIEW")).toEqual([]);
  });
});

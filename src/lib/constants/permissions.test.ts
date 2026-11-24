import { describe, expect, it } from "vitest";

import { hasPermission, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/constants/permissions";

const admissionsDirector = { role: "DIRECTOR", departmentCode: "ADMISSIONS_SCHOLARSHIPS" } as const;
const hrStaff = { role: "STAFF", departmentCode: "HR_TEACHER_MANAGEMENT" } as const;

describe("hasPermission", () => {
  it("lets Super Admin do everything", () => {
    for (const permission of PERMISSIONS) {
      expect(hasPermission({ role: "SUPER_ADMIN", departmentCode: null }, permission)).toBe(true);
    }
  });

  it("keeps users, settings and the audit log away from Director and Staff", () => {
    for (const permission of ["users:manage", "settings:manage", "audit:read"] as const) {
      expect(hasPermission(admissionsDirector, permission)).toBe(false);
      expect(hasPermission(hrStaff, permission)).toBe(false);
    }
  });

  it("lets the CEO Office read the audit log but not manage users or settings", () => {
    const ceo = { role: "CEO_OFFICE", departmentCode: "CEO_OFFICE" } as const;
    expect(hasPermission(ceo, "audit:read")).toBe(true);
    expect(hasPermission(ceo, "users:manage")).toBe(false);
    expect(hasPermission(ceo, "settings:read")).toBe(false);
  });

  it("limits an office's modules to that office", () => {
    expect(hasPermission(admissionsDirector, "applications:decide")).toBe(true);
    expect(hasPermission(admissionsDirector, "vacancies:publish")).toBe(false);
    expect(hasPermission(hrStaff, "job-applications:review")).toBe(true);
    expect(hasPermission(hrStaff, "applications:read")).toBe(false);
  });

  it("never lets Staff publish or make final decisions", () => {
    const staff = ROLE_PERMISSIONS.STAFF;
    for (const permission of PERMISSIONS) {
      if (permission.endsWith(":publish") || permission.endsWith(":decide")) {
        expect(staff).not.toContain(permission);
      }
    }
  });

  it("lets only the Research & Policy Institute issue directives", () => {
    const research = { role: "DIRECTOR", departmentCode: "RESEARCH_POLICY" } as const;
    expect(hasPermission(research, "directives:issue")).toBe(true);
    expect(hasPermission(admissionsDirector, "directives:issue")).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEPARTMENTS } from "@/lib/constants/departments";
import { updateSettingsSchema } from "@/lib/validations/settings";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { SiteSettingsModel } from "@/server/db/models/site-settings.model";
import { ensureDepartments } from "@/server/repositories/department.repository";
import {
  getDepartmentsForStaff,
  updateDepartment,
  updateSiteSettings,
} from "@/server/services/settings.service";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

const admin: StaffContext = {
  id: "0".repeat(24),
  name: "Admin",
  email: "admin@example.org",
  role: "SUPER_ADMIN",
  departmentId: null,
  departmentCode: null,
  ipAddress: "203.0.113.9",
  userAgent: "test",
};

const validInput = (overrides: Record<string, unknown> = {}) =>
  updateSettingsSchema.parse({
    contact: {
      address: "Vehari",
      phone: "0300 1234567",
      email: "info@example.org",
      officeHours: "9 to 5",
    },
    mapUrl: "",
    social: { facebook: "", instagram: "", linkedin: "", x: "", youtube: "" },
    impactNumbers: [{ label: "Students", value: "120" }],
    announcement: { isActive: false, text: "", linkUrl: "" },
    admissionsOpen: true,
    scholarshipsOpen: false,
    ...overrides,
  });

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    SiteSettingsModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
  ]);
  await SiteSettingsModel.create({});
  await ensureDepartments(DEPARTMENTS);
  revalidateTag.mockReset();
});

describe("updateSiteSettings", () => {
  it("saves the settings, audits the changed sections and expires the cached settings at once", async () => {
    const saved = await updateSiteSettings(admin, validInput());

    expect(saved.admissionsOpen).toBe(true);
    expect(saved.impactNumbers).toEqual([{ label: "Students", value: 120 }]);
    expect(revalidateTag).toHaveBeenCalledWith("settings", { expire: 0 });
    const entry = await AuditLogModel.findOne({ action: "settings.updated" }).lean();
    expect((entry?.metadata as { sections: string }).sections).toContain("admissionsOpen");
  });

  it("does nothing when nothing changed", async () => {
    await updateSiteSettings(admin, validInput());
    revalidateTag.mockReset();
    await AuditLogModel.deleteMany({});

    await updateSiteSettings(admin, validInput());
    expect(revalidateTag).not.toHaveBeenCalled();
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });
});

describe("settings validation", () => {
  it("refuses a link that is not a web address and too many impact figures", () => {
    expect(() => validInput({ mapUrl: "javascript:alert(1)" })).toThrow();
    expect(() =>
      validInput({ impactNumbers: Array.from({ length: 9 }, () => ({ label: "x", value: 1 })) }),
    ).toThrow();
  });
});

describe("departments", () => {
  it("lists the offices with their notification email and saves a change", async () => {
    const [first] = await getDepartmentsForStaff();
    expect(first?.notificationEmail).toBe("");

    const updated = await updateDepartment(admin, first?.id ?? "", {
      notificationEmail: "admissions@example.org",
      directorName: "Dr Example",
    });
    expect(updated).toMatchObject({ notificationEmail: "admissions@example.org" });
    expect(revalidateTag).toHaveBeenCalledWith("departments", { expire: 0 });
    expect(await AuditLogModel.countDocuments({ action: "department.updated" })).toBe(1);
  });

  it("answers an unknown office with not found", async () => {
    await expect(
      updateDepartment(admin, "0".repeat(24), { directorName: "X" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

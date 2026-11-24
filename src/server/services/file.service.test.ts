import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEPARTMENTS } from "@/lib/constants/departments";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { ensureDepartments } from "@/server/repositories/department.repository";
import { getFileDownloadUrl } from "@/server/services/file.service";
import { createPrivateDownloadUrl } from "@/server/storage/cloudinary";

vi.mock("@/server/storage/cloudinary", () => ({ createPrivateDownloadUrl: vi.fn() }));

const meta = { ipAddress: "203.0.113.9", userAgent: "test" };
let admissionsId = "";
let hrId = "";
let fileId = "";

const staff = (role: string, departmentId: string | null): StaffContext => ({
  id: new mongoose.Types.ObjectId().toString(),
  name: "Staff Member",
  role,
  departmentId,
});

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    FileAssetModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
  ]);
  await ensureDepartments(DEPARTMENTS);
  admissionsId =
    (await DepartmentModel.findOne({ code: "ADMISSIONS_SCHOLARSHIPS" }).lean())?._id.toString() ??
    "";
  hrId =
    (await DepartmentModel.findOne({ code: "HR_TEACHER_MANAGEMENT" }).lean())?._id.toString() ?? "";
  const file = await FileAssetModel.create({
    publicId: "oedf-dev/applications/x",
    resourceType: "image",
    access: "PRIVATE",
    format: "pdf",
    bytes: 5,
    originalName: "x.pdf",
    purpose: "APPLICATION_DOCUMENT",
    owner: { type: "Application", id: new mongoose.Types.ObjectId() },
  });
  fileId = file._id.toString();
  vi.resetAllMocks();
  vi.mocked(createPrivateDownloadUrl).mockReturnValue("https://example.test/signed");
});

describe("getFileDownloadUrl", () => {
  it("gives the owning office, the CEO Office and Super Admin a link, and writes an audit entry each time", async () => {
    for (const person of [
      staff("STAFF", admissionsId),
      staff("CEO_OFFICE", null),
      staff("SUPER_ADMIN", null),
    ]) {
      expect(await getFileDownloadUrl(person, fileId, meta)).toBe("https://example.test/signed");
    }
    const entries = await AuditLogModel.find({}).lean();
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatchObject({
      action: "file.opened",
      entityType: "Application",
      ipAddress: "203.0.113.9",
    });
    expect(entries[0]?.metadata).toEqual({ fileId });
  });

  it("refuses staff of another office and staff without an office, without an audit entry", async () => {
    await expect(getFileDownloadUrl(staff("DIRECTOR", hrId), fileId, meta)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(getFileDownloadUrl(staff("STAFF", null), fileId, meta)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await AuditLogModel.countDocuments()).toBe(0);
    expect(createPrivateDownloadUrl).not.toHaveBeenCalled();
  });

  it("answers an unknown or malformed ID with not found", async () => {
    const person = staff("SUPER_ADMIN", null);
    await expect(
      getFileDownloadUrl(person, new mongoose.Types.ObjectId().toString(), meta),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getFileDownloadUrl(person, "not-an-id", meta)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

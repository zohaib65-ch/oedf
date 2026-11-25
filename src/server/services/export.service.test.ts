import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { listApplicationsQuerySchema } from "@/lib/validations/application-review";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { exportApplications } from "@/server/services/export.service";

function person(role: StaffContext["role"], code: StaffContext["departmentCode"]): StaffContext {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    name: `${role} person`,
    email: "person@example.org",
    role,
    departmentId: null,
    departmentCode: code,
    ipAddress: "203.0.113.9",
    userAgent: "test",
  };
}

async function addApplication(fullName: string, status: string) {
  await ApplicationModel.collection.insertOne({
    referenceNumber: `OEDF-ADM-2026-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`,
    type: "ADMISSION",
    status,
    applicant: { fullName, city: "Vehari", cnic: "3520212345671", email: "a@example.org" },
    createdAt: new Date("2026-03-01T05:00:00Z"),
    updatedAt: new Date(),
  });
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([ApplicationModel.deleteMany({}), AuditLogModel.deleteMany({})]);
});

describe("CSV export", () => {
  it("exports the filtered list without CNIC numbers and records who exported it", async () => {
    await addApplication("=Ali Khan", "SUBMITTED");
    await addApplication("Sara", "APPROVED");
    const director = person("DIRECTOR", "ADMISSIONS_SCHOLARSHIPS");

    const { fileName, csv } = await exportApplications(
      director,
      listApplicationsQuerySchema.parse({ status: "SUBMITTED" }),
    );
    expect(fileName).toMatch(/^applications-\d{4}-\d{2}-\d{2}\.csv$/);
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("'=Ali Khan");
    expect(lines[1]).toContain("2026-03-01 10:00");
    expect(csv).not.toContain("3520212345671");
    expect(csv).not.toContain("5671");
    expect(
      await AuditLogModel.countDocuments({
        action: "applications.exported",
        "metadata.filters": "status=SUBMITTED",
      }),
    ).toBe(1);
  });

  it("is for Directors of the office and the CEO Office, not Staff or other offices", async () => {
    const query = listApplicationsQuerySchema.parse({});
    await expect(
      exportApplications(person("STAFF", "ADMISSIONS_SCHOLARSHIPS"), query),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      exportApplications(person("DIRECTOR", "HR_TEACHER_MANAGEMENT"), query),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      exportApplications(person("CEO_OFFICE", "CEO_OFFICE"), query),
    ).resolves.toBeTruthy();
  });
});

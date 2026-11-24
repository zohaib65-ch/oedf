import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import { awardFormSchema } from "@/lib/validations/application-review";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { ScholarshipAwardModel } from "@/server/db/models/scholarship-award.model";
import {
  addAwardProgressNote,
  getAward,
  getAwards,
  saveAward,
} from "@/server/services/scholarship-award.service";

const director: StaffContext = {
  id: new mongoose.Types.ObjectId().toString(),
  name: "Director",
  email: "director@example.org",
  role: "DIRECTOR",
  departmentId: null,
  departmentCode: "ADMISSIONS_SCHOLARSHIPS",
  ipAddress: "203.0.113.9",
  userAgent: "test",
};

async function createAward(studentName: string, renewalDate?: string): Promise<string> {
  const award = await ScholarshipAwardModel.create({
    applicationId: new mongoose.Types.ObjectId(),
    referenceNumber: `OEDF-SCH-2026-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`,
    studentName,
    amountPkr: 5000,
    period: "MONTHLY",
    startDate: new Date("2027-01-01T00:00:00Z"),
    ...(renewalDate ? { renewalDate: new Date(`${renewalDate}T00:00:00Z`) } : {}),
  });
  return award._id.toString();
}

const listQuery = { page: 1, pageSize: 20, sort: "renewalDate" as const };

beforeEach(async () => {
  await connectDb();
  await Promise.all([ScholarshipAwardModel.deleteMany({}), AuditLogModel.deleteMany({})]);
});

describe("getAwards", () => {
  it("filters by renewal day and status, and searches by student", async () => {
    await createAward("Ayesha Khan", "2027-03-01");
    await createAward("Bilal Raza", "2027-09-01");
    await createAward("Sara Ali");

    const dueSoon = await getAwards({ ...listQuery, renewalBefore: "2027-03-01" });
    expect(dueSoon.items.map((award) => award.studentName)).toEqual(["Ayesha Khan"]);
    expect((await getAwards({ ...listQuery, q: "bilal" })).total).toBe(1);
    expect((await getAwards({ ...listQuery, status: "ENDED" })).total).toBe(0);
    expect((await getAwards(listQuery)).total).toBe(3);
  });
});

describe("saveAward", () => {
  it("saves the changes, records what changed, and can clear the renewal date", async () => {
    const id = await createAward("Ayesha Khan", "2027-07-01");
    const saved = await saveAward(
      director,
      id,
      awardFormSchema.parse({
        amountPkr: "6000",
        period: "MONTHLY",
        startDate: "2027-01-01",
        renewalDate: "",
        status: "ON_HOLD",
      }),
    );

    expect(saved).toMatchObject({ amountPkr: 6000, renewalDate: null, status: "ON_HOLD" });
    const entry = await AuditLogModel.findOne({ action: "award.updated" }).lean();
    expect(entry?.metadata).toEqual({
      amountPkr: "5000 to 6000",
      renewalDate: "2027-07-01 to none",
      status: "Active to On hold",
    });
  });

  it("writes nothing when nothing changed", async () => {
    const id = await createAward("Ayesha Khan");
    await saveAward(
      director,
      id,
      awardFormSchema.parse({
        amountPkr: 5000,
        period: "MONTHLY",
        startDate: "2027-01-01",
        status: "ACTIVE",
      }),
    );
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });
});

describe("progress notes", () => {
  it("adds a note, newest first, and answers an unknown award with not found", async () => {
    const id = await createAward("Ayesha Khan");
    await addAwardProgressNote(director, id, "Term 1 result: 82%.");
    await addAwardProgressNote(director, id, "Term 2 result: 85%.");

    expect((await getAward(id)).notes.map((note) => note.body)).toEqual([
      "Term 2 result: 85%.",
      "Term 1 result: 82%.",
    ]);
    await expect(getAward("not-an-id")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

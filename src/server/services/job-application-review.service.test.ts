import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";

import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import {
  addNote,
  changeStatus,
  getJobApplicationDetail,
  getJobApplications,
  updateJobApplication,
} from "@/server/services/job-application-review.service";

const HR = "HR_TEACHER_MANAGEMENT" as const;
const DAY_MS = 86_400_000;

function person(
  role: StaffContext["role"],
  departmentCode: StaffContext["departmentCode"] = HR,
): StaffContext {
  return {
    id: new mongoose.Types.ObjectId().toString(),
    name: `${role} person`,
    email: "person@example.org",
    role,
    departmentId: null,
    departmentCode,
    ipAddress: "203.0.113.9",
    userAgent: "test",
  };
}

const staff = person("STAFF");
const ceo = person("CEO_OFFICE", "CEO_OFFICE");

const move = (status: string) =>
  ({ status, reason: `Moving to ${status}` }) as Parameters<typeof changeStatus>[2];

let vacancyIds: string[] = [];
let sequence = 0;

async function createVacancy(title: string): Promise<string> {
  const vacancy = await VacancyModel.create({
    slug: title.toLowerCase().replaceAll(" ", "-"),
    title,
    departmentId: new mongoose.Types.ObjectId(),
    city: "Vehari",
    employmentType: "FULL_TIME",
    description: "d",
    status: "PUBLISHED",
    deadline: new Date(Date.now() + 7 * DAY_MS),
  });
  return vacancy._id.toString();
}

/** Saves an application the way the public form does. */
async function apply(
  overrides: { vacancyId?: string; fullName?: string; cnic?: string } = {},
): Promise<{ id: string; referenceNumber: string }> {
  sequence += 1;
  const referenceNumber = `OEDF-JOB-2026-${String(sequence).padStart(6, "0")}`;
  const application = await JobApplicationModel.create({
    referenceNumber,
    vacancyId: overrides.vacancyId ?? vacancyIds[0],
    cvFileId: new mongoose.Types.ObjectId(),
    candidate: {
      fullName: overrides.fullName ?? "Bilal Ahmed",
      email: "bilal@example.org",
      phone: "0300 1234567",
      cnic: overrides.cnic ?? "3520276543213",
      city: "Vehari",
      highestQualification: "MA Education",
      yearsOfExperience: 4,
    },
    statusHistory: [{ to: "RECEIVED", reason: "Application received", actorName: "Candidate" }],
  });
  return { id: application._id.toString(), referenceNumber };
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    JobApplicationModel.deleteMany({}),
    VacancyModel.deleteMany({}),
  ]);
  vacancyIds = [await createVacancy("Teacher"), await createVacancy("Librarian")];
});

describe("getJobApplications", () => {
  const listQuery = { page: 1, pageSize: 20, sort: "-createdAt" as const };

  it("returns only the last four CNIC digits and the vacancy title", async () => {
    await apply();
    const { items } = await getJobApplications(listQuery);

    expect(items[0]).toMatchObject({ cnicLast4: "3213", vacancyTitle: "Teacher" });
    expect(JSON.stringify(items)).not.toContain("3520276543213");
  });

  it("finds by CNIC, name or reference, and filters by vacancy and status", async () => {
    const first = await apply();
    await apply({ vacancyId: vacancyIds[1], fullName: "Sana Iqbal", cnic: "3520211111111" });

    expect((await getJobApplications({ ...listQuery, q: "35202-1111111-1" })).total).toBe(1);
    expect((await getJobApplications({ ...listQuery, q: "sana" })).total).toBe(1);
    expect((await getJobApplications({ ...listQuery, q: first.referenceNumber })).total).toBe(1);
    const forLibrarian = await getJobApplications({ ...listQuery, vacancyId: vacancyIds[1] });
    expect(forLibrarian.items.map((item) => item.candidateName)).toEqual(["Sana Iqbal"]);
    expect((await getJobApplications({ ...listQuery, status: "SHORTLISTED" })).total).toBe(0);
    const byName = await getJobApplications({ ...listQuery, sort: "name" });
    expect(byName.items.map((item) => item.candidateName)).toEqual(["Bilal Ahmed", "Sana Iqbal"]);
  });

  it("hides archived applications unless they are asked for", async () => {
    const { id } = await apply();
    await apply();
    await updateJobApplication(staff, id, { isArchived: true });

    expect((await getJobApplications(listQuery)).total).toBe(1);
    const archived = await getJobApplications({ ...listQuery, view: "ARCHIVED" });
    expect(archived.items.map((item) => item.id)).toEqual([id]);
  });
});

describe("changeStatus", () => {
  it("walks to Selected, recording who and why at each step", async () => {
    const { id } = await apply();
    for (const status of ["SHORTLISTED", "INTERVIEW", "SELECTED"]) {
      await changeStatus(staff, id, move(status));
    }

    const application = await getJobApplicationDetail(id);
    expect(application.status).toBe("SELECTED");
    const moves = application.timeline.filter((entry) => entry.kind === "STATUS");
    expect(moves.map((entry) => entry.to)).toEqual([
      "SELECTED",
      "INTERVIEW",
      "SHORTLISTED",
      "RECEIVED",
    ]);
    expect(moves[0]).toMatchObject({ actorName: "STAFF person", text: "Moving to SELECTED" });
    expect(await AuditLogModel.countDocuments({ action: "job_application.status_changed" })).toBe(
      3,
    );
  });

  it("refuses a move the flow does not allow, and any move after a decision", async () => {
    const { id } = await apply();
    await expect(changeStatus(staff, id, move("SELECTED"))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await changeStatus(staff, id, move("REJECTED"));
    await expect(changeStatus(staff, id, move("SHORTLISTED"))).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("returns an application on hold to the shortlist", async () => {
    const { id } = await apply();
    await changeStatus(staff, id, move("ON_HOLD"));
    expect((await changeStatus(staff, id, move("SHORTLISTED"))).status).toBe("SHORTLISTED");
  });

  it("lets the CEO Office read but not review, and keeps other offices out", async () => {
    const { id } = await apply();
    await expect(changeStatus(ceo, id, move("SHORTLISTED"))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      changeStatus(person("DIRECTOR", "RESEARCH_POLICY"), id, move("SHORTLISTED")),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(addNote(ceo, id, "A note")).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(updateJobApplication(ceo, id, { isArchived: true })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("updateJobApplication", () => {
  it("sets an interview time in Pakistan time, only for a candidate still in the running", async () => {
    const { id } = await apply();
    await expect(
      updateJobApplication(staff, id, { interviewAt: "2026-12-10T10:30" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await changeStatus(staff, id, move("SHORTLISTED"));
    const scheduled = await updateJobApplication(staff, id, { interviewAt: "2026-12-10T10:30" });
    expect(scheduled.interviewAt).toBe("2026-12-10T05:30:00.000Z");
    expect(scheduled.interviewAtLocal).toBe("2026-12-10T10:30");

    const cleared = await updateJobApplication(staff, id, { interviewAt: "" });
    expect(cleared.interviewAt).toBeNull();
    expect(await AuditLogModel.countDocuments({ action: "job_application.interview_set" })).toBe(2);
  });

  it("makes an archived application read-only until it is restored", async () => {
    const { id } = await apply();
    await updateJobApplication(staff, id, { isArchived: true });

    await expect(changeStatus(staff, id, move("SHORTLISTED"))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      updateJobApplication(staff, id, { interviewAt: "2026-12-10T10:30" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(addNote(staff, id, "A note")).rejects.toMatchObject({ code: "CONFLICT" });

    const restored = await updateJobApplication(staff, id, { isArchived: false });
    expect(restored.archivedAt).toBeNull();
    expect((await changeStatus(staff, id, move("SHORTLISTED"))).status).toBe("SHORTLISTED");
    expect(await AuditLogModel.countDocuments({ action: "job_application.archived" })).toBe(1);
    expect(await AuditLogModel.countDocuments({ action: "job_application.restored" })).toBe(1);
  });
});

describe("addNote", () => {
  it("adds an internal note to the timeline", async () => {
    const { id } = await apply();
    const application = await addNote(staff, id, "Strong teaching demo.");

    expect(application.timeline[0]).toMatchObject({ kind: "NOTE", text: "Strong teaching demo." });
    await expect(addNote(staff, "0".repeat(24), "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

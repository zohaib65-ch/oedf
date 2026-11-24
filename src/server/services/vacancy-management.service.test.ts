import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { vacancyFormSchema, type VacancyFormInput } from "@/lib/validations/vacancy";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import {
  changeVacancyStatus,
  createVacancy,
  deleteVacancy,
  getVacanciesForStaff,
  getVacancyForStaff,
  updateVacancy,
} from "@/server/services/vacancy-management.service";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));

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

const director = person("DIRECTOR");
const staff = person("STAFF");

/** A day (YYYY-MM-DD) some days from now, in Pakistan time. */
const dayFromNow = (days: number) =>
  new Date(Date.now() + days * DAY_MS + 5 * 3_600_000).toISOString().slice(0, 10);

let officeId = "";

function form(overrides: Partial<VacancyFormInput> = {}): VacancyFormInput {
  return vacancyFormSchema.parse({
    title: "Senior Teacher (Math)",
    departmentId: officeId,
    city: "Vehari",
    employmentType: "FULL_TIME",
    description: "Teach mathematics to classes 9 and 10.",
    requirements: "MSc Mathematics.",
    deadline: dayFromNow(14),
    ...overrides,
  });
}

const listQuery = { page: 1, pageSize: 20, sort: "-createdAt" as const };

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    JobApplicationModel.deleteMany({}),
    VacancyModel.deleteMany({}),
  ]);
  const office = await DepartmentModel.create({
    code: HR,
    slug: "hr",
    name: "Human Resources",
    purpose: "p",
    order: 3,
  });
  officeId = office._id.toString();
  vi.resetAllMocks();
});

describe("createVacancy", () => {
  it("saves a draft with its own web address, open until the end of the deadline day", async () => {
    const first = await createVacancy(staff, form());
    const second = await createVacancy(staff, form());

    expect(first).toMatchObject({ status: "DRAFT", slug: "senior-teacher-math" });
    expect(second.slug).toBe("senior-teacher-math-2");
    const deadline = form().deadline;
    // 23:59:59.999 in Pakistan is 18:59:59.999 UTC on the same day.
    expect(first.deadline).toBe(`${deadline}T18:59:59.999Z`);
    expect(first.deadlineDay).toBe(deadline);
    expect(await AuditLogModel.countDocuments({ action: "vacancy.created" })).toBe(2);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("refuses an office that does not exist, and keeps other offices out", async () => {
    await expect(
      createVacancy(staff, form({ departmentId: new mongoose.Types.ObjectId().toString() })),
    ).rejects.toMatchObject({ details: { fieldErrors: { departmentId: expect.any(Array) } } });
    await expect(
      createVacancy(person("DIRECTOR", "RESEARCH_POLICY"), form()),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(createVacancy(person("CEO_OFFICE", "CEO_OFFICE"), form())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("updateVacancy", () => {
  it("lets Staff edit a draft, but only a Director can change a published vacancy", async () => {
    const { id } = await createVacancy(staff, form());
    const edited = await updateVacancy(staff, id, form({ city: "Multan" }));
    expect(edited.city).toBe("Multan");
    const entry = await AuditLogModel.findOne({ action: "vacancy.updated" }).lean();
    expect(entry?.metadata).toEqual({ fields: "city" });

    await changeVacancyStatus(director, id, { status: "PUBLISHED" });
    await expect(updateVacancy(staff, id, form({ city: "Lahore" }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    revalidateTag.mockClear();
    expect((await updateVacancy(director, id, form({ city: "Lahore" }))).city).toBe("Lahore");
    expect(revalidateTag).toHaveBeenCalledWith("vacancies", { expire: 0 });
  });

  it("writes nothing when nothing changed", async () => {
    const { id } = await createVacancy(staff, form());
    await updateVacancy(staff, id, form());
    expect(await AuditLogModel.countDocuments({ action: "vacancy.updated" })).toBe(0);
  });
});

describe("changeVacancyStatus", () => {
  it("publishes, closes and reopens, keeping the first publication date", async () => {
    const { id } = await createVacancy(staff, form());
    await expect(changeVacancyStatus(staff, id, { status: "PUBLISHED" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const published = await changeVacancyStatus(director, id, { status: "PUBLISHED" });
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).not.toBeNull();
    expect(revalidateTag).toHaveBeenCalledWith("vacancies", { expire: 0 });

    expect((await changeVacancyStatus(director, id, { status: "CLOSED" })).status).toBe("CLOSED");
    const reopened = await changeVacancyStatus(director, id, { status: "PUBLISHED" });
    expect(reopened.status).toBe("PUBLISHED");
    expect(reopened.publishedAt).toBe(published.publishedAt);
    expect(await AuditLogModel.countDocuments({ action: "vacancy.status_changed" })).toBe(3);
  });

  it("refuses to publish past the deadline, or to repeat a move", async () => {
    const late = await createVacancy(staff, form({ deadline: dayFromNow(-2) }));
    await expect(
      changeVacancyStatus(director, late.id, { status: "PUBLISHED" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const { id } = await createVacancy(staff, form());
    await expect(changeVacancyStatus(director, id, { status: "CLOSED" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

describe("getVacanciesForStaff", () => {
  it("shows a published vacancy past its deadline as closed, and counts applications", async () => {
    const open = await createVacancy(staff, form({ title: "Open post" }));
    await changeVacancyStatus(director, open.id, { status: "PUBLISHED" });
    const expired = await createVacancy(staff, form({ title: "Expired post" }));
    await changeVacancyStatus(director, expired.id, { status: "PUBLISHED" });
    await VacancyModel.updateOne(
      { _id: expired.id },
      { $set: { deadline: new Date(Date.now() - DAY_MS) } },
    );
    await createVacancy(staff, form({ title: "Draft post" }));
    await JobApplicationModel.create({
      referenceNumber: "OEDF-JOB-2026-000001",
      vacancyId: open.id,
      cvFileId: new mongoose.Types.ObjectId(),
      candidate: {
        fullName: "Bilal Ahmed",
        email: "bilal@example.org",
        phone: "0300 1234567",
        cnic: "3520276543213",
        city: "Vehari",
        highestQualification: "MA",
        yearsOfExperience: 4,
      },
    });

    const closed = await getVacanciesForStaff({ ...listQuery, status: "CLOSED" });
    expect(closed.items.map((item) => [item.title, item.status, item.shownStatus])).toEqual([
      ["Expired post", "PUBLISHED", "CLOSED"],
    ]);
    const published = await getVacanciesForStaff({ ...listQuery, status: "PUBLISHED" });
    expect(published.items.map((item) => [item.title, item.applicationCount])).toEqual([
      ["Open post", 1],
    ]);
    expect((await getVacanciesForStaff({ ...listQuery, status: "DRAFT" })).total).toBe(1);
    expect((await getVacanciesForStaff({ ...listQuery, q: "expired" })).total).toBe(1);
    const byTitle = await getVacanciesForStaff({ ...listQuery, sort: "title" });
    expect(byTitle.items.map((item) => item.title)).toEqual([
      "Draft post",
      "Expired post",
      "Open post",
    ]);
  });
});

describe("deleteVacancy", () => {
  it("deletes only a draft nobody applied to", async () => {
    const draft = await createVacancy(staff, form());
    const published = await createVacancy(staff, form());
    await changeVacancyStatus(director, published.id, { status: "PUBLISHED" });

    await expect(deleteVacancy(staff, published.id)).rejects.toMatchObject({ code: "CONFLICT" });
    await deleteVacancy(staff, draft.id);
    await expect(getVacancyForStaff(draft.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await AuditLogModel.countDocuments({ action: "vacancy.deleted" })).toBe(1);
    await expect(
      deleteVacancy(person("CEO_OFFICE", "CEO_OFFICE"), published.id),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

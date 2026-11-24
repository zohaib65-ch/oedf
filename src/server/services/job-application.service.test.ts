import { beforeEach, describe, expect, it, vi } from "vitest";

import { jobApplicationSchema } from "@/lib/validations/job-application";
import { connectDb } from "@/server/db/connection";
import { CounterModel } from "@/server/db/models/counter.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { JobApplicationModel } from "@/server/db/models/job-application.model";
import { VacancyModel } from "@/server/db/models/vacancy.model";
import { sendEmail } from "@/server/email/send-email";
import { submitJobApplication } from "@/server/services/job-application.service";
import { inspectUpload, markUploadsConfirmed } from "@/server/storage/cloudinary";

vi.mock("@/server/storage/cloudinary", () => ({
  inspectUpload: vi.fn(),
  deleteUploads: vi.fn(),
  markUploadsConfirmed: vi.fn(),
}));
vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn() }));

const DAY_MS = 86_400_000;

function input(overrides: Record<string, unknown> = {}) {
  return jobApplicationSchema.parse({
    vacancySlug: "teacher",
    fullName: "Bilal Ahmed",
    email: "Bilal@Example.org",
    phone: "0300 1234567",
    cnic: "35202-7654321-3",
    city: "Vehari",
    highestQualification: "MA Education",
    yearsOfExperience: "4",
    cv: { publicId: "oedf-dev/cv/cv-1.docx", resourceType: "raw", originalName: "cv.docx" },
    ...overrides,
  });
}

async function createVacancy(overrides: Record<string, unknown> = {}) {
  const department = await DepartmentModel.create({
    code: "HR_TEACHER_MANAGEMENT",
    slug: "hr",
    name: "HR",
    purpose: "p",
    order: 3,
  });
  await VacancyModel.create({
    slug: "teacher",
    title: "Teacher",
    departmentId: department._id,
    city: "Vehari",
    employmentType: "FULL_TIME",
    description: "d",
    status: "PUBLISHED",
    deadline: new Date(Date.now() + 7 * DAY_MS),
    ...overrides,
  });
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    JobApplicationModel.deleteMany({}),
    CounterModel.deleteMany({}),
    FileAssetModel.deleteMany({}),
    VacancyModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
  ]);
  vi.resetAllMocks();
  vi.mocked(inspectUpload).mockResolvedValue({ format: "docx", bytes: 2000 });
  vi.mocked(sendEmail).mockResolvedValue(true);
});

describe("submitJobApplication", () => {
  it("saves the application with its CV, numbers it and emails the candidate", async () => {
    await createVacancy();

    const { referenceNumber } = await submitJobApplication(input());

    expect(referenceNumber).toMatch(/^OEDF-JOB-\d{4}-000001$/);
    const saved = await JobApplicationModel.findOne({ referenceNumber }).lean();
    expect(saved?.status).toBe("RECEIVED");
    expect(saved?.candidate.cnic).toBe("3520276543213");
    const cv = await FileAssetModel.findById(saved?.cvFileId).lean();
    expect(cv).toMatchObject({
      purpose: "CV",
      access: "PRIVATE",
      format: "docx",
      resourceType: "raw",
    });
    expect(markUploadsConfirmed).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "bilal@example.org" }));
  });

  it("refuses a vacancy that does not exist, is a draft, or has passed its deadline", async () => {
    await createVacancy({ deadline: new Date(Date.now() - DAY_MS) });
    await expect(submitJobApplication(input())).rejects.toMatchObject({ code: "CONFLICT" });

    await VacancyModel.updateOne(
      { slug: "teacher" },
      { status: "DRAFT", deadline: new Date(Date.now() + DAY_MS) },
    );
    await expect(submitJobApplication(input())).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(submitJobApplication(input({ vacancySlug: "nope" }))).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(await JobApplicationModel.countDocuments()).toBe(0);
  });
});

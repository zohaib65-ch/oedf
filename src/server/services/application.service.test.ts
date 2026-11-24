import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { CounterModel } from "@/server/db/models/counter.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { ProgramModel } from "@/server/db/models/program.model";
import { SiteSettingsModel } from "@/server/db/models/site-settings.model";
import { sendEmail } from "@/server/email/send-email";
import { AppError } from "@/server/http/errors";
import {
  lookupApplicationStatus,
  submitApplication,
  submitMissingDocuments,
} from "@/server/services/application.service";
import { inspectUpload, markUploadsConfirmed } from "@/server/storage/cloudinary";

import { buildApplicationInput, scholarshipExtras } from "../../../tests/helpers/application-input";

vi.mock("@/server/storage/cloudinary", () => ({
  inspectUpload: vi.fn(),
  markUploadsConfirmed: vi.fn(),
}));
vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn() }));

const lookup = (referenceNumber: string, email = "ayesha@example.org") => ({
  referenceNumber,
  email,
});

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    ApplicationModel.deleteMany({}),
    CounterModel.deleteMany({}),
    FileAssetModel.deleteMany({}),
    ProgramModel.deleteMany({}),
    SiteSettingsModel.deleteMany({}),
  ]);
  await SiteSettingsModel.create({ admissionsOpen: true, scholarshipsOpen: true });
  vi.resetAllMocks();
  vi.mocked(inspectUpload).mockResolvedValue({ format: "pdf", bytes: 1000 });
  vi.mocked(sendEmail).mockResolvedValue(true);
});

describe("submitApplication", () => {
  it("saves the application with its files, numbers it, confirms the uploads and emails the applicant", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());

    expect(referenceNumber).toMatch(/^OEDF-ADM-\d{4}-000001$/);
    const saved = await ApplicationModel.findOne({ referenceNumber }).lean();
    expect(saved?.status).toBe("SUBMITTED");
    expect(saved?.statusHistory).toHaveLength(1);
    expect(saved?.applicant.cnic).toBe("3520212345671");
    expect(saved?.documents.map((d) => d.kind)).toEqual(["PHOTO", "IDENTITY", "RESULT_CARD"]);

    const files = await FileAssetModel.find({}).lean();
    expect(files).toHaveLength(3);
    expect(
      files.every(
        (f) => f.access === "PRIVATE" && f.owner?.id.toString() === saved?._id.toString(),
      ),
    ).toBe(true);

    expect(markUploadsConfirmed).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ayesha@example.org",
        subject: expect.stringContaining(referenceNumber),
      }),
    );
  });

  it("numbers admissions and scholarships separately and never repeats a number", async () => {
    const first = await submitApplication(buildApplicationInput());
    // The mocked storage accepts any file, so a second application can reuse the same public IDs.
    await FileAssetModel.deleteMany({});
    const second = await submitApplication(buildApplicationInput());
    await FileAssetModel.deleteMany({});
    const scholarship = await submitApplication(buildApplicationInput(scholarshipExtras));

    expect(first.referenceNumber).toMatch(/-ADM-\d{4}-000001$/);
    expect(second.referenceNumber).toMatch(/-ADM-\d{4}-000002$/);
    expect(scholarship.referenceNumber).toMatch(/-SCH-\d{4}-000001$/);
    expect(
      (await ApplicationModel.findOne({ type: "SCHOLARSHIP" }).lean())?.financial?.familySize,
    ).toBe(6);
  });

  it("refuses while admissions are closed", async () => {
    await SiteSettingsModel.updateOne({}, { admissionsOpen: false });

    await expect(submitApplication(buildApplicationInput())).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(await ApplicationModel.countDocuments()).toBe(0);
  });

  it("refuses a program that does not accept applications", async () => {
    const program = await ProgramModel.create({
      slug: "p",
      title: "P",
      category: "SKILLS",
      summary: "s",
      status: "PUBLISHED",
      acceptsApplications: false,
    });

    await expect(
      submitApplication(buildApplicationInput({ programId: program._id.toString() })),
    ).rejects.toMatchObject({ details: { fieldErrors: { programId: expect.any(Array) } } });
  });

  it("names the field of a rejected file and saves nothing", async () => {
    vi.mocked(inspectUpload).mockImplementation((ref) =>
      ref.publicId.endsWith("/identity")
        ? Promise.reject(
            new AppError("VALIDATION_ERROR", "One of the uploaded files is not an accepted type."),
          )
        : Promise.resolve({ format: "pdf", bytes: 1000 }),
    );

    await expect(submitApplication(buildApplicationInput())).rejects.toMatchObject({
      details: { fieldErrors: { "documents.identity": expect.any(Array) } },
    });
    expect(await ApplicationModel.countDocuments()).toBe(0);
    expect(await FileAssetModel.countDocuments()).toBe(0);
    expect(markUploadsConfirmed).not.toHaveBeenCalled();
  });

  it("refuses a file used twice in one application, and a file already saved elsewhere", async () => {
    const reused = {
      publicId: "oedf-dev/applications/photo",
      resourceType: "image",
      originalName: "a.pdf",
    };
    await expect(
      submitApplication(
        buildApplicationInput({
          documents: {
            photo: reused,
            identity: reused,
            resultCard: { ...reused, publicId: "oedf-dev/applications/r" },
          },
        }),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });

    await submitApplication(buildApplicationInput());
    await expect(submitApplication(buildApplicationInput())).rejects.toMatchObject({
      details: { fieldErrors: { "documents.photo": expect.any(Array) } },
    });
    expect(await ApplicationModel.countDocuments()).toBe(1);
  });

  it("still succeeds when the confirmation email cannot be sent", async () => {
    vi.mocked(sendEmail).mockResolvedValue(false);
    const { referenceNumber } = await submitApplication(buildApplicationInput());
    expect(await ApplicationModel.exists({ referenceNumber })).toBeTruthy();
  });
});

describe("lookupApplicationStatus", () => {
  it("returns only the status and next step for the matching email", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());

    const result = await lookupApplicationStatus(lookup(referenceNumber));
    expect(result).toEqual({
      status: "SUBMITTED",
      label: "Submitted",
      nextStep: expect.any(String),
      missingItems: [],
    });
    expect(JSON.stringify(result)).not.toContain("Ayesha");
  });

  it("answers a wrong email and an unknown reference the same way", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());

    const wrongEmail = await lookupApplicationStatus(
      lookup(referenceNumber, "other@example.org"),
    ).catch((e: unknown) => e);
    const unknown = await lookupApplicationStatus(lookup("OEDF-ADM-2026-999999")).catch(
      (e: unknown) => e,
    );
    expect(wrongEmail).toMatchObject({ code: "NOT_FOUND" });
    expect((wrongEmail as Error).message).toBe((unknown as Error).message);
  });

  it("lists what staff asked for while the application is incomplete", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());
    await ApplicationModel.updateOne(
      { referenceNumber },
      { status: "INCOMPLETE", missingItems: ["Clearer CNIC copy"] },
    );

    expect(await lookupApplicationStatus(lookup(referenceNumber))).toMatchObject({
      status: "INCOMPLETE",
      missingItems: ["Clearer CNIC copy"],
    });
  });
});

describe("submitMissingDocuments", () => {
  const extra = {
    kind: "IDENTITY" as const,
    file: {
      publicId: "oedf-dev/applications/new-id",
      resourceType: "image" as const,
      originalName: "id.pdf",
    },
  };

  it("adds the documents and returns the application to Under review", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());
    await ApplicationModel.updateOne(
      { referenceNumber },
      { status: "INCOMPLETE", missingItems: ["CNIC"] },
    );

    const result = await submitMissingDocuments({ ...lookup(referenceNumber), documents: [extra] });

    expect(result.status).toBe("UNDER_REVIEW");
    const saved = await ApplicationModel.findOne({ referenceNumber }).lean();
    expect(saved?.status).toBe("UNDER_REVIEW");
    expect(saved?.missingItems).toEqual([]);
    expect(saved?.documents).toHaveLength(4);
    expect(saved?.statusHistory.at(-1)).toMatchObject({ from: "INCOMPLETE", to: "UNDER_REVIEW" });
    expect(await FileAssetModel.countDocuments()).toBe(4);
  });

  it("refuses when the application is not asking for documents", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());

    await expect(
      submitMissingDocuments({ ...lookup(referenceNumber), documents: [extra] }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect(inspectUpload).toHaveBeenCalledTimes(3);
  });

  it("refuses while staff have archived the application", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());
    await ApplicationModel.updateOne(
      { referenceNumber },
      { status: "INCOMPLETE", archivedAt: new Date() },
    );

    await expect(
      submitMissingDocuments({ ...lookup(referenceNumber), documents: [extra] }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await ApplicationModel.findOne({ referenceNumber }).lean())?.status).toBe("INCOMPLETE");
  });

  it("refuses a wrong email", async () => {
    const { referenceNumber } = await submitApplication(buildApplicationInput());
    await ApplicationModel.updateOne({ referenceNumber }, { status: "INCOMPLETE" });

    await expect(
      submitMissingDocuments({
        ...lookup(referenceNumber, "other@example.org"),
        documents: [extra],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

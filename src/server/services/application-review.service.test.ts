import { render } from "@react-email/render";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { applicationStatusChangeSchema } from "@/lib/validations/application-review";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { CounterModel } from "@/server/db/models/counter.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { ScholarshipAwardModel } from "@/server/db/models/scholarship-award.model";
import { SiteSettingsModel } from "@/server/db/models/site-settings.model";
import { sendEmail } from "@/server/email/send-email";
import {
  addNote,
  changeStatus,
  getApplicationDetail,
  getApplications,
  updateChecklist,
} from "@/server/services/application-review.service";
import { submitApplication } from "@/server/services/application.service";
import { inspectUpload } from "@/server/storage/cloudinary";

import { buildApplicationInput, scholarshipExtras } from "../../../tests/helpers/application-input";

vi.mock("@/server/storage/cloudinary", () => ({
  inspectUpload: vi.fn(),
  markUploadsConfirmed: vi.fn(),
}));
vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn() }));

const ADMISSIONS = "ADMISSIONS_SCHOLARSHIPS" as const;

function person(
  role: StaffContext["role"],
  departmentCode: StaffContext["departmentCode"] = ADMISSIONS,
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
const ceo = person("CEO_OFFICE", "CEO_OFFICE");

const move = (status: string, extra: Record<string, unknown> = {}) =>
  applicationStatusChangeSchema.parse({ status, reason: `Moving to ${status}`, ...extra });

const FULL_CHECKLIST = { identity: true, education: true, eligibility: true, documents: true };

let fileCounter = 0;

/** Submits a real application through the public service, with unique (mocked) uploads. */
async function submit(overrides: Record<string, unknown> = {}): Promise<string> {
  fileCounter += 1;
  const file = (name: string) => ({
    publicId: `oedf-dev/applications/${name}-${String(fileCounter)}`,
    resourceType: "image",
    originalName: `${name}.pdf`,
  });
  const isScholarship = overrides.type === "SCHOLARSHIP";
  const { referenceNumber } = await submitApplication(
    buildApplicationInput({
      ...(isScholarship ? scholarshipExtras : {}),
      ...overrides,
      documents: {
        photo: file("photo"),
        identity: file("identity"),
        resultCard: file("result"),
        ...(isScholarship ? { incomeProof: file("income") } : {}),
      },
    }),
  );
  const saved = await ApplicationModel.findOne({ referenceNumber }, { _id: 1 }).lean();
  return saved?._id.toString() ?? "";
}

/** Brings an application to the given point of the flow. */
async function advanceTo(id: string, statuses: readonly string[]): Promise<void> {
  for (const status of statuses) {
    if (status === "VERIFIED") {
      await updateChecklist(staff, id, FULL_CHECKLIST);
    }
    await changeStatus(director, id, move(status));
  }
}

async function lastEmailText(): Promise<string> {
  const call = vi.mocked(sendEmail).mock.calls.at(-1)?.[0];
  return call ? render(call.template, { plainText: true }) : "";
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    ApplicationModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
    CounterModel.deleteMany({}),
    FileAssetModel.deleteMany({}),
    ScholarshipAwardModel.deleteMany({}),
    SiteSettingsModel.deleteMany({}),
  ]);
  await SiteSettingsModel.create({ admissionsOpen: true, scholarshipsOpen: true });
  vi.resetAllMocks();
  vi.mocked(inspectUpload).mockResolvedValue({ format: "pdf", bytes: 1000 });
  vi.mocked(sendEmail).mockResolvedValue(true);
});

describe("getApplications", () => {
  const listQuery = { page: 1, pageSize: 20, sort: "-createdAt" as const };

  it("returns only the last four CNIC digits, never the whole number", async () => {
    await submit();
    const { items, total } = await getApplications(listQuery);

    expect(total).toBe(1);
    expect(items[0]?.cnicLast4).toBe("5671");
    expect(JSON.stringify(items)).not.toContain("3520212345671");
  });

  it("finds an application by the whole CNIC, by part of the name, or by reference", async () => {
    await submit();
    await submit({
      applicant: {
        ...buildApplicationInput().applicant,
        fullName: "Bilal Raza",
        cnic: "35202-7654321-3",
      },
    });

    const byCnic = await getApplications({ ...listQuery, q: "35202-7654321-3" });
    expect(byCnic.items.map((item) => item.applicantName)).toEqual(["Bilal Raza"]);
    expect((await getApplications({ ...listQuery, q: "ayesha" })).total).toBe(1);
    expect((await getApplications({ ...listQuery, q: "OEDF-ADM" })).total).toBe(2);
    expect((await getApplications({ ...listQuery, q: "nobody" })).total).toBe(0);
  });

  it("filters by type, status and city, and sorts by name", async () => {
    await submit();
    await submit({ type: "SCHOLARSHIP" });
    const scholarships = await getApplications({ ...listQuery, type: "SCHOLARSHIP" });
    expect(scholarships.items.map((item) => item.type)).toEqual(["SCHOLARSHIP"]);
    expect((await getApplications({ ...listQuery, status: "APPROVED" })).total).toBe(0);
    expect((await getApplications({ ...listQuery, city: "vehari" })).total).toBe(2);
    expect((await getApplications({ ...listQuery, city: "Lahore" })).total).toBe(0);
    expect((await getApplications({ ...listQuery, sort: "name" })).items).toHaveLength(2);
  });
});

describe("changeStatus", () => {
  it("walks the whole flow, records who and why, and emails the decision", async () => {
    const id = await submit();
    await advanceTo(id, ["UNDER_REVIEW", "VERIFIED", "RECOMMENDED", "APPROVED"]);

    const application = await getApplicationDetail(id);
    expect(application.status).toBe("APPROVED");
    expect(application.decision).toMatchObject({
      reason: "Moving to APPROVED",
      decidedByName: "DIRECTOR person",
    });
    const moves = application.timeline.filter((entry) => entry.kind === "STATUS");
    expect(moves.map((entry) => entry.to)).toEqual([
      "APPROVED",
      "RECOMMENDED",
      "VERIFIED",
      "UNDER_REVIEW",
      "SUBMITTED",
    ]);
    expect(await AuditLogModel.countDocuments({ action: "application.status_changed" })).toBe(4);
    expect(await lastEmailText()).toContain("approved");
  });

  it("refuses to mark verified until every checklist item is ticked", async () => {
    const id = await submit();
    await advanceTo(id, ["UNDER_REVIEW"]);
    await updateChecklist(staff, id, { ...FULL_CHECKLIST, documents: false });

    await expect(changeStatus(staff, id, move("VERIFIED"))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    expect((await getApplicationDetail(id)).status).toBe("UNDER_REVIEW");
  });

  it("refuses a move the flow does not allow", async () => {
    const id = await submit();
    await expect(changeStatus(director, id, move("APPROVED"))).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("lets Staff recommend but not decide, and keeps another office out entirely", async () => {
    const id = await submit();
    await advanceTo(id, ["UNDER_REVIEW", "VERIFIED"]);

    await changeStatus(staff, id, move("RECOMMENDED"));
    await expect(changeStatus(staff, id, move("APPROVED"))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      changeStatus(person("DIRECTOR", "HR_TEACHER_MANAGEMENT"), id, move("REJECTED")),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await changeStatus(ceo, id, move("REJECTED"));
    expect((await getApplicationDetail(id)).status).toBe("REJECTED");
    expect(await lastEmailText()).toContain("not successful");
  });

  it("asks the applicant for the listed documents, and the upload returns it to review", async () => {
    const id = await submit();
    await advanceTo(id, ["UNDER_REVIEW"]);
    await changeStatus(
      staff,
      id,
      move("INCOMPLETE", { missingItems: "Clearer CNIC copy\n\nSigned form" }),
    );

    const application = await getApplicationDetail(id);
    expect(application.missingItems).toEqual(["Clearer CNIC copy", "Signed form"]);
    const text = await lastEmailText();
    expect(text).toContain("Clearer CNIC copy");
    expect(text).toContain("Signed form");

    await changeStatus(staff, id, move("UNDER_REVIEW"));
    expect((await getApplicationDetail(id)).missingItems).toEqual([]);
  });

  it("approving a scholarship needs the award terms and creates the award in the same step", async () => {
    const id = await submit({ type: "SCHOLARSHIP" });
    await advanceTo(id, ["UNDER_REVIEW", "VERIFIED", "RECOMMENDED"]);

    await expect(changeStatus(director, id, move("APPROVED"))).rejects.toMatchObject({
      details: { fieldErrors: { "award.amountPkr": expect.any(Array) } },
    });
    expect(await ScholarshipAwardModel.countDocuments()).toBe(0);

    const approved = await changeStatus(
      director,
      id,
      move("APPROVED", {
        award: {
          amountPkr: "5000",
          period: "MONTHLY",
          startDate: "2027-01-01",
          renewalDate: "2027-07-01",
        },
      }),
    );
    expect(approved.awardId).not.toBeNull();
    const award = await ScholarshipAwardModel.findOne({}).lean();
    expect(award).toMatchObject({
      amountPkr: 5000,
      period: "MONTHLY",
      status: "ACTIVE",
      studentName: "Ayesha Khan",
    });
    expect(award?.renewalDate?.toISOString()).toBe("2027-07-01T00:00:00.000Z");
  });

  it("refuses a renewal date before the start date", () => {
    expect(() =>
      move("APPROVED", {
        award: {
          amountPkr: 5000,
          period: "MONTHLY",
          startDate: "2027-07-01",
          renewalDate: "2027-01-01",
        },
      }),
    ).toThrow();
  });
});

describe("checklist and notes", () => {
  it("records which checklist items changed, and locks the checklist once verified", async () => {
    const id = await submit();
    await updateChecklist(staff, id, { ...FULL_CHECKLIST, eligibility: false });

    const entry = await AuditLogModel.findOne({ action: "application.checklist_updated" }).lean();
    expect(entry?.metadata).toEqual({ identity: "true", education: "true", documents: "true" });

    await advanceTo(id, ["UNDER_REVIEW", "VERIFIED"]);
    await expect(
      updateChecklist(staff, id, { ...FULL_CHECKLIST, identity: false }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("adds an internal note to the timeline", async () => {
    const id = await submit();
    const application = await addNote(staff, id, "Called the applicant about the photo.");

    expect(application.timeline[0]).toMatchObject({
      kind: "NOTE",
      text: "Called the applicant about the photo.",
    });
    await expect(addNote(staff, "0".repeat(24), "x")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

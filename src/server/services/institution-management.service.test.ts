import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  agreementFormSchema,
  institutionFormSchema,
  type InstitutionFormInput,
} from "@/lib/validations/institution";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import {
  addAgreement,
  addReview,
  createInstitution,
  getInstitutionsForStaff,
  updateAgreement,
  updateInstitution,
} from "@/server/services/institution-management.service";
import { inspectUpload, markUploadsConfirmed } from "@/server/storage/cloudinary";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({ revalidateTag }));
vi.mock("@/server/storage/cloudinary", () => ({
  inspectUpload: vi.fn(),
  markUploadsConfirmed: vi.fn(),
  deletePublicImage: vi.fn(),
}));

const OFFICE = "INSTITUTIONAL_DEVELOPMENT" as const;

function person(
  role: StaffContext["role"],
  departmentCode: StaffContext["departmentCode"] = OFFICE,
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

function form(overrides: Partial<InstitutionFormInput> = {}): InstitutionFormInput {
  return institutionFormSchema.parse({
    name: "Govt High School Vehari",
    type: "SCHOOL",
    city: "Vehari",
    address: "",
    description: "",
    status: "PROPOSED",
    isPublic: false,
    imageAlt: "",
    ...overrides,
  });
}

const agreement = (overrides: Record<string, unknown> = {}) =>
  agreementFormSchema.parse({
    title: "Partnership",
    partner: "District Education Authority",
    startDate: "2026-01-01",
    endDate: "",
    renewalDate: "2027-01-01",
    status: "DRAFT",
    ...overrides,
  });

const pdf = (name: string) => ({
  publicId: `oedf-dev/agreements/${name}`,
  resourceType: "image" as const,
  originalName: `${name}.pdf`,
});

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    FileAssetModel.deleteMany({}),
    InstitutionModel.deleteMany({}),
  ]);
  vi.resetAllMocks();
  vi.mocked(inspectUpload).mockResolvedValue({ format: "pdf", bytes: 2000 });
});

describe("institutions", () => {
  it("lets Staff add and edit an institution, but only a Director makes it public", async () => {
    const { id } = await createInstitution(staff, form());
    await updateInstitution(staff, id, form({ status: "ACTIVE" }));
    await expect(updateInstitution(staff, id, form({ isPublic: true }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const shown = await updateInstitution(director, id, form({ status: "ACTIVE", isPublic: true }));
    expect(shown.isPublic).toBe(true);
    expect(revalidateTag).toHaveBeenCalledWith("institutions", { expire: 0 });
    await expect(
      updateInstitution(staff, id, form({ status: "ACTIVE", isPublic: true, city: "Multan" })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("keeps other offices out", async () => {
    await expect(
      createInstitution(person("STAFF", "ADMISSIONS_SCHOLARSHIPS"), form()),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lists every institution with its next renewal and average rating", async () => {
    const { id } = await createInstitution(staff, form());
    await createInstitution(staff, form({ name: "City College", type: "COLLEGE" }));
    await addAgreement(staff, id, agreement({ renewalDate: "2099-06-01" }));
    await addReview(staff, id, { reviewDate: "2026-10-01", rating: 4, summary: "Good" });
    await addReview(staff, id, { reviewDate: "2026-11-01", rating: 5, summary: "Better" });

    const { items } = await getInstitutionsForStaff({ page: 1, pageSize: 20, sort: "name" });
    expect(items.map((item) => [item.name, item.nextRenewal, item.averageRating])).toEqual([
      ["City College", null, null],
      ["Govt High School Vehari", "2099-06-01", 4.5],
    ]);
  });
});

describe("agreements", () => {
  it("adds an agreement with a private signed copy, keeps it on edit, and replaces it", async () => {
    const { id } = await createInstitution(staff, form());
    const added = await addAgreement(staff, id, agreement({ document: pdf("signed") }));
    const [saved] = added.agreements;
    expect(saved).toMatchObject({ title: "Partnership", renewalDate: "2027-01-01" });
    expect(saved?.document?.originalName).toBe("signed.pdf");
    expect(await FileAssetModel.countDocuments({ "owner.type": "Institution" })).toBe(1);
    expect(markUploadsConfirmed).toHaveBeenCalledTimes(1);

    vi.mocked(inspectUpload).mockClear();
    const kept = await updateAgreement(
      staff,
      id,
      saved?.id ?? "",
      agreement({ status: "APPROVED", document: pdf("signed") }),
    );
    expect(inspectUpload).not.toHaveBeenCalled();
    expect(kept.agreements[0]).toMatchObject({ status: "APPROVED" });
    expect(kept.agreements[0]?.document?.fileId).toBe(saved?.document?.fileId);

    const replaced = await updateAgreement(
      staff,
      id,
      saved?.id ?? "",
      agreement({ document: pdf("signed-v2") }),
    );
    expect(replaced.agreements[0]?.document?.originalName).toBe("signed-v2.pdf");
    expect(await AuditLogModel.countDocuments({ action: "institution.agreement_updated" })).toBe(2);
  });

  it("refuses an end date before the start date, and an unknown agreement", async () => {
    expect(() => agreement({ endDate: "2025-01-01" })).toThrow();
    const { id } = await createInstitution(staff, form());
    await expect(
      updateAgreement(staff, id, new mongoose.Types.ObjectId().toString(), agreement()),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("reviews", () => {
  it("records the reviewer, newest first, and refuses the CEO Office", async () => {
    const { id } = await createInstitution(staff, form());
    await addReview(staff, id, { reviewDate: "2026-01-01", rating: 3, summary: "Adequate" });
    const institution = await addReview(director, id, {
      reviewDate: "2026-06-01",
      rating: 5,
      summary: "Excellent",
    });
    expect(institution.reviews.map((review) => [review.rating, review.reviewerName])).toEqual([
      [5, "DIRECTOR person"],
      [3, "STAFF person"],
    ]);
    await expect(
      addReview(person("CEO_OFFICE", "CEO_OFFICE"), id, {
        reviewDate: "2026-06-01",
        rating: 5,
        summary: "x",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

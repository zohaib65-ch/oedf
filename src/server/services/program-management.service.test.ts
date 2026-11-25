import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { programFormSchema, type ProgramFormInput } from "@/lib/validations/program";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { ApplicationModel } from "@/server/db/models/application.model";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { InstitutionModel } from "@/server/db/models/institution.model";
import { ProgramModel } from "@/server/db/models/program.model";
import {
  createProgram,
  deleteProgram,
  getProgramForStaff,
  getProgramsForStaff,
  updateProgram,
} from "@/server/services/program-management.service";
import {
  deletePublicImage,
  inspectUpload,
  markUploadsConfirmed,
} from "@/server/storage/cloudinary";

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

function form(overrides: Partial<ProgramFormInput> = {}): ProgramFormInput {
  return programFormSchema.parse({
    title: "Web Development",
    category: "VOCATIONAL",
    summary: "Build websites from scratch.",
    description: "",
    duration: "6 months",
    eligibility: "",
    institutionIds: [],
    acceptsApplications: false,
    status: "DRAFT",
    imageAlt: "",
    ...overrides,
  });
}

const image = (name: string) => ({
  publicId: `oedf-dev/images/${name}`,
  resourceType: "image" as const,
  originalName: `${name}.jpg`,
});

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    ApplicationModel.deleteMany({}),
    AuditLogModel.deleteMany({}),
    InstitutionModel.deleteMany({}),
    ProgramModel.deleteMany({}),
  ]);
  vi.resetAllMocks();
  vi.mocked(inspectUpload).mockResolvedValue({
    format: "jpg",
    bytes: 1000,
    width: 1200,
    height: 800,
  });
});

describe("createProgram", () => {
  it("lets Staff save a draft but not publish, and gives each program its own address", async () => {
    const first = await createProgram(staff, form());
    const second = await createProgram(staff, form());
    expect([first.slug, second.slug]).toEqual(["web-development", "web-development-2"]);
    expect(revalidateTag).not.toHaveBeenCalled();

    await expect(createProgram(staff, form({ status: "PUBLISHED" }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const published = await createProgram(director, form({ status: "PUBLISHED" }));
    expect(published.status).toBe("PUBLISHED");
    expect(revalidateTag).toHaveBeenCalledWith("programs", { expire: 0 });
  });

  it("keeps other offices and the CEO Office out", async () => {
    await expect(
      createProgram(person("DIRECTOR", "RESEARCH_POLICY"), form()),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(createProgram(person("CEO_OFFICE", "CEO_OFFICE"), form())).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("links existing institutions only", async () => {
    const institution = await InstitutionModel.create({
      slug: "govt-school",
      name: "Govt School",
      type: "SCHOOL",
      city: "Vehari",
    });
    const linked = await createProgram(
      staff,
      form({ institutionIds: [institution._id.toString()] }),
    );
    expect(linked.institutionIds).toEqual([institution._id.toString()]);
    await expect(
      createProgram(staff, form({ institutionIds: [new mongoose.Types.ObjectId().toString()] })),
    ).rejects.toMatchObject({ details: { fieldErrors: { institutionIds: expect.any(Array) } } });
  });
});

describe("updateProgram", () => {
  it("lets Staff edit a draft; a published program needs a Director", async () => {
    const { id } = await createProgram(staff, form());
    await updateProgram(staff, id, form({ duration: "3 months" }));
    const entry = await AuditLogModel.findOne({ action: "program.updated" }).lean();
    expect(entry?.metadata).toEqual({ fields: "duration" });

    await updateProgram(director, id, form({ duration: "3 months", status: "PUBLISHED" }));
    await expect(
      updateProgram(staff, id, form({ duration: "4 months", status: "PUBLISHED" })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("saves a photo with its description, keeps it, then replaces it and deletes the old one", async () => {
    // A photo needs its description for people who cannot see it.
    expect(() => form({ image: image("first") })).toThrow();

    const { id } = await createProgram(
      staff,
      form({ image: image("first"), imageAlt: "Students" }),
    );
    let program = await getProgramForStaff(id);
    expect(program.image).toEqual({
      publicId: "oedf-dev/images/first",
      width: 1200,
      height: 800,
      alt: "Students",
    });
    expect(markUploadsConfirmed).toHaveBeenCalledWith([
      { publicId: "oedf-dev/images/first", resourceType: "image", deliveryType: "upload" },
    ]);

    vi.mocked(inspectUpload).mockClear();
    await updateProgram(staff, id, form({ image: image("first"), imageAlt: "Students at work" }));
    expect(inspectUpload).not.toHaveBeenCalled();

    await updateProgram(staff, id, form({ image: image("second"), imageAlt: "New photo" }));
    program = await getProgramForStaff(id);
    expect(program.image?.publicId).toBe("oedf-dev/images/second");
    expect(deletePublicImage).toHaveBeenCalledWith("oedf-dev/images/first");

    await updateProgram(staff, id, form());
    expect((await getProgramForStaff(id)).image).toBeNull();
  });
});

describe("deleteProgram", () => {
  it("deletes a draft, but never one that applications chose", async () => {
    const draft = await createProgram(staff, form());
    const chosen = await createProgram(staff, form({ title: "Freelancing" }));
    await ApplicationModel.collection.insertOne({
      programId: new mongoose.Types.ObjectId(chosen.id),
    });

    await expect(deleteProgram(staff, chosen.id)).rejects.toMatchObject({ code: "CONFLICT" });
    await deleteProgram(staff, draft.id);
    await expect(getProgramForStaff(draft.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await AuditLogModel.countDocuments({ action: "program.deleted" })).toBe(1);
  });

  it("needs a Director to delete a published program", async () => {
    const { id } = await createProgram(director, form({ status: "PUBLISHED" }));
    await expect(deleteProgram(staff, id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await deleteProgram(director, id);
  });
});

describe("getProgramsForStaff", () => {
  it("lists drafts too, filters by status and counts applications", async () => {
    await createProgram(staff, form({ title: "Draft program" }));
    const published = await createProgram(
      director,
      form({ title: "Live program", status: "PUBLISHED" }),
    );
    await ApplicationModel.collection.insertOne({
      programId: new mongoose.Types.ObjectId(published.id),
    });
    const query = { page: 1, pageSize: 20, sort: "title" as const };

    const all = await getProgramsForStaff(query);
    expect(all.items.map((item) => [item.title, item.applicationCount])).toEqual([
      ["Draft program", 0],
      ["Live program", 1],
    ]);
    expect((await getProgramsForStaff({ ...query, status: "PUBLISHED" })).total).toBe(1);
    expect((await getProgramsForStaff({ ...query, q: "live" })).total).toBe(1);
  });
});

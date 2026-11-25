import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { publicationFormSchema, type PublicationFormInput } from "@/lib/validations/publication";
import type { StaffContext } from "@/server/auth/api-session";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { PublicationModel } from "@/server/db/models/publication.model";
import {
  createPublication,
  deletePublication,
  getPublicationsForStaff,
  updatePublication,
} from "@/server/services/publication-management.service";
import { getPublicationPdfUrl } from "@/server/services/publication.service";
import {
  createPrivateDownloadUrl,
  deletePublicImage,
  deleteUploads,
  inspectUpload,
  markUploadsConfirmed,
} from "@/server/storage/cloudinary";

const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  revalidateTag,
  // The public service caches its reads; in tests they run directly.
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));
vi.mock("@/server/storage/cloudinary", () => ({
  inspectUpload: vi.fn(),
  markUploadsConfirmed: vi.fn(),
  deletePublicImage: vi.fn(),
  deleteUploads: vi.fn(),
  createPrivateDownloadUrl: vi.fn(),
  publicImageUrl: vi.fn(),
}));

const OFFICE = "RESEARCH_POLICY" as const;

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

function form(overrides: Record<string, unknown> = {}): PublicationFormInput {
  return publicationFormSchema.parse({
    title: "Rural literacy study",
    type: "RESEARCH_REPORT",
    summary: "What we found in 40 schools.",
    authors: "A. Khan, B. Ali, A. Khan",
    tags: "",
    publishedOn: "",
    status: "DRAFT",
    imageAlt: "",
    ...overrides,
  });
}

const pdf = (name: string) => ({
  publicId: `oedf-dev/publications/${name}`,
  resourceType: "image" as const,
  originalName: `${name}.pdf`,
});

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    FileAssetModel.deleteMany({}),
    PublicationModel.deleteMany({}),
  ]);
  vi.resetAllMocks();
  vi.mocked(inspectUpload).mockResolvedValue({ format: "pdf", bytes: 2000 });
  vi.mocked(createPrivateDownloadUrl).mockReturnValue("https://files.example/signed");
});

describe("publication management", () => {
  it("lets Staff save drafts only, and splits the author list", async () => {
    const draft = await createPublication(staff, form());
    expect(draft.status).toBe("DRAFT");
    expect(draft.authors).toEqual(["A. Khan", "B. Ali"]);
    expect(draft.publishedOn).toBeNull();
    expect(revalidateTag).not.toHaveBeenCalled();

    await expect(createPublication(staff, form({ status: "PUBLISHED" }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("keeps Staff out of other offices and away from published publications", async () => {
    await expect(
      createPublication(person("STAFF", "HR_TEACHER_MANAGEMENT"), form()),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    const published = await createPublication(director, form({ status: "PUBLISHED" }));
    await expect(
      updatePublication(staff, published.id, form({ status: "PUBLISHED", title: "Changed" })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("dates a publication on the day it is published, and refreshes the public pages", async () => {
    const published = await createPublication(director, form({ status: "PUBLISHED" }));
    expect(published.publishedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(revalidateTag).toHaveBeenCalledWith("publications", { expire: 0 });

    const dated = await createPublication(
      director,
      form({ title: "Brief", status: "PUBLISHED", publishedOn: "2026-03-01" }),
    );
    expect(dated.publishedOn).toBe("2026-03-01");
    expect(dated.slug).toBe("brief");
  });

  it("saves a checked PDF as a private file, replaces it and deletes the old one", async () => {
    const created = await createPublication(director, form({ pdf: pdf("first") }));
    expect(created.pdf?.originalName).toBe("first.pdf");
    expect(markUploadsConfirmed).toHaveBeenCalledWith([pdf("first")]);
    const first = await FileAssetModel.findById(created.pdf?.fileId).lean();
    expect(first).toMatchObject({
      purpose: "PUBLICATION_PDF",
      access: "PRIVATE",
      owner: { type: "Publication" },
    });

    const kept = await updatePublication(
      director,
      created.id,
      form({ pdf: pdf("first"), title: "Renamed" }),
    );
    expect(kept.pdf?.fileId).toBe(created.pdf?.fileId);
    expect(deleteUploads).not.toHaveBeenCalled();

    const replaced = await updatePublication(director, created.id, form({ pdf: pdf("second") }));
    expect(replaced.pdf?.originalName).toBe("second.pdf");
    expect(await FileAssetModel.countDocuments()).toBe(1);
    expect(deleteUploads).toHaveBeenCalledWith([
      expect.objectContaining({ publicId: pdf("first").publicId }),
    ]);
  });

  it("hands out the PDF of a published publication only", async () => {
    const draft = await createPublication(director, form({ pdf: pdf("draft") }));
    expect(await getPublicationPdfUrl(draft.slug)).toBeNull();

    await updatePublication(director, draft.id, form({ pdf: pdf("draft"), status: "PUBLISHED" }));
    expect(await getPublicationPdfUrl(draft.slug)).toBe("https://files.example/signed");

    await updatePublication(director, draft.id, form({ pdf: pdf("draft"), status: "ARCHIVED" }));
    expect(await getPublicationPdfUrl(draft.slug)).toBeNull();
  });

  it("lets only a Director delete, removing the PDF, the cover and the record", async () => {
    vi.mocked(inspectUpload).mockResolvedValueOnce({ format: "pdf", bytes: 2000 });
    vi.mocked(inspectUpload).mockResolvedValueOnce({
      format: "jpg",
      bytes: 1000,
      width: 800,
      height: 600,
    });
    const created = await createPublication(
      director,
      form({
        status: "PUBLISHED",
        pdf: pdf("doomed"),
        image: { publicId: "oedf-dev/images/cover", resourceType: "image", originalName: "c.jpg" },
        imageAlt: "A classroom",
      }),
    );
    await expect(deletePublication(staff, created.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await deletePublication(director, created.id);
    expect(await PublicationModel.countDocuments()).toBe(0);
    expect(await FileAssetModel.countDocuments()).toBe(0);
    expect(deleteUploads).toHaveBeenCalledWith([
      expect.objectContaining({ publicId: pdf("doomed").publicId }),
    ]);
    expect(deletePublicImage).toHaveBeenCalledWith("oedf-dev/images/cover");
    expect(await AuditLogModel.countDocuments({ action: "publication.deleted" })).toBe(1);
  });

  it("lists, filters and searches every publication", async () => {
    await createPublication(director, form({ title: "Alpha", status: "PUBLISHED" }));
    await createPublication(director, form({ title: "Beta", type: "BRIEF" }));

    const all = await getPublicationsForStaff({
      page: 1,
      pageSize: 20,
      sort: "title",
      q: undefined,
      status: undefined,
      type: undefined,
    });
    expect(all.items.map((item) => item.title)).toEqual(["Alpha", "Beta"]);
    const briefs = await getPublicationsForStaff({
      page: 1,
      pageSize: 20,
      sort: "title",
      q: "be",
      status: "DRAFT",
      type: "BRIEF",
    });
    expect(briefs.total).toBe(1);
  });
});

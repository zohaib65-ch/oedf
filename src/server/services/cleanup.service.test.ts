import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { connectDb } from "@/server/db/connection";
import { FileAssetModel } from "@/server/db/models/file-asset.model";
import { cleanupStaleUploads } from "@/server/services/cleanup.service";
import {
  deleteUploads,
  findStalePendingUploads,
  markUploadsConfirmed,
} from "@/server/storage/cloudinary";

vi.mock("@/server/storage/cloudinary", () => ({
  findStalePendingUploads: vi.fn(),
  deleteUploads: vi.fn(),
  markUploadsConfirmed: vi.fn(),
}));

beforeEach(async () => {
  await connectDb();
  await FileAssetModel.deleteMany({});
  vi.resetAllMocks();
});

describe("cleanupStaleUploads", () => {
  it("deletes abandoned uploads but never a file the database has saved", async () => {
    await FileAssetModel.create({
      publicId: "oedf-dev/applications/saved",
      resourceType: "image",
      access: "PRIVATE",
      format: "pdf",
      bytes: 10,
      originalName: "a.pdf",
      purpose: "APPLICATION_DOCUMENT",
      owner: { type: "Application", id: new mongoose.Types.ObjectId() },
    });
    vi.mocked(findStalePendingUploads).mockResolvedValue([
      { publicId: "oedf-dev/applications/saved", resourceType: "image" },
      { publicId: "oedf-dev/applications/abandoned", resourceType: "image" },
    ]);

    const result = await cleanupStaleUploads();

    expect(result).toEqual({ deleted: 1, untagged: 1 });
    expect(deleteUploads).toHaveBeenCalledWith([
      { publicId: "oedf-dev/applications/abandoned", resourceType: "image" },
    ]);
    expect(markUploadsConfirmed).toHaveBeenCalledWith([
      { publicId: "oedf-dev/applications/saved", resourceType: "image" },
    ]);
  });
});

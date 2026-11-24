import { beforeEach, describe, expect, it, vi } from "vitest";

import { inspectUpload } from "@/server/storage/cloudinary";

const { resource, destroy } = vi.hoisted(() => ({ resource: vi.fn(), destroy: vi.fn() }));

vi.mock("cloudinary", () => ({
  default: {
    v2: {
      config: vi.fn(() => ({ cloud_name: "test-cloud", api_key: "key", api_secret: "secret" })),
      api: { resource },
      uploader: { destroy },
    },
  },
}));

const ref = { publicId: "oedf-dev/applications/abc", resourceType: "image" as const };
const pending = { type: "authenticated", tags: ["pending"], format: "pdf", bytes: 1000 };

beforeEach(() => {
  vi.resetAllMocks();
  destroy.mockResolvedValue({ result: "ok" });
});

describe("inspectUpload", () => {
  it("accepts a pending file in an allowed format and size, and deletes nothing", async () => {
    resource.mockResolvedValue(pending);
    await expect(inspectUpload(ref, "APPLICATION_DOCUMENT")).resolves.toEqual({
      format: "pdf",
      bytes: 1000,
    });
    expect(destroy).not.toHaveBeenCalled();
  });

  it("deletes our own pending file when its format or size is wrong, and refuses it", async () => {
    resource.mockResolvedValue({ ...pending, format: "exe" });
    await expect(inspectUpload(ref, "APPLICATION_DOCUMENT")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(destroy).toHaveBeenCalledWith(
      ref.publicId,
      expect.objectContaining({ type: "authenticated" }),
    );

    destroy.mockClear();
    resource.mockResolvedValue({ ...pending, bytes: 6 * 1024 * 1024 });
    await expect(inspectUpload(ref, "APPLICATION_DOCUMENT")).rejects.toThrow(/5 MB/);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it("never deletes a file that is already confirmed (no pending tag), such as one saved with an application", async () => {
    resource.mockResolvedValue({ ...pending, tags: [] });
    await expect(inspectUpload(ref, "APPLICATION_DOCUMENT")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(destroy).not.toHaveBeenCalled();
  });

  it("never deletes a public ID outside the folder this server signed for the purpose", async () => {
    await expect(
      inspectUpload(
        { publicId: "oedf-dev/cv/someone-elses", resourceType: "image" },
        "APPLICATION_DOCUMENT",
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    await expect(
      inspectUpload(
        { publicId: "other-project/secret", resourceType: "image" },
        "APPLICATION_DOCUMENT",
      ),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(resource).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it("never deletes a file that is not private, and answers a missing file as not found without deleting", async () => {
    resource.mockResolvedValue({ ...pending, type: "upload" });
    await expect(inspectUpload(ref, "APPLICATION_DOCUMENT")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });

    resource.mockRejectedValue({ error: { http_code: 404 } });
    await expect(inspectUpload(ref, "APPLICATION_DOCUMENT")).rejects.toThrow(/could not be found/);
    expect(destroy).not.toHaveBeenCalled();
  });
});

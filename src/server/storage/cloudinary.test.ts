import { describe, expect, it } from "vitest";

import { createPrivateDownloadUrl, signUpload } from "@/server/storage/cloudinary";

// These helpers only sign; they make no network call. The test environment has a fake CLOUDINARY_URL.

describe("signUpload", () => {
  it("uses a random public ID in the purpose's folder and marks the upload private and pending", () => {
    const first = signUpload("APPLICATION_DOCUMENT", "pdf");
    const second = signUpload("APPLICATION_DOCUMENT", "pdf");

    expect(first.publicId).toMatch(/^oedf-dev\/applications\/[0-9a-f-]{36}$/);
    expect(first.publicId).not.toBe(second.publicId);
    expect(first).toMatchObject({
      type: "authenticated",
      tags: "pending",
      resourceType: "image",
      allowedFormats: "pdf,jpg,jpeg,png",
    });
    expect(first.signature).toMatch(/^[0-9a-f]{40,}$/);
    expect(first.uploadUrl).toBe("https://api.cloudinary.com/v1_1/test-cloud/image/upload");
  });

  it("stores a Word CV as a raw file whose public ID keeps its extension", () => {
    const cv = signUpload("CV", "docx");
    expect(cv.publicId).toMatch(/^oedf-dev\/cv\/[0-9a-f-]{36}\.docx$/);
    expect(cv.resourceType).toBe("raw");
    expect(cv.uploadUrl).toContain("/raw/upload");
  });
});

describe("createPrivateDownloadUrl", () => {
  it("creates a signed API link that expires about 5 minutes from now", () => {
    const url = new URL(
      createPrivateDownloadUrl({
        publicId: "oedf-dev/applications/x",
        resourceType: "image",
        format: "pdf",
      }),
    );
    const expiresAt = Number(url.searchParams.get("expires_at"));
    const secondsLeft = expiresAt - Date.now() / 1000;

    expect(url.hostname).toBe("api.cloudinary.com");
    expect(url.searchParams.get("type")).toBe("authenticated");
    expect(url.searchParams.get("signature")).toBeTruthy();
    expect(secondsLeft).toBeGreaterThan(290);
    expect(secondsLeft).toBeLessThanOrEqual(300);
  });
});

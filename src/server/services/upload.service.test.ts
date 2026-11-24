import { describe, expect, it } from "vitest";

import { createUploadPermission } from "@/server/services/upload.service";

describe("createUploadPermission", () => {
  it("signs an upload for an allowed format", () => {
    const permission = createUploadPermission({
      purpose: "APPLICATION_DOCUMENT",
      fileName: "Result Card.PNG",
      bytes: 1000,
    });
    expect(permission.publicId).toContain("oedf-dev/applications/");
  });

  it("refuses a format the purpose does not allow, naming the allowed ones", () => {
    expect(() =>
      createUploadPermission({ purpose: "APPLICATION_DOCUMENT", fileName: "cv.docx", bytes: 10 }),
    ).toThrow(/PDF, JPG or PNG/);
    expect(() =>
      createUploadPermission({ purpose: "CV", fileName: "photo.png", bytes: 10 }),
    ).toThrow(/PDF or DOCX/);
    expect(() =>
      createUploadPermission({ purpose: "CV", fileName: "noextension", bytes: 10 }),
    ).toThrow();
  });
});

import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { ALL_MODELS } from "@/server/db/models/all-models";
import { ApplicationModel } from "@/server/db/models/application.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { RateLimitModel } from "@/server/db/models/rate-limit.model";
import { SiteSettingsModel } from "@/server/db/models/site-settings.model";

function validApplication(referenceNumber: string) {
  return {
    referenceNumber,
    type: "ADMISSION" as const,
    applicant: {
      fullName: "Test Applicant",
      guardianName: "Test Guardian",
      dateOfBirth: new Date("2010-01-01"),
      gender: "MALE" as const,
      cnic: "1234512345671",
      email: "Applicant@Example.org",
      phone: "03001234567",
      address: "Street 1",
      city: "Vehari",
    },
    education: {
      lastInstitution: "School",
      classOrDegree: "Class 8",
      boardOrUniversity: "Board",
      marksOrPercentage: "80%",
      passingYear: 2025,
    },
  };
}

beforeEach(async () => {
  await connectDb();
});

// Building every index one collection at a time can pass 5 seconds on a busy machine.
const INDEX_BUILD_TIMEOUT_MS = 20_000;

describe("models", () => {
  it(
    "registers all 17 collections and builds every declared index without errors",
    async () => {
      expect(ALL_MODELS).toHaveLength(17);
      for (const Model of ALL_MODELS) {
        await expect(Model.syncIndexes()).resolves.toBeDefined();
      }
    },
    INDEX_BUILD_TIMEOUT_MS,
  );

  it("stores timestamps, lowercases emails and defaults a new application to Submitted", async () => {
    const application = await ApplicationModel.create(validApplication("OEDF-ADM-2026-000001"));

    expect(application.status).toBe("SUBMITTED");
    expect(application.applicant.email).toBe("applicant@example.org");
    expect(application.createdAt).toBeInstanceOf(Date);
    expect(application.checklist.identity).toBe(false);
  });

  it("refuses a duplicate reference number", async () => {
    await ApplicationModel.init();
    await ApplicationModel.create(validApplication("OEDF-ADM-2026-000002"));

    await expect(ApplicationModel.create(validApplication("OEDF-ADM-2026-000002"))).rejects.toThrow(
      /duplicate key/,
    );
  });

  it("rejects a value that is not in the enum", async () => {
    const application = new ApplicationModel(validApplication("OEDF-ADM-2026-000003"));
    application.set("status", "FINISHED");

    await expect(application.validate()).rejects.toThrow(/not a valid enum value/);
  });

  it("keeps request input from injecting query operators", async () => {
    await DepartmentModel.create({
      code: "CEO_OFFICE",
      slug: "ceo",
      name: "CEO",
      purpose: "Purpose",
      order: 1,
    });

    // Without sanitizeFilter, { $ne: "x" } would match every office. With it, the object is treated
    // as a literal value, which cannot be cast to a string, so the query is refused.
    const injected: unknown = { $ne: "x" };
    await expect(DepartmentModel.find().where("code").equals(injected).lean()).rejects.toThrow(
      /Cast to string failed/,
    );
  });

  it("allows only one site settings document", async () => {
    await SiteSettingsModel.init();
    await SiteSettingsModel.create({});

    await expect(SiteSettingsModel.create({})).rejects.toThrow(/duplicate key/);
  });

  it("creates a TTL index on rate limit buckets", async () => {
    await RateLimitModel.init();
    const indexes = await RateLimitModel.collection.indexes();

    expect(indexes.some((index) => index.expireAfterSeconds === 0)).toBe(true);
  });
});

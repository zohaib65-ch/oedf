import { describe, expect, it } from "vitest";

import { applicationSchema, statusLookupSchema } from "@/lib/validations/application";

import { buildApplicationInput, scholarshipExtras } from "../../../tests/helpers/application-input";

describe("application schema", () => {
  it("normalizes the CNIC and email", () => {
    const input = buildApplicationInput();
    expect(input.applicant.cnic).toBe("3520212345671");
    expect(input.applicant.email).toBe("ayesha@example.org");
  });

  it("requires financial information and proof of income for a scholarship", () => {
    const result = applicationSchema.safeParse({ ...buildApplicationInput(), type: "SCHOLARSHIP" });
    const paths = result.error?.issues.map((issue) => issue.path.join(".")) ?? [];
    expect(paths).toContain("financial");
    expect(paths).toContain("documents.incomeProof");
    expect(() => buildApplicationInput(scholarshipExtras)).not.toThrow();
  });

  it("rejects a future birth date, a short CNIC and an unchecked declaration", () => {
    const bad = applicationSchema.safeParse({
      ...buildApplicationInput(),
      applicant: { ...buildApplicationInput().applicant, dateOfBirth: "2999-01-01", cnic: "123" },
      declaration: false,
    });
    const paths = bad.error?.issues.map((issue) => issue.path.join(".")) ?? [];
    expect(paths).toEqual(
      expect.arrayContaining(["applicant.dateOfBirth", "applicant.cnic", "declaration"]),
    );
  });
});

describe("status lookup schema", () => {
  it("accepts a reference number in any case and rejects other shapes", () => {
    const parsed = statusLookupSchema.parse({
      referenceNumber: " oedf-adm-2026-000123 ",
      email: "A@b.org",
    });
    expect(parsed.referenceNumber).toBe("OEDF-ADM-2026-000123");
    expect(
      statusLookupSchema.safeParse({ referenceNumber: "12345", email: "a@b.org" }).success,
    ).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { listUsersQuerySchema } from "@/lib/validations/user";

describe("listUsersQuerySchema", () => {
  it("treats All roles, an empty value and an unknown role as no filter", () => {
    for (const role of ["ALL", "", "NOT_A_ROLE"]) {
      expect(listUsersQuerySchema.parse({ role }).role).toBeUndefined();
    }
    expect(listUsersQuerySchema.parse({ role: "DIRECTOR" }).role).toBe("DIRECTOR");
  });
});

describe("the sort parameter", () => {
  it("accepts a known field in either direction and falls back for anything else", () => {
    expect(listUsersQuerySchema.parse({}).sort).toBe("-createdAt");
    expect(listUsersQuerySchema.parse({ sort: "name" }).sort).toBe("name");
    expect(listUsersQuerySchema.parse({ sort: "-email" }).sort).toBe("-email");
    expect(listUsersQuerySchema.parse({ sort: "password" }).sort).toBe("-createdAt");
    expect(listUsersQuerySchema.parse({ sort: ["name"] }).sort).toBe("-createdAt");
  });
});

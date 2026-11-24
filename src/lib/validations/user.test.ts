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

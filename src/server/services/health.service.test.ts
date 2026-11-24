import { describe, expect, it, vi } from "vitest";

import { checkHealth } from "@/server/services/health.service";

describe("checkHealth", () => {
  it("reports ok when the database answers", async () => {
    await expect(checkHealth()).resolves.toEqual({ status: "ok" });
  });

  it("fails when the database cannot be reached", async () => {
    vi.resetModules();
    vi.doMock("@/server/repositories/health.repository", () => ({
      pingDatabase: vi.fn().mockRejectedValue(new Error("no connection")),
    }));

    const { checkHealth: failingCheck } = await import("@/server/services/health.service");
    await expect(failingCheck()).rejects.toThrow("no connection");

    vi.doUnmock("@/server/repositories/health.repository");
  });
});

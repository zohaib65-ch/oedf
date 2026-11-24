import { describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/v1/internal/cleanup-uploads/route";
import { cleanupStaleUploads } from "@/server/services/cleanup.service";

vi.mock("@/server/services/cleanup.service", () => ({ cleanupStaleUploads: vi.fn() }));

const call = (authorization?: string) =>
  POST(
    new Request("http://localhost:3000/api/v1/internal/cleanup-uploads", {
      method: "POST",
      headers: authorization ? { authorization } : {},
    }),
    undefined,
  );

describe("POST /api/v1/internal/cleanup-uploads", () => {
  it("refuses a missing or wrong secret and does not clean anything", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer wrong")).status).toBe(401);
    expect(cleanupStaleUploads).not.toHaveBeenCalled();
  });

  it("runs the cleanup for the right secret, without a browser origin", async () => {
    vi.mocked(cleanupStaleUploads).mockResolvedValue({ deleted: 2, untagged: 0 });

    const response = await call("Bearer test-cron-secret-with-at-least-32-characters");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { deleted: 2, untagged: 0 } });
  });
});

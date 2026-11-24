import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { connectDb } from "@/server/db/connection";
import { RateLimitModel } from "@/server/db/models/rate-limit.model";
import { enforceRateLimit } from "@/server/security/rate-limit";

const rule = { scope: "contact", ip: "203.0.113.1", limit: 3, windowMs: 600_000 };

beforeEach(async () => {
  await connectDb();
  await RateLimitModel.deleteMany({});
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-06-01T10:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("enforceRateLimit", () => {
  it("allows the limit and then answers 429", async () => {
    for (let i = 0; i < 3; i++) {
      await enforceRateLimit(rule);
    }
    await expect(enforceRateLimit(rule)).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("counts each IP and each form separately", async () => {
    for (let i = 0; i < 3; i++) {
      await enforceRateLimit(rule);
    }
    await expect(enforceRateLimit({ ...rule, ip: "203.0.113.2" })).resolves.toBeUndefined();
    await expect(enforceRateLimit({ ...rule, scope: "application" })).resolves.toBeUndefined();
  });

  it("starts again in the next window", async () => {
    for (let i = 0; i < 3; i++) {
      await enforceRateLimit(rule);
    }
    vi.setSystemTime(new Date("2026-06-01T10:10:01Z"));
    await expect(enforceRateLimit(rule)).resolves.toBeUndefined();
  });

  it("stores the IP only as a hash", async () => {
    await enforceRateLimit(rule);
    const bucket = await RateLimitModel.findOne({}).lean();
    expect(bucket?.key).not.toContain("203.0.113.1");
    expect(bucket?.expiresAt.toISOString()).toBe("2026-06-01T10:10:00.000Z");
  });
});

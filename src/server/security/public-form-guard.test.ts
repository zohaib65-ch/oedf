import { beforeEach, describe, expect, it } from "vitest";

import { connectDb } from "@/server/db/connection";
import { RateLimitModel } from "@/server/db/models/rate-limit.model";
import { FORM_RATE_LIMIT, guardPublicRequest } from "@/server/security/public-form-guard";

const request = (ip = "198.51.100.7") =>
  new Request("http://localhost:3000/api/v1/contact-messages", {
    method: "POST",
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });

beforeEach(async () => {
  await connectDb();
  await RateLimitModel.deleteMany({});
});

describe("guardPublicRequest", () => {
  it("rejects a filled honeypot without counting it against the rate limit", async () => {
    await expect(
      guardPublicRequest(request(), { scope: "contact", ...FORM_RATE_LIMIT, faxNumber: "123" }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
    expect(await RateLimitModel.countDocuments()).toBe(0);
  });

  it("allows 5 submissions per IP, then answers 429, using the first address in x-forwarded-for", async () => {
    for (let i = 0; i < 5; i++) {
      await guardPublicRequest(request(), { scope: "contact", ...FORM_RATE_LIMIT });
    }
    await expect(
      guardPublicRequest(request(), { scope: "contact", ...FORM_RATE_LIMIT }),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    await expect(
      guardPublicRequest(request("198.51.100.8"), { scope: "contact", ...FORM_RATE_LIMIT }),
    ).resolves.toBeUndefined();
  });
});

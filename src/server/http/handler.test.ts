import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppError } from "@/server/http/errors";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";

const SITE_ORIGIN = "http://localhost:3000";

function request(method: string, origin?: string): Request {
  return new Request(`${SITE_ORIGIN}/api/v1/example`, {
    method,
    headers: origin ? { origin } : {},
  });
}

const context = undefined;

describe("withApiHandler", () => {
  it("returns the handler's success response untouched", async () => {
    const handler = withApiHandler(() => ok({ hello: "world" }));
    const response = await handler(request("GET"), context);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { hello: "world" } });
  });

  it.each([
    ["VALIDATION_ERROR", 400],
    ["UNAUTHORIZED", 401],
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["CONFLICT", 409],
    ["PAYLOAD_TOO_LARGE", 413],
    ["RATE_LIMITED", 429],
  ] as const)("maps an AppError with code %s to status %i", async (code, status) => {
    const handler = withApiHandler(() => {
      throw new AppError(code, "Readable message");
    });
    const response = await handler(request("GET"), context);

    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({
      error: { code, message: "Readable message", details: {} },
    });
  });

  it("maps a Zod error to a validation error with field errors", async () => {
    const schema = z.object({ email: z.email(), age: z.number().min(18) });
    const handler = withApiHandler(() => {
      schema.parse({ email: "not-an-email", age: 3 });
      return ok(null);
    });
    const response = await handler(request("GET"), context);
    const body = (await response.json()) as {
      error: { code: string; details: { fieldErrors: Record<string, string[]> } };
    };

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(Object.keys(body.error.details.fieldErrors).sort()).toEqual(["age", "email"]);
  });

  it("hides the details of unexpected errors", async () => {
    const handler = withApiHandler(() => {
      throw new Error("connection string mongodb://secret@host failed");
    });
    const response = await handler(request("GET"), context);
    const text = await response.text();

    expect(response.status).toBe(500);
    expect(text).toContain("INTERNAL_ERROR");
    expect(text).not.toContain("secret");
  });

  describe("origin check", () => {
    const handler = withApiHandler(() => ok({ saved: true }));

    it.each(["POST", "PUT", "PATCH", "DELETE"])(
      "rejects %s from another origin",
      async (method) => {
        const response = await handler(request(method, "https://evil.example"), context);
        expect(response.status).toBe(403);
      },
    );

    it("rejects a state-changing request with no Origin header", async () => {
      const response = await handler(request("POST"), context);
      expect(response.status).toBe(403);
    });

    it("accepts a state-changing request from the site's own origin", async () => {
      const response = await handler(request("POST", SITE_ORIGIN), context);
      expect(response.status).toBe(200);
    });

    it("does not require an Origin header for reads", async () => {
      const response = await handler(request("GET"), context);
      expect(response.status).toBe(200);
    });
  });
});

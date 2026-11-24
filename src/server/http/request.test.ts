import { describe, expect, it } from "vitest";
import { z } from "zod";

import { withApiHandler } from "@/server/http/handler";
import { readJson } from "@/server/http/request";
import { ok } from "@/server/http/responses";

const schema = z.object({ name: z.string(), nested: z.object({ email: z.email() }) });
const post = (body: string) => new Request("http://localhost:3000/x", { method: "POST", body });

describe("readJson", () => {
  it("returns the validated body", async () => {
    const body = await readJson(post('{"name":"A","nested":{"email":"a@b.org"}}'), schema);
    expect(body.nested.email).toBe("a@b.org");
  });

  it("rejects invalid JSON and bodies over 100 KB", async () => {
    await expect(readJson(post("{nope"), schema)).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
    await expect(readJson(post("x".repeat(100_001)), schema)).rejects.toMatchObject({
      code: "PAYLOAD_TOO_LARGE",
    });
  });

  it("reports nested field errors by their dotted path", async () => {
    const handler = withApiHandler(async (request) => ok(await readJson(request, schema)));
    const response = await handler(
      new Request("http://localhost:3000/x", {
        method: "POST",
        headers: { origin: "http://localhost:3000" },
        body: '{"name":"A","nested":{"email":"bad"}}',
      }),
      undefined,
    );
    const body = (await response.json()) as {
      error: { details: { fieldErrors: Record<string, string[]> } };
    };
    expect(Object.keys(body.error.details.fieldErrors)).toEqual(["nested.email"]);
  });
});

describe("withApiHandler isServerToServer", () => {
  it("skips the same-origin check only when asked to", async () => {
    const noOrigin = new Request("http://localhost:3000/x", { method: "POST" });
    expect((await withApiHandler(() => ok(1))(noOrigin, undefined)).status).toBe(403);
    expect(
      (await withApiHandler(() => ok(1), { isServerToServer: true })(noOrigin, undefined)).status,
    ).toBe(200);
  });
});

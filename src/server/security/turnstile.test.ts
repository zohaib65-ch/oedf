import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function loadWithSecret(secret: string | undefined) {
  vi.resetModules();
  vi.stubEnv("TURNSTILE_SECRET_KEY", secret);
  return (await import("@/server/security/turnstile")).verifyTurnstile;
}

describe("verifyTurnstile", () => {
  it("is skipped when no secret key is set (local development)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect((await loadWithSecret(undefined))(undefined, "1.2.3.4")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("needs a token once a secret key is set", async () => {
    await expect((await loadWithSecret("secret"))(undefined, "1.2.3.4")).rejects.toMatchObject({
      details: { fieldErrors: { turnstileToken: expect.any(Array) } },
    });
  });

  it("accepts a token Cloudflare approves and sends the secret, token and IP", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ success: true }));
    vi.stubGlobal("fetch", fetchMock);

    await expect((await loadWithSecret("secret"))("token-1", "1.2.3.4")).resolves.toBeUndefined();

    const body = (fetchMock.mock.calls[0]?.[1] as { body: URLSearchParams }).body;
    expect(Object.fromEntries(body)).toEqual({
      secret: "secret",
      response: "token-1",
      remoteip: "1.2.3.4",
    });
  });

  it("rejects a token Cloudflare refuses, and fails closed when Cloudflare cannot be reached", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ success: false })));
    await expect((await loadWithSecret("secret"))("bad", "1.2.3.4")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    await expect((await loadWithSecret("secret"))("t", "1.2.3.4")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });
});

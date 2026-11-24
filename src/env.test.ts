import { afterEach, describe, expect, it, vi } from "vitest";

import { getServerEnv } from "@/env";

const REQUIRED_ENV = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  MONGODB_URI: "mongodb://localhost:27017/oedf?replicaSet=rs0",
  BETTER_AUTH_SECRET: "a-secret-with-at-least-thirty-two-characters",
};

const OPTIONAL_NAMES = [
  "CLOUDINARY_URL",
  "SMTP_URL",
  "EMAIL_FROM",
  "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "CRON_SECRET",
] as const;

function stubRequiredEnv(): void {
  for (const [key, value] of Object.entries(REQUIRED_ENV)) {
    vi.stubEnv(key, value);
  }
  for (const name of OPTIONAL_NAMES) {
    vi.stubEnv(name, undefined);
  }
}

// The server env is cached after the first read, so each case loads a fresh copy of the module.
async function loadFreshEnvModule() {
  vi.resetModules();
  return import("@/env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getServerEnv", () => {
  it("needs only the three required variables and leaves the rest unset or on a local default", async () => {
    stubRequiredEnv();

    const env = (await loadFreshEnvModule()).getServerEnv();
    expect(env).toMatchObject(REQUIRED_ENV);
    expect(env.SMTP_URL).toBe("smtp://localhost:1025");
    expect(env.EMAIL_FROM).toBe("OEDF <no-reply@localhost>");
    expect(env.TURNSTILE_SECRET_KEY).toBeUndefined();
    expect(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY).toBeUndefined();
    expect(env.CRON_SECRET).toBeUndefined();
    expect(env.CLOUDINARY_URL).toBeUndefined();
  });

  it("treats a variable left empty as not set", async () => {
    stubRequiredEnv();
    vi.stubEnv("SMTP_URL", "");

    expect((await loadFreshEnvModule()).getServerEnv().SMTP_URL).toBe("smtp://localhost:1025");
  });

  it("names the invalid variables without printing their values", async () => {
    stubRequiredEnv();
    vi.stubEnv("MONGODB_URI", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short-secret-value");
    vi.stubEnv("CLOUDINARY_URL", "https://not-cloudinary.example");

    const fresh = await loadFreshEnvModule();
    expect(() => fresh.getServerEnv()).toThrow(/MONGODB_URI/);
    expect(() => fresh.getServerEnv()).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => fresh.getServerEnv()).toThrow(/CLOUDINARY_URL/);
    expect(() => fresh.getServerEnv()).not.toThrow(/too-short-secret-value/);
    expect(() => fresh.getServerEnv()).not.toThrow(/not-cloudinary/);
  });

  it("requires Cloudinary, mail, spam-check and cleanup settings once the site is not on localhost", async () => {
    stubRequiredEnv();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.example.org");

    const fresh = await loadFreshEnvModule();
    for (const name of OPTIONAL_NAMES) {
      expect(() => fresh.getServerEnv()).toThrow(new RegExp(name));
    }
  });

  it("accepts a real deployment that sets them all", async () => {
    stubRequiredEnv();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://www.example.org");
    vi.stubEnv("CLOUDINARY_URL", "cloudinary://123456789012345:test-secret@test-cloud");
    vi.stubEnv("SMTP_URL", "smtps://user:pass@mail.example.org:465");
    vi.stubEnv("EMAIL_FROM", "OEDF <no-reply@example.org>");
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    vi.stubEnv("CRON_SECRET", "a-cron-secret-with-at-least-32-characters");

    const env = (await loadFreshEnvModule()).getServerEnv();
    expect(env.SMTP_URL).toBe("smtps://user:pass@mail.example.org:465");
    expect(env.TURNSTILE_SECRET_KEY).toBe("secret-key");
  });

  it("is available in the test environment", () => {
    expect(getServerEnv().NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
});

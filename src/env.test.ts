import { afterEach, describe, expect, it, vi } from "vitest";

import { getSeedEnv, getServerEnv } from "@/env";

const VALID_ENV = {
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  MONGODB_URI: "mongodb://localhost:27017/oedf?replicaSet=rs0",
  BETTER_AUTH_SECRET: "a-secret-with-at-least-thirty-two-characters",
  BETTER_AUTH_URL: "http://localhost:3000",
};

function stubValidEnv(): void {
  for (const [key, value] of Object.entries(VALID_ENV)) {
    vi.stubEnv(key, value);
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
  it("returns the validated variables and applies the log level default", async () => {
    stubValidEnv();
    vi.stubEnv("LOG_LEVEL", undefined);

    const fresh = await loadFreshEnvModule();
    expect(fresh.getServerEnv()).toMatchObject({ ...VALID_ENV, LOG_LEVEL: "info" });
  });

  it("names the invalid variables without printing their values", async () => {
    stubValidEnv();
    vi.stubEnv("MONGODB_URI", "");
    vi.stubEnv("BETTER_AUTH_SECRET", "too-short-secret-value");

    const fresh = await loadFreshEnvModule();
    expect(() => fresh.getServerEnv()).toThrow(/MONGODB_URI/);
    expect(() => fresh.getServerEnv()).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => fresh.getServerEnv()).not.toThrow(/too-short-secret-value/);
  });

  it("is available in the test environment", () => {
    expect(getServerEnv().NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });
});

describe("getSeedEnv", () => {
  it("rejects a password shorter than 12 characters", () => {
    vi.stubEnv("SEED_ADMIN_EMAIL", "admin@example.org");
    vi.stubEnv("SEED_ADMIN_PASSWORD", "short");
    expect(() => getSeedEnv()).toThrow(/SEED_ADMIN_PASSWORD/);
  });

  it("accepts a valid email and password", () => {
    vi.stubEnv("SEED_ADMIN_EMAIL", "admin@example.org");
    vi.stubEnv("SEED_ADMIN_PASSWORD", "a-long-enough-password");
    expect(getSeedEnv()).toEqual({
      SEED_ADMIN_EMAIL: "admin@example.org",
      SEED_ADMIN_PASSWORD: "a-long-enough-password",
    });
  });
});

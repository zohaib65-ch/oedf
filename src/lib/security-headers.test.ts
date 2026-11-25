import { describe, expect, it } from "vitest";

import { buildContentSecurityPolicy, buildSecurityHeaders } from "@/lib/security-headers";

describe("security headers", () => {
  it("allows only Turnstile and Cloudinary besides the site itself, and no framing", () => {
    const csp = buildContentSecurityPolicy({ isDev: false, isHttps: true });
    const origins = new Set(csp.match(/https:\/\/[^\s;]+/g));
    expect([...origins].sort()).toEqual([
      "https://api.cloudinary.com",
      "https://challenges.cloudflare.com",
      "https://res.cloudinary.com",
    ]);
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
    expect(csp).toContain("upgrade-insecure-requests");
    const local = buildContentSecurityPolicy({ isDev: true, isHttps: false });
    expect(local).toContain("'unsafe-eval'");
    expect(local).not.toContain("upgrade-insecure-requests");
  });

  it("sends HSTS, nosniff, the referrer policy and a permissions policy", () => {
    const headers = Object.fromEntries(
      buildSecurityHeaders({ isDev: false, isHttps: true }).map(({ key, value }) => [key, value]),
    );
    expect(headers["Strict-Transport-Security"]).toMatch(/^max-age=63072000; includeSubDomains/);
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });
});

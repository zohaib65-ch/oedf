import { expect, test } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";

const PUBLIC_PAGES = ["/", "/programs", "/research", "/news", "/contact", "/admissions/apply"];

test("every response carries the security headers", async ({ request }) => {
  for (const path of ["/", "/api/v1/health", "/portal/sign-in"]) {
    const headers = (await request.get(path)).headers();
    expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(headers["strict-transport-security"], path).toContain("max-age=");
    expect(headers["x-content-type-options"], path).toBe("nosniff");
    expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"], path).toContain("camera=()");
    expect(headers["x-powered-by"], path).toBeUndefined();
  }
});

test("the public pages run without a Content-Security-Policy violation", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /Content.Security.Policy/i.test(message.text())) {
      violations.push(message.text());
    }
  });
  for (const path of PUBLIC_PAGES) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(violations).toEqual([]);
});

test.describe("portal", () => {
  test.use({ storageState: ADMIN_STATE_FILE });

  test("the portal runs without a Content-Security-Policy violation", async ({ page }) => {
    const violations: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && /Content.Security.Policy/i.test(message.text())) {
        violations.push(message.text());
      }
    });
    for (const path of ["/portal", "/portal/applications", "/portal/faqs", "/portal/news/new"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    }
    expect(violations).toEqual([]);
  });
});

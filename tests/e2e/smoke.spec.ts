import { expect, test } from "@playwright/test";

import { expectNoSeriousAccessibilityIssues } from "./axe";

test.describe("foundation smoke test", () => {
  test("home page shows the mission and has no serious accessibility issues", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Education that opens doors/ }),
    ).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("health endpoint reports the database is reachable", async ({ request }) => {
    const response = await request.get("/api/v1/health");
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ data: { status: "ok" } });
  });

  test("authentication handler answers under /api/auth", async ({ request }) => {
    const response = await request.get("/api/auth/ok");
    expect(response.status()).toBe(200);
  });
});

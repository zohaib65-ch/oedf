import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SERIOUS_IMPACTS = ["serious", "critical"];

test.describe("foundation smoke test", () => {
  test("home page shows the foundation name and has no serious accessibility issues", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "Omar Education Development Foundation" }),
    ).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact && SERIOUS_IMPACTS.includes(violation.impact),
    );
    expect(serious).toEqual([]);
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

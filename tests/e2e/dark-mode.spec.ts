import { expect, test } from "@playwright/test";

import { expectNoSeriousAccessibilityIssues } from "./axe";

// The site has one light theme. A device in dark mode must still get readable light forms.
test.use({ colorScheme: "dark" });

test("forms stay light and readable on a device in dark mode", async ({ page }) => {
  await page.goto("/admissions/apply");
  const fullName = page.getByLabel("Full name");
  await expect(fullName).toBeVisible();
  const background = await fullName.evaluate((input) => getComputedStyle(input).backgroundColor);
  expect(["rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"]).toContain(background);
  await expectNoSeriousAccessibilityIssues(page);
});

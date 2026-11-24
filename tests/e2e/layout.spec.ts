import { expect, test } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";

test.describe("public layout", () => {
  test("home page has the header, footer and no serious accessibility issues", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toContainText("SECP Registration No. 0361535");
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("the skip link is the first thing a keyboard user reaches", async ({ page, isMobile }) => {
    test.skip(isMobile, "Keyboard navigation is checked on desktop.");
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  });

  test("desktop navigation opens the departments dropdown", async ({ page, isMobile }) => {
    test.skip(isMobile, "The desktop navigation is shown from 1280 px up.");
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
    await nav.getByRole("button", { name: "Departments" }).click();
    await expect(
      page.getByRole("link", { name: /Admissions & Scholarships/ }).first(),
    ).toBeVisible();
  });

  test("mobile menu opens a sheet with the navigation", async ({ page, isMobile }) => {
    test.skip(!isMobile, "The mobile menu is shown below 1280 px.");
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    const menu = page.getByRole("dialog");
    await expect(menu.getByRole("link", { name: "Careers" })).toBeVisible();
    await menu.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);
  });

  test("an unknown address shows the branded 404 page", async ({ page }) => {
    const response = await page.goto("/no-such-page");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This page could not be found",
    );
    await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });
});

test.describe("portal", () => {
  test.describe("signed in", () => {
    test.use({ storageState: ADMIN_STATE_FILE });

    test("staff see the portal shell and can open the user menu", async ({ page }) => {
      test.skip(
        !process.env.E2E_ADMIN_EMAIL,
        "Needs the Super Admin (E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD).",
      );

      await page.goto("/portal");
      await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
      // Scan before opening the menu: while it is open, Radix hides the rest of the page from assistive technology on purpose.
      await expectNoSeriousAccessibilityIssues(page);
      await page.getByRole("button", { name: "Open user menu" }).click();
      await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
    });
  });

  test("signed-out visitors are sent to the sign-in address", async ({ page }) => {
    await page.goto("/portal");
    await expect(page).toHaveURL(/\/portal\/sign-in$/);
  });
});

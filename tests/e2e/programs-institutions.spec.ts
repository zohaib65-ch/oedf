import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";
import { capture } from "./screenshots";

// Records made here start with "E2E "; the global teardown removes them.
test.use({ storageState: ADMIN_STATE_FILE });

const uniqueName = (kind: string) => `E2E ${kind} ${String(randomInt(100_000, 999_999))}`;

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("a program is drafted, published to the public site and deleted", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the list is checked on a phone below.");
  const title = uniqueName("Program");

  await page.goto("/portal/programs/new");
  await expectNoSeriousAccessibilityIssues(page);
  await page.getByLabel("Title").fill(title);
  await choose(page, "Category", "Vocational");
  await page.getByLabel("Summary").fill("Learn to build websites.");
  await page.getByLabel("Description", { exact: true }).fill("You will learn:\n- HTML\n- CSS");
  await page.getByRole("button", { name: "Save program" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();

  await choose(page, "Status", "Published");
  await page.getByRole("button", { name: "Save program" }).click();
  await expect(page.getByText("Program saved.")).toBeVisible();
  const href = await page
    .getByRole("link", { name: /View on the public site/ })
    .getAttribute("href");
  await page.goto(href ?? "/programs");
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "CSS" })).toBeVisible();
  await capture(page, "program-public-page");

  await page.goBack();
  await page.getByRole("button", { name: "Delete program" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/portal\/programs$/);
});

test("an institution is made public, and gets an agreement and a review", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the list is checked on a phone below.");
  const name = uniqueName("Institution");

  await page.goto("/portal/institutions/new");
  await page.getByLabel("Name").fill(name);
  await choose(page, "Type", "School");
  await page.getByLabel("City").fill("Vehari");
  await choose(page, "Status", "Active");
  await page.getByLabel(/Show on the public site/).check();
  await page.getByRole("button", { name: "Save institution" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await expect(page.getByText("On public site")).toBeVisible();

  await page.getByRole("button", { name: "Add agreement" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Partnership agreement");
  await dialog.getByLabel("Partner").fill("District Education Authority");
  await dialog.getByLabel("Start date").fill("2026-01-01");
  await dialog.getByLabel("Renewal date").fill("2099-01-01");
  await dialog.getByRole("button", { name: "Save agreement" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "Edit Partnership agreement" })).toBeVisible();

  await page.getByRole("button", { name: "Add review" }).click();
  const review = page.getByRole("dialog");
  await review.getByLabel("Review date").fill("2026-11-01");
  await review.getByRole("combobox", { name: "Rating" }).click();
  await page.getByRole("option", { name: "4, good" }).click();
  await review.getByLabel("Summary").fill("Good attendance and results.");
  await review.getByRole("button", { name: "Add review" }).click();
  await expect(review).toBeHidden();
  await expect(page.getByText("4.0 of 5 (1 review)")).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);

  const href = await page
    .getByRole("link", { name: /View on the public site/ })
    .getAttribute("href");
  await page.goto(href ?? "/institutions");
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
  await capture(page, "institution-public-page");
  await expect(page.getByText("Partnership agreement")).toHaveCount(0);
});

test("the program and institution lists are accessible and sort by a column header", async ({
  page,
}) => {
  await page.goto("/portal/programs");
  await expect(page.getByRole("heading", { level: 1, name: "Programs" })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
  await page.getByRole("link", { name: /^Last changed.*sort/ }).click();
  await expect(page).toHaveURL(/sort=/);

  await page.goto("/portal/institutions");
  await expect(page.getByRole("heading", { level: 1, name: "Institutions" })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
});

test("the program form says what is missing", async ({ page }) => {
  await page.goto("/portal/programs/new");
  await page.getByRole("button", { name: "Save program" }).click();
  await expect(page.getByText("Title is required")).toBeVisible();
  await expect(page.getByText("Choose a category")).toBeVisible();
  await expect(page.getByText("Summary is required")).toBeVisible();
});

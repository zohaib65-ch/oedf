import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";
import {
  deleteTestJobApplication,
  deleteVacanciesByTitle,
  insertTestJobApplication,
  type TestJobApplication,
} from "./db";

test.use({ storageState: ADMIN_STATE_FILE });

const createdApplications: TestJobApplication[] = [];
const createdTitles: string[] = [];

test.afterAll(async () => {
  await Promise.all([
    ...createdApplications.map((application) => deleteTestJobApplication(application)),
    ...createdTitles.map((title) => deleteVacanciesByTitle(title)),
  ]);
});

/** A day (YYYY-MM-DD) two weeks from now. */
const inTwoWeeks = () => new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

/** Opens a confirm button's dialog and confirms it. */
async function confirm(page: Page, action: string, confirmLabel = action) {
  await page.getByRole("button", { name: action, exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: confirmLabel, exact: true }).click();
  await expect(dialog).toBeHidden();
}

test.describe("vacancies", () => {
  test("a vacancy is drafted, published to the careers page and closed", async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, "The full flow runs once; the screens are checked on a phone below.");
    const title = `E2E Vacancy ${String(randomInt(100_000, 999_999))}`;
    createdTitles.push(title);

    await page.goto("/portal/vacancies/new");
    await expectNoSeriousAccessibilityIssues(page);
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("City").fill("Vehari");
    await page.getByRole("combobox", { name: "Type of post" }).click();
    await page.getByRole("option", { name: "Full time" }).click();
    await page.getByLabel("Last day to apply").fill(inTwoWeeks());
    await page.getByLabel("Description").fill("Teach mathematics to classes 9 and 10.");
    await page.getByRole("button", { name: "Save draft" }).click();

    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await confirm(page, "Publish");
    await expect(page.getByText("Vacancy published.")).toBeVisible();
    await expect(page.getByText("Published", { exact: true })).toBeVisible();

    const careersLink = page.getByRole("link", { name: /View on the careers page/ });
    const href = await careersLink.getAttribute("href");
    await page.goto(href ?? "/careers");
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await page.goBack();
    await confirm(page, "Close");
    await expect(page.getByText("Closed", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reopen" })).toBeVisible();
    await page.goto(href ?? "/careers");
    await expect(page.getByRole("heading", { level: 1, name: title })).toHaveCount(0);
  });

  test("a draft can be deleted, after confirming", async ({ page, isMobile }) => {
    test.skip(isMobile, "The flow runs once; the screens are checked on a phone below.");
    const title = `E2E Draft ${String(randomInt(100_000, 999_999))}`;
    createdTitles.push(title);

    await page.goto("/portal/vacancies/new");
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("City").fill("Multan");
    await page.getByRole("combobox", { name: "Type of post" }).click();
    await page.getByRole("option", { name: "Internship" }).click();
    await page.getByLabel("Last day to apply").fill(inTwoWeeks());
    await page.getByLabel("Description").fill("A short internship.");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

    await confirm(page, "Delete draft", "Delete");
    await expect(page).toHaveURL(/\/portal\/vacancies$/);
    await expect(page.getByText("Draft deleted.")).toBeVisible();
  });

  test("the form says what is missing", async ({ page }) => {
    await page.goto("/portal/vacancies/new");
    await page.getByRole("button", { name: "Save draft" }).click();
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("Choose the type of post")).toBeVisible();
    await expect(page.getByText("Description is required")).toBeVisible();
  });

  test("the list filters, sorts by a column header and is accessible", async ({ page }) => {
    const application = await insertTestJobApplication("E2E Candidate");
    createdApplications.push(application);
    await page.goto(`/portal/vacancies?q=${encodeURIComponent(application.vacancyTitle)}`);

    await expect(
      page.getByRole("link", { name: application.vacancyTitle, exact: true }),
    ).toBeVisible();
    await expect(page.getByText("1 vacancy")).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);

    await page.getByRole("link", { name: /^Deadline.*sort ascending$/ }).click();
    await expect(page).toHaveURL(/sort=deadline/);
    await page.getByRole("link", { name: `1 application for ${application.vacancyTitle}` }).click();
    await expect(page.getByRole("link", { name: application.referenceNumber })).toBeVisible();
  });
});

test.describe("job applications", () => {
  test("a candidate is shortlisted, given an interview time, noted and archived", async ({
    page,
    isMobile,
  }) => {
    const application = await insertTestJobApplication("E2E Candidate");
    createdApplications.push(application);
    await page.goto(`/portal/job-applications/${application.id}`);

    await expect(
      page.getByRole("heading", { level: 1, name: application.referenceNumber }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Open.*CV/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Select", exact: true })).toHaveCount(0);
    await expectNoSeriousAccessibilityIssues(page);
    test.skip(isMobile, "The flow runs once; the screen is checked on a phone above.");

    await page.getByRole("button", { name: "Shortlist", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Reason").fill("E2E: meets the requirements");
    await dialog.getByRole("button", { name: "Shortlist", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("Received → Shortlisted")).toBeVisible();

    await page.getByLabel("Interview date and time").fill("2099-12-10T10:30");
    await page.getByRole("button", { name: "Save time" }).click();
    await expect(page.getByText("Interview time saved.")).toBeVisible();

    await page.getByLabel("Internal note").fill("E2E: strong teaching demo.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(page.getByText("E2E: strong teaching demo.")).toBeVisible();

    await confirm(page, "Archive");
    await expect(page.getByText(/^Archived on/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Move to interview" })).toHaveCount(0);
    await confirm(page, "Restore");
    await expect(page.getByRole("button", { name: "Move to interview" })).toBeVisible();
  });

  test("the list finds an application by reference and filters by vacancy", async ({ page }) => {
    const application = await insertTestJobApplication("E2E Candidate");
    createdApplications.push(application);

    await page.goto(`/portal/job-applications?q=${application.referenceNumber}`);
    await expect(page.getByRole("link", { name: application.referenceNumber })).toBeVisible();
    await expect(page.getByText("1 application")).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);

    await page.goto(`/portal/job-applications?vacancyId=${application.vacancyId}`);
    await expect(page.getByRole("link", { name: application.referenceNumber })).toBeVisible();
    await page.goto(`/portal/job-applications?vacancyId=${application.vacancyId}&view=ARCHIVED`);
    await expect(page.getByText("No job applications found")).toBeVisible();
  });
});

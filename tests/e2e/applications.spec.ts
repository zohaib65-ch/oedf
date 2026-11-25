import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";
import { deleteTestApplication, insertTestApplication, type TestApplication } from "./db";
import { capture } from "./screenshots";

test.use({ storageState: ADMIN_STATE_FILE });

const created: TestApplication[] = [];

async function newApplication(type: "ADMISSION" | "SCHOLARSHIP"): Promise<TestApplication> {
  const application = await insertTestApplication(
    type,
    `E2E Applicant ${String(randomInt(1000, 9999))}`,
  );
  created.push(application);
  return application;
}

test.afterAll(async () => {
  await Promise.all(created.map((application) => deleteTestApplication(application.id)));
});

/** Opens a status action, gives the reason, confirms, and waits for the page to show the result. */
async function moveTo(
  page: Page,
  action: string,
  fill?: (dialog: ReturnType<Page["getByRole"]>) => Promise<void>,
) {
  await page.getByRole("button", { name: action, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await fill?.(dialog);
  await dialog.getByLabel("Reason").fill(`E2E: ${action}`);
  await dialog.getByRole("button", { name: action, exact: true }).click();
  await expect(dialog).toBeHidden();
}

test("the list finds an application by reference, sorts by a column header, and is accessible", async ({
  page,
}) => {
  const application = await newApplication("ADMISSION");
  await page.goto(`/portal/applications?q=${application.referenceNumber}`);

  await expect(page.getByRole("link", { name: application.referenceNumber })).toBeVisible();
  await expect(page.getByText("1 application")).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);

  const today = new Date(Date.now() + 5 * 3_600_000).toISOString().slice(0, 10);
  await page.goto(
    `/portal/applications?q=${application.referenceNumber}&from=${today}&to=${today}`,
  );
  await expect(page.getByText("1 application")).toBeVisible();

  await page.getByRole("link", { name: /^Applicant.*sort ascending$/ }).click();
  await expect(page).toHaveURL(/sort=name/);
  await expect(page.getByRole("columnheader", { name: /Applicant/ })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
});

test("the detail page is accessible and shows only what the role may do", async ({ page }) => {
  const application = await newApplication("ADMISSION");
  await page.goto(`/portal/applications/${application.id}`);

  await expect(
    page.getByRole("heading", { level: 1, name: application.referenceNumber }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Start review" })).toBeVisible();
  // Approving is possible only after a recommendation.
  await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
  await expectNoSeriousAccessibilityIssues(page);
});

test("a scholarship goes from submitted to approved, and its award is recorded", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the screens are checked on a phone above.");
  const application = await newApplication("SCHOLARSHIP");
  await page.goto(`/portal/applications/${application.id}`);

  await moveTo(page, "Start review");
  await expect(page.getByRole("button", { name: "Mark verified" })).toBeVisible();

  for (const item of ["Identity checked", "Education history", "Eligibility", "All documents"]) {
    await page.getByRole("checkbox", { name: new RegExp(item) }).check();
  }
  await page.getByRole("button", { name: "Save checklist" }).click();
  await expect(page.getByText("Checklist saved.")).toBeVisible();

  await moveTo(page, "Mark verified");
  await moveTo(page, "Recommend");
  await moveTo(page, "Approve", async (dialog) => {
    await dialog.getByLabel("Amount (whole rupees)").fill("5000");
    await dialog.getByRole("combobox", { name: "Paid" }).click();
    await page.getByRole("option", { name: "Monthly" }).click();
    await dialog.getByLabel("Start date").fill("2027-01-01");
  });

  await expect(page.getByText(/^Approved by/)).toBeVisible();
  await capture(page, "application-approved");
  await page.getByRole("link", { name: "View the scholarship award" }).click();
  await expect(page.getByLabel("Amount (whole rupees)")).toHaveValue("5000");

  await page.getByLabel("Amount (whole rupees)").fill("6000");
  await page.getByRole("button", { name: "Save award" }).click();
  await expect(page.getByText("Award saved.")).toBeVisible();

  await page.getByLabel("Progress note").fill("Term 1 result: 82%.");
  await page.getByRole("button", { name: "Add note" }).click();
  await expect(page.getByText("Term 1 result: 82%.")).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
});

test("asking for documents lists them on the application", async ({ page, isMobile }) => {
  test.skip(isMobile, "The flow runs once; the screens are checked on a phone above.");
  const application = await newApplication("ADMISSION");
  await page.goto(`/portal/applications/${application.id}`);

  await moveTo(page, "Start review");
  await moveTo(page, "Ask for documents", async (dialog) => {
    await dialog.getByLabel("What the applicant must send").fill("Clearer CNIC copy\nSigned form");
  });

  const waiting = page.getByRole("alert").filter({ hasText: "Waiting for the applicant" });
  await expect(waiting).toContainText("Clearer CNIC copy");
  await expect(waiting).toContainText("Signed form");
  await expect(page.getByText("Under review → Incomplete")).toBeVisible();
});

test("marking verified is refused until the checklist is complete", async ({ page, isMobile }) => {
  test.skip(isMobile, "The flow runs once; the screens are checked on a phone above.");
  const application = await newApplication("ADMISSION");
  await page.goto(`/portal/applications/${application.id}`);

  await moveTo(page, "Start review");
  await page.getByRole("button", { name: "Mark verified", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason").fill("Trying too early");
  await dialog.getByRole("button", { name: "Mark verified", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("Complete the verification checklist");
});

test("an archived application is read-only until it is restored", async ({ page, isMobile }) => {
  test.skip(isMobile, "The flow runs once; the screens are checked on a phone above.");
  const application = await newApplication("ADMISSION");
  await page.goto(`/portal/applications/${application.id}`);

  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Archive" }).click();
  await expect(page.getByText(/^Archived on/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start review" })).toHaveCount(0);
  await expect(page.getByLabel("Internal note")).toHaveCount(0);

  await page.goto(`/portal/applications?q=${application.referenceNumber}`);
  await expect(page.getByText("No applications found")).toBeVisible();
  await page.goto(`/portal/applications?q=${application.referenceNumber}&view=ARCHIVED`);
  await expect(page.getByText("1 archived application")).toBeVisible();

  await page.goto(`/portal/applications/${application.id}`);
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Restore" }).click();
  await expect(page.getByRole("button", { name: "Start review" })).toBeVisible();
});

import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { expectNoSeriousAccessibilityIssues } from "./axe";
import { actAsNewVisitor } from "./visitor";

test.beforeEach(({ context }) => actAsNewVisitor(context));

async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function fillApplicantStep(page: Page) {
  await page.getByLabel("Full name").fill("Test Applicant");
  await page.getByLabel("Father or guardian name").fill("Test Guardian");
  await page.getByLabel("Date of birth").fill("2008-04-12");
  await chooseOption(page, "Gender", "Female");
  await page.getByLabel("CNIC or B-Form number").fill("35202-1234567-1");
  await page.getByLabel("Email").fill("test.applicant@example.org");
  await page.getByLabel("Phone").fill("0300 1234567");
  await page.getByLabel("Address").fill("House 1, Street 2");
  await page.getByLabel("City").fill("Vehari");
}

test.describe("contact form", () => {
  test("shows the problems in a summary that links to each field", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();

    const summary = page.getByRole("alert").filter({ hasText: "Please fix" });
    await expect(summary).toBeVisible();
    await expect(summary).toBeFocused();
    await summary.getByRole("link", { name: /Email:/ }).click();
    await expect(page.getByLabel("Email")).toBeFocused();
    await expect(page.getByLabel("Email")).toHaveAttribute("aria-invalid", "true");
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("sends a message and replaces the form with a confirmation", async ({ page }) => {
    await page.goto("/contact");
    await page.getByLabel("Name").fill("Test Visitor");
    await page.getByLabel("Email").fill("visitor@example.org");
    await chooseOption(page, "Subject", "Admissions");
    await page.getByLabel("Message").fill("I would like to know the admission dates.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByRole("status")).toContainText("Message sent");
    await expect(page.getByLabel("Message")).toHaveCount(0);
  });

  test("the hidden honeypot field cannot be reached by keyboard or screen reader", async ({
    page,
  }) => {
    await page.goto("/contact");
    const honeypot = page.locator('input[name="faxNumber"]');
    await expect(honeypot).toHaveAttribute("tabindex", "-1");
    await expect(honeypot.locator("xpath=ancestor::div[@aria-hidden='true']")).toHaveCount(1);
  });
});

test.describe("application form", () => {
  test("opens at the first step and blocks Next until the step is valid", async ({ page }) => {
    await page.goto("/admissions/apply");
    await expect(
      page.getByRole("heading", { level: 2, name: /Step 1 of 5: Applicant/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: /Step 1 of 5/ })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("moves through the steps and keeps the answers when going back", async ({ page }) => {
    await page.goto("/admissions/apply");
    await fillApplicantStep(page);
    await page.getByRole("button", { name: "Next" }).click();
    await expect(
      page.getByRole("heading", { level: 2, name: /Step 2 of 5: Education/ }),
    ).toBeFocused();

    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByLabel("Full name")).toHaveValue("Test Applicant");
    await expect(page.getByLabel("CNIC or B-Form number")).toHaveValue("35202-1234567-1");
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("a scholarship has a sixth step for financial information", async ({ page }) => {
    await page.goto("/scholarships/apply");
    await expect(page.getByRole("heading", { level: 2, name: /Step 1 of 6/ })).toBeVisible();
    await expect(page.getByRole("list", { name: "Progress" })).toContainText(
      "5. Financial information",
    );
  });

  test("refuses a file that is too large or the wrong type before sending anything", async ({
    page,
  }) => {
    await page.goto("/admissions/apply");
    await fillApplicantStep(page);
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Last institution attended").fill("Govt High School");
    await page.getByLabel("Class or degree").fill("Matric");
    await page.getByLabel("Board or university").fill("BISE");
    await page.getByLabel("Marks or percentage").fill("85%");
    await page.getByLabel("Passing year").fill("2024");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByLabel("Intake session").fill("Fall 2026");
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { level: 2, name: /Documents/ })).toBeVisible();

    await page.getByLabel("Photograph").setInputFiles({
      name: "big.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(6 * 1024 * 1024),
    });
    await expect(page.getByText("The file is larger than 5 MB.")).toBeVisible();
    await page.getByLabel("CNIC or B-Form copy").setInputFiles({
      name: "notes.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("x"),
    });
    await expect(page.getByText("Choose a PDF, JPG or PNG file.")).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });
});

test.describe("application status", () => {
  test("rejects a badly formed reference number", async ({ page }) => {
    await page.goto("/application-status");
    await page.getByLabel("Reference number").fill("12345");
    await page.getByLabel("Email").fill("a@example.org");
    await page.getByRole("button", { name: "Check status" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Reference number:" })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("says the same thing for an unknown reference and a wrong email", async ({ page }) => {
    await page.goto("/application-status");
    await page.getByLabel("Reference number").fill("OEDF-ADM-2026-999999");
    await page.getByLabel("Email").fill("nobody@example.org");
    await page.getByRole("button", { name: "Check status" }).click();
    await expect(
      page.getByText("We could not find an application with that reference number and email."),
    ).toBeVisible();
  });
});

test.describe("job application", () => {
  test("is on the vacancy page, and asks for the CV", async ({ page }) => {
    await page.goto("/careers/sample-teacher");
    await expect(page.getByRole("heading", { name: "Apply for this vacancy" })).toBeVisible();
    await page.getByRole("button", { name: "Submit application" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "CV:" })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });
});

test.describe("public API", () => {
  test("answers 429 after 5 contact messages from one address", async ({ request, baseURL }) => {
    const headers = {
      origin: baseURL ?? "",
      "x-forwarded-for": `198.51.100.${randomInt(1, 255)}`,
    };
    const body = {
      name: "Rate Test",
      email: "rate@example.org",
      subject: "GENERAL",
      message: "Testing the limit.",
    };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push(
        (await request.post("/api/v1/contact-messages", { headers, data: body })).status(),
      );
    }
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429]);
  });

  test("refuses a request from another origin", async ({ request }) => {
    const response = await request.post("/api/v1/contact-messages", {
      headers: { origin: "https://evil.example" },
      data: { name: "x", email: "x@example.org", subject: "GENERAL", message: "x" },
    });
    expect(response.status()).toBe(403);
  });
});

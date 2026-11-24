import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { actAsNewVisitor } from "./visitor";

// These tests upload real files to the Cloudinary account in `.env` (into the `oedf-dev`
// folder) and read the confirmation emails from Mailpit, so they only run when asked:
//   E2E_REAL_UPLOADS=1 npm run test:e2e
// The uploaded files stay in Cloudinary: delete the `oedf-dev` folder when you want them gone.
test.skip(!process.env.E2E_REAL_UPLOADS, "Set E2E_REAL_UPLOADS=1 to upload real files.");

const MAILPIT = "http://localhost:8025";
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==",
  "base64",
);
const PDF = Buffer.from(
  "%PDF-1.1\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF",
);
const DOCX = Buffer.from("PK\u0003\u0004 test docx bytes");

test.beforeEach(({ context }) => actAsNewVisitor(context));

async function chooseOption(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function upload(page: Page, label: string, name: string, mimeType: string, buffer: Buffer) {
  await page.getByLabel(label, { exact: true }).setInputFiles({ name, mimeType, buffer });
  await expect(page.getByText(name)).toBeVisible({ timeout: 30_000 });
}

async function findEmail(
  request: Parameters<Parameters<typeof test>[2]>[0]["request"],
  reference: string,
) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const search = await request.get(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(reference)}`,
    );
    const body = (await search.json()) as {
      messages: { Subject: string; To: { Address: string }[] }[];
    };
    if (body.messages.length > 0) {
      return body.messages[0];
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return undefined;
}

test("an applicant submits an admission, gets a reference number and email, and sees the status", async ({
  page,
  request,
}) => {
  const email = `applicant.${randomInt(100000, 999999)}@example.org`;
  await page.goto("/admissions/apply");

  await page.getByLabel("Full name").fill("Flow Tester");
  await page.getByLabel("Father or guardian name").fill("Flow Guardian");
  await page.getByLabel("Date of birth").fill("2008-04-12");
  await chooseOption(page, "Gender", "Male");
  await page.getByLabel("CNIC or B-Form number").fill("35202-1234567-1");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("0300 1234567");
  await page.getByLabel("Address").fill("House 1, Street 2");
  await page.getByLabel("City").fill("Vehari");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByLabel("Last institution attended").fill("Govt High School");
  await page.getByLabel("Class or degree").fill("Matric");
  await page.getByLabel("Board or university").fill("BISE Multan");
  await page.getByLabel("Marks or percentage").fill("85%");
  await page.getByLabel("Passing year").fill("2024");
  await page.getByRole("button", { name: "Next" }).click();

  await chooseOption(page, "Program", "Sample: Web development");
  await page.getByLabel("Intake session").fill("Fall 2026");
  await page.getByRole("button", { name: "Next" }).click();

  await upload(page, "Photograph", "photo.png", "image/png", PNG);
  await upload(page, "CNIC or B-Form copy", "cnic.pdf", "application/pdf", PDF);
  await upload(page, "Latest result card", "result.png", "image/png", PNG);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { level: 2, name: /Review and submit/ })).toBeVisible();
  await expect(page.getByText("Flow Tester")).toBeVisible();
  await expect(page.getByText("Sample: Web development")).toBeVisible();
  await page.getByRole("button", { name: "Submit application" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText(
    "Declaration",
  );
  await page.getByLabel(/I declare that/).check();
  await page.getByRole("button", { name: "Submit application" }).click();

  const success = page.getByRole("status");
  await expect(success).toContainText("Application submitted", { timeout: 30_000 });
  const reference = (await success.textContent())?.match(/OEDF-ADM-\d{4}-\d{6}/)?.[0];
  expect(reference).toBeTruthy();

  const message = await findEmail(request, reference ?? "");
  expect(message?.To[0]?.Address).toBe(email);

  await page.goto("/application-status");
  await page.getByLabel("Reference number").fill(reference ?? "");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Check status" }).click();
  await expect(page.getByRole("heading", { name: "Submitted" })).toBeVisible();
});

test("a candidate applies for a vacancy with a Word CV", async ({ page, request }) => {
  const email = `candidate.${randomInt(100000, 999999)}@example.org`;
  await page.goto("/careers/sample-teacher");

  await page.getByLabel("Full name").fill("Job Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Phone").fill("0300 7654321");
  await page.getByLabel("CNIC number").fill("35202-7654321-3");
  await page.getByLabel("City").fill("Vehari");
  await page.getByLabel("Highest qualification").fill("MA Education");
  await page.getByLabel("Years of experience").fill("4");
  await upload(
    page,
    "CV",
    "cv.docx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    DOCX,
  );
  await page.getByRole("button", { name: "Submit application" }).click();

  const success = page.getByRole("status");
  await expect(success).toContainText("Application received", { timeout: 30_000 });
  const reference = (await success.textContent())?.match(/OEDF-JOB-\d{4}-\d{6}/)?.[0];
  expect(reference).toBeTruthy();
  expect((await findEmail(request, reference ?? ""))?.To[0]?.Address).toBe(email);
});

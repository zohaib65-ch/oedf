import { randomInt } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { capture } from "./screenshots";

// Uploads a real photo and a real PDF to the Cloudinary account in `.env` (the `oedf-dev` folder),
// so it only runs when asked:  E2E_REAL_UPLOADS=1 npm run test:e2e
// The global teardown deletes the files again, with the test records.
test.skip(!process.env.E2E_REAL_UPLOADS, "Set E2E_REAL_UPLOADS=1 to run the real-upload tests.");
test.use({ storageState: ADMIN_STATE_FILE });

const suffix = () => String(randomInt(100_000, 999_999));

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

/** A real PNG and a real PDF, made by the browser itself. */
async function makeFiles(page: Page): Promise<{ png: Buffer; pdf: Buffer }> {
  await page.setContent(
    '<main style="font:48px sans-serif;padding:40px;background:#0b1f3a;color:#fff">OEDF test photo</main>',
  );
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: 960, height: 540 } });
  await page.setContent("<h1>Signed agreement (test)</h1>");
  const pdf = await page.pdf({ format: "A4" });
  return { png, pdf };
}

test("a program photo shows on the public site, and a signed agreement opens through the staff link", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Uploads run once.");
  test.setTimeout(120_000);
  const { png, pdf } = await makeFiles(page);

  // Program with a photo, published.
  const title = `E2E Photo program ${suffix()}`;
  await page.goto("/portal/programs/new");
  await page.getByLabel("Title").fill(title);
  await choose(page, "Category", "Skills");
  await page.getByLabel("Summary").fill("A program with a real photo.");
  await choose(page, "Status", "Published");
  await page.getByLabel("Photo", { exact: true }).setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByText("photo.png")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Photo description").fill("A navy test banner");
  await page.getByRole("button", { name: "Save program" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  const href = await page
    .getByRole("link", { name: /View on the public site/ })
    .getAttribute("href");
  await page.goto(href ?? "/programs");
  const photo = page.getByRole("img", { name: "A navy test banner" });
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await capture(page, "real-upload-program-photo");
  await page.goto("/programs?category=SKILLS");
  await expect(page.getByRole("img", { name: "A navy test banner" })).toBeVisible();
  await capture(page, "real-upload-program-card");

  // Institution with a signed agreement PDF.
  const name = `E2E Upload institution ${suffix()}`;
  await page.goto("/portal/institutions/new");
  await page.getByLabel("Name").fill(name);
  await choose(page, "Type", "College");
  await page.getByLabel("City").fill("Multan");
  await page.getByRole("button", { name: "Save institution" }).click();
  await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();

  await page.getByRole("button", { name: "Add agreement" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title").fill("Signed partnership");
  await dialog.getByLabel("Partner").fill("Test partner");
  await dialog.getByLabel("Start date").fill("2026-01-01");
  await dialog.getByLabel("Signed copy").setInputFiles({
    name: "signed.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(dialog.getByText("signed.pdf")).toBeVisible({ timeout: 30_000 });
  await dialog.getByRole("button", { name: "Save agreement" }).click();
  await expect(dialog).toBeHidden();
  await capture(page, "real-upload-agreement");

  const fileHref = await page
    .getByRole("link", { name: /signed copy of Signed partnership/ })
    .getAttribute("href");
  const redirect = await page.request.get(fileHref ?? "", { maxRedirects: 0 });
  expect(redirect.status()).toBe(302);
  const location = redirect.headers().location ?? "";
  expect(location).toContain("cloudinary.com");
  // The link expires: Cloudinary's private download link carries its expiry time.
  const expiresAt = Number(new URL(location).searchParams.get("expires_at"));
  const secondsLeft = expiresAt - Date.now() / 1000;
  expect(secondsLeft).toBeGreaterThan(0);
  expect(secondsLeft).toBeLessThanOrEqual(5 * 60 + 5);
  const file = await page.request.get(location);
  expect(file.status()).toBe(200);
  expect((await file.body()).subarray(0, 4).toString()).toBe("%PDF");
});

test("a published publication's PDF downloads through a short-lived link, and its cover shows", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Uploads run once.");
  test.setTimeout(120_000);
  const { png, pdf } = await makeFiles(page);

  const title = `E2E Upload publication ${suffix()}`;
  await page.goto("/portal/publications/new");
  await page.getByLabel("Title").fill(title);
  await choose(page, "Type", "Research report");
  await page.getByLabel("Summary").fill("A publication with a real PDF and cover.");
  await choose(page, "Status", "Published");
  await page.getByLabel("Full PDF").setInputFiles({
    name: "report.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await expect(page.getByText("report.pdf")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Photo", { exact: true }).setInputFiles({
    name: "cover.png",
    mimeType: "image/png",
    buffer: png,
  });
  await expect(page.getByText("cover.png")).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Photo description").fill("A navy test cover");
  await page.getByRole("button", { name: "Save publication" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  const href = await page
    .getByRole("link", { name: /View on the public site/ })
    .getAttribute("href");
  await page.goto(href ?? "/research");
  const cover = page.getByRole("img", { name: "A navy test cover" });
  await expect
    .poll(() => cover.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
  await capture(page, "real-upload-publication");

  const download = page.getByRole("link", { name: "Download the full PDF" });
  const redirect = await page.request.get((await download.getAttribute("href")) ?? "", {
    maxRedirects: 0,
  });
  expect(redirect.status()).toBe(302);
  const location = redirect.headers().location ?? "";
  const expiresAt = Number(new URL(location).searchParams.get("expires_at"));
  expect(expiresAt - Date.now() / 1000).toBeLessThanOrEqual(5 * 60 + 5);
  const file = await page.request.get(location);
  expect(file.status()).toBe(200);
  expect((await file.body()).subarray(0, 4).toString()).toBe("%PDF");
});

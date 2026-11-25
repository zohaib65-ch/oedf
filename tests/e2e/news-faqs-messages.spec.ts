import { randomInt } from "node:crypto";
import { readFile } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";
import {
  deleteTestApplication,
  deleteTestJobApplication,
  insertTestApplication,
  insertTestJobApplication,
} from "./db";
import { capture } from "./screenshots";

// Posts start with "E2E ", FAQ topics with "E2E ", and messages come from visitor@example.org;
// the global teardown removes them.
test.use({ storageState: ADMIN_STATE_FILE });

const suffix = () => String(randomInt(100_000, 999_999));

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("an event is written, published with its venue and search title, and deleted", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the lists are checked on a phone too.");
  const title = `E2E Open day ${suffix()}`;

  await page.goto("/portal/news/new");
  await expectNoSeriousAccessibilityIssues(page);
  await page.getByLabel("Title", { exact: true }).fill(title);
  await choose(page, "Type", "Event");
  await page.getByLabel("Event date").fill("2026-12-20");
  await page.getByLabel("Start time").fill("10:00");
  await page.getByLabel("Venue").fill("Main hall, Vehari");
  await page.getByLabel("Excerpt").fill("Meet our teachers and see the classrooms.");
  await page.getByLabel("Body").fill("Join us for a day of:\n- tours\n- talks with teachers");
  await page.getByLabel("Search title").fill(`${title} | OEDF`);
  await page.getByRole("button", { name: "Save post" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();

  await choose(page, "Status", "Published");
  await page.getByRole("button", { name: "Save post" }).click();
  await expect(page.getByText("Post saved.")).toBeVisible();
  await expect(page.locator('[data-slot="badge"]', { hasText: "Published" })).toBeVisible();
  const href = await page
    .getByRole("link", { name: /View on the public site/ })
    .getAttribute("href");

  await page.goto(href ?? "/news");
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page).toHaveTitle(new RegExp(`${title} \\| OEDF`));
  await expect(page.getByText("Main hall, Vehari")).toBeVisible();
  await expect(page.getByText("20 December 2026, 10:00 (Pakistan time)")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "talks with teachers" })).toBeVisible();
  await capture(page, "news-public-event");
  await page.goto("/news");
  await expect(page.getByRole("link", { name: new RegExp(title) }).first()).toBeVisible();

  await page.goBack();
  await page.goBack();
  await page.getByRole("button", { name: "Delete post" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/portal\/news$/);
  await page.goto(href ?? "");
  await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
});

test("FAQs are added, reordered, hidden and deleted, and the public page follows", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the lists are checked on a phone too.");
  const topic = `E2E Topic ${suffix()}`;

  await page.goto("/portal/faqs");
  for (const [index, question] of ["When do admissions open?", "Is there a fee?"].entries()) {
    await page.getByRole("button", { name: "New question" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Question").fill(question);
    await dialog.getByLabel("Answer").fill("See the admissions page.");
    // The first question adds the topic; the second picks it from the list, so it cannot be mistyped.
    await dialog.getByRole("combobox", { name: "Topic" }).click();
    if (index === 0) {
      await page.getByPlaceholder("Search or type a new topic").fill(topic);
      await page.getByRole("option", { name: `Add “${topic}”` }).click();
    } else {
      await page.getByPlaceholder("Search or type a new topic").fill(topic.slice(0, 12));
      await page.getByRole("option", { name: topic, exact: true }).click();
    }
    await expect(dialog.getByRole("combobox", { name: "Topic" })).toHaveText(topic);
    await dialog.getByRole("checkbox", { name: /Published/ }).check();
    await dialog.getByRole("button", { name: "Save question" }).click();
    await expect(page.getByText("Question added.")).toBeVisible();
    await expect(dialog).toBeHidden();
  }
  const group = page
    .getByRole("heading", { name: topic })
    .locator("xpath=ancestor::*[@data-slot='card'][1]");
  await expect(group.getByRole("listitem")).toHaveCount(2);

  await group.getByRole("button", { name: "Move “Is there a fee?” up" }).click();
  await expect(page.getByText("Order saved.")).toBeVisible();
  await expect(group.getByRole("listitem").first()).toContainText("Is there a fee?");
  await expectNoSeriousAccessibilityIssues(page);

  await page.goto("/faqs");
  const publicTopic = page.getByRole("heading", { name: topic });
  await expect(publicTopic).toBeVisible();
  const questions = page.getByRole("button", {
    name: /When do admissions open\?|Is there a fee\?/,
  });
  await expect(questions.first()).toHaveText(/Is there a fee\?/);
  await capture(page, "faqs-public-order");

  await page.goto("/portal/faqs");
  await group.getByRole("button", { name: "Edit “Is there a fee?”" }).click();
  await page
    .getByRole("dialog")
    .getByRole("checkbox", { name: /Published/ })
    .uncheck();
  await page.getByRole("dialog").getByRole("button", { name: "Save question" }).click();
  await expect(group.getByText("Hidden", { exact: true })).toBeVisible();
  await page.goto("/faqs");
  await expect(page.getByRole("button", { name: /Is there a fee\?/ })).toHaveCount(0);

  await page.goto("/portal/faqs");
  for (let remaining = 2; remaining > 0; remaining--) {
    await group.getByRole("button", { name: "Delete" }).first().click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Question deleted.").first()).toBeVisible();
    await expect(group.getByRole("listitem")).toHaveCount(remaining - 1);
  }
});

test("a contact message reaches the inbox, is read, replied to and archived", async ({
  page,
  baseURL,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the lists are checked on a phone too.");
  const name = `E2E Visitor ${suffix()}`;
  const sent = await page.request.post("/api/v1/contact-messages", {
    headers: {
      origin: baseURL ?? "",
      "x-forwarded-for": `198.51.100.${String(randomInt(1, 255))}`,
    },
    data: {
      name,
      email: "visitor@example.org",
      subject: "SCHOLARSHIPS",
      message: "When is the scholarship deadline?\nThank you.",
    },
  });
  expect(sent.status()).toBe(201);

  await page.goto("/portal/messages?status=NEW");
  await expectNoSeriousAccessibilityIssues(page);
  await page.getByRole("link", { name, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: `Message from ${name}` })).toBeVisible();
  await expect(page.getByText("When is the scholarship deadline?")).toBeVisible();
  // Opening a new message marks it as read.
  await expect(page.locator('[data-slot="badge"]', { hasText: "Read" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Reply by email" })).toHaveAttribute(
    "href",
    /^mailto:visitor@example\.org\?subject=Re%3A/,
  );
  await expectNoSeriousAccessibilityIssues(page);

  await page.getByRole("button", { name: "Mark as replied" }).click();
  await expect(page.locator('[data-slot="badge"]', { hasText: "Replied" })).toBeVisible();
  await capture(page, "message-replied");
  await page.getByRole("button", { name: "Archive" }).click();
  await expect(page.locator('[data-slot="badge"]', { hasText: "Archived" })).toBeVisible();

  await page.goto("/portal/messages?status=ARCHIVED");
  await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
});

test("the filtered applications and job applications download as CSV", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "Downloads run once.");
  const applicant = `E2E Export ${suffix()}`;
  const application = await insertTestApplication("ADMISSION", applicant);
  const candidate = await insertTestJobApplication(`E2E Candidate ${suffix()}`);
  try {
    await page.goto(`/portal/applications?q=${encodeURIComponent(application.referenceNumber)}`);
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Export CSV" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^applications-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = await readFile(await download.path(), "utf8");
    const lines = csv.replace("﻿", "").trim().split("\r\n");
    expect(lines[0]).toBe("Reference,Type,Status,Applicant,City,Program,Submitted (PKT)");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain(application.referenceNumber);
    expect(lines[1]).toContain(applicant);

    await page.goto(`/portal/job-applications?q=${encodeURIComponent(candidate.referenceNumber)}`);
    const [jobDownload] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("link", { name: "Export CSV" }).click(),
    ]);
    const jobCsv = await readFile(await jobDownload.path(), "utf8");
    expect(jobCsv).toContain(candidate.referenceNumber);
  } finally {
    await deleteTestApplication(application.id);
    await deleteTestJobApplication(candidate);
  }
});

test("the news, FAQ and message screens work on a phone", async ({ page }) => {
  for (const [path, heading] of [
    ["/portal/news?type=EVENT", "News and events"],
    ["/portal/faqs", "FAQs"],
    ["/portal/messages?subject=ADMISSIONS", "Messages"],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  }
});

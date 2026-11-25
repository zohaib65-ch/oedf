import { randomInt } from "node:crypto";

import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";
import { makeDirectiveOverdue } from "./db";
import { capture } from "./screenshots";

// Records made here start with "E2E " and staff are staff.NNNNNN@example.org; the global teardown
// removes them.
test.use({ storageState: ADMIN_STATE_FILE });

const MAILPIT = process.env.MAILPIT_URL ?? "";
const HR_OFFICE = "Human Resources & Teacher Management";
const uniqueName = (kind: string) => `E2E ${kind} ${String(randomInt(100_000, 999_999))}`;

/** A day (YYYY-MM-DD) some days from now, in Pakistan time. */
const inDays = (days: number) =>
  new Date(Date.now() + days * 86_400_000 + 5 * 3_600_000).toISOString().slice(0, 10);

async function choose(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function officeId(request: APIRequestContext, baseURL: string, code: string) {
  const departments = (await (await request.get(`${baseURL}/api/v1/departments`)).json()) as {
    data: { id: string; code: string }[];
  };
  return departments.data.find((department) => department.code === code)?.id ?? "";
}

test("a publication is drafted, published with its summary and authors, and deleted", async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, "The full flow runs once; the lists are checked on a phone too.");
  const title = uniqueName("Publication");

  await page.goto("/portal/publications/new");
  await expectNoSeriousAccessibilityIssues(page);
  await page.getByLabel("Title").fill(title);
  await choose(page, "Type", "Policy paper");
  await page
    .getByLabel("Summary")
    .fill("We found:\n- fewer girls enrol after grade 5\n- distance matters");
  await page.getByLabel("Authors").fill("A. Khan, B. Ali");
  await page.getByLabel("Topics").fill("literacy, rural schools");
  await page.getByRole("button", { name: "Save publication" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();

  await choose(page, "Status", "Published");
  await page.getByRole("button", { name: "Save publication" }).click();
  await expect(page.getByText("Publication saved.")).toBeVisible();
  // The refreshed header badge, so axe measures its final colors.
  await expect(page.locator('[data-slot="badge"]', { hasText: "Published" })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
  const href = await page
    .getByRole("link", { name: /View on the public site/ })
    .getAttribute("href");
  expect(href).toMatch(/^\/research\/e2e-publication-/);

  await page.goto(href ?? "/research");
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "distance matters" })).toBeVisible();
  await expect(page.getByText("A. Khan, B. Ali")).toBeVisible();
  // No PDF was uploaded, so there is nothing to download.
  await expect(page.getByRole("link", { name: "Download the full PDF" })).toHaveCount(0);
  expect((await page.request.get(`${href ?? ""}/pdf`)).status()).toBe(404);
  await capture(page, "publication-public-page");

  await page.goBack();
  await page.getByRole("button", { name: "Delete publication" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/portal\/publications$/);
  await page.goto(href ?? "");
  await expect(page.getByRole("heading", { name: "This page could not be found" })).toBeVisible();
});

test("the publication form explains what is missing", async ({ page }) => {
  await page.goto("/portal/publications/new");
  await page.getByRole("button", { name: "Save publication" }).click();
  await expect(page.getByText("Title is required")).toBeVisible();
  await expect(page.getByText("Choose a type")).toBeVisible();
  await expect(page.getByText("Summary is required")).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
});

test("a directive goes from issue to acknowledgement, owner, clarification and completion", async ({
  page,
  isMobile,
  baseURL,
}) => {
  test.skip(isMobile, "The full flow runs once; the lists are checked on a phone too.");
  const base = baseURL ?? "";
  const title = uniqueName("Directive");

  // The HR office's Director, who is emailed, and a Staff member to own the work.
  const hrOffice = await officeId(page.request, base, "HR_TEACHER_MANAGEMENT");
  const ownerName = `Owner ${String(randomInt(1000, 9999))}`;
  const directorEmail = `staff.${String(randomInt(100_000, 999_999))}@example.org`;
  for (const [name, email, role] of [
    [ownerName, `staff.${String(randomInt(100_000, 999_999))}@example.org`, "STAFF"],
    ["HR Director", directorEmail, "DIRECTOR"],
  ] as const) {
    const created = await page.request.post(`${base}/api/v1/users`, {
      headers: { origin: base },
      data: { name, email, role, departmentId: hrOffice },
    });
    expect(created.status()).toBe(201);
  }

  await page.goto("/portal/directives/new");
  await expectNoSeriousAccessibilityIssues(page);
  await page.getByLabel("Title").fill(title);
  await page
    .getByLabel("Instructions")
    .fill("Send this term's enrolment figures.\n\n- By school\n- By grade");
  await page.getByLabel("Due date").fill(inDays(7));
  await choose(page, "Priority", "High");
  await page.getByRole("checkbox", { name: HR_OFFICE }).check();
  await page.getByRole("button", { name: "Issue directive" }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  const office = page.getByRole("region", { name: new RegExp(HR_OFFICE) });
  await expect(office.getByText("Awaiting acknowledgement").first()).toBeVisible();
  const reference = /OEDF-DIR-\d{4}-\d{3}/.exec(
    (await page
      .getByText(/OEDF-DIR-/)
      .first()
      .textContent()) ?? "",
  )?.[0];
  expect(reference).toBeTruthy();

  if (MAILPIT) {
    await expect
      .poll(async () => {
        const search = await page.request.get(
          `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${directorEmail} subject:"${reference ?? ""}"`)}`,
        );
        return ((await search.json()) as { messages: unknown[] }).messages.length;
      })
      .toBe(1);
  }

  await office.getByRole("button", { name: "Acknowledge" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Acknowledge" }).click();
  await expect(office.getByText("Acknowledged", { exact: true }).first()).toBeVisible();

  await office.getByRole("button", { name: /Choose owner/ }).click();
  const ownerDialog = page.getByRole("dialog");
  await choose(page, "Owner", ownerName);
  await ownerDialog.getByRole("button", { name: "Choose owner" }).click();
  await expect(office.getByText(`Owner: ${ownerName}.`).first()).toBeVisible();

  await office.getByRole("button", { name: /Start work/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Start work" }).click();
  await expect(office.getByText("In progress", { exact: true }).first()).toBeVisible();

  await office.getByLabel(`Progress update for ${HR_OFFICE}`).fill("Half the schools replied.");
  await office.getByRole("button", { name: "Post update" }).click();
  await expect(office.getByText("Half the schools replied.")).toBeVisible();

  await office.getByRole("button", { name: /Ask for clarification/ }).click();
  await choose(page, "Reason", "Conflicts with a donor restriction");
  await page.getByLabel("Explanation").fill("The donor funds may not pay for data collection.");
  await page.getByRole("dialog").getByRole("button", { name: "Ask for clarification" }).click();
  await expect(office.getByText("Clarification requested", { exact: true }).first()).toBeVisible();
  await expect(office.getByText("Waiting for the CEO Office")).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);

  await office.getByRole("button", { name: /Resolve clarification/ }).click();
  await choose(page, "Decision", "Reopen: the office carries out the directive");
  await page.getByLabel("Reason for the decision").fill("Use the general fund instead.");
  await page.getByRole("dialog").getByRole("button", { name: "Resolve clarification" }).click();
  await expect(office.getByRole("button", { name: /Mark completed/ })).toBeVisible();

  await office.getByRole("button", { name: /Mark completed/ }).click();
  await page.getByRole("dialog").getByLabel("Note").fill("All figures sent.");
  await page.getByRole("dialog").getByRole("button", { name: "Mark completed" }).click();
  await expect(office.getByText("Completed", { exact: true }).first()).toBeVisible();
  await expect(office.getByLabel(`Progress update for ${HR_OFFICE}`)).toHaveCount(0);
  await capture(page, "directive-completed");
});

test("an overdue directive is highlighted in the list and on the overview", async ({
  page,
  baseURL,
}) => {
  const base = baseURL ?? "";
  const title = uniqueName("Overdue directive");
  const issued = await page.request.post(`${base}/api/v1/directives`, {
    headers: { origin: base },
    data: {
      title,
      body: "Report attendance.",
      departmentIds: [await officeId(page.request, base, "ADMISSIONS_SCHOLARSHIPS")],
      dueDate: inDays(1),
      priority: "URGENT",
    },
  });
  expect(issued.status()).toBe(201);
  const { data } = (await issued.json()) as { data: { id: string } };
  await makeDirectiveOverdue(data.id);

  await page.goto("/portal");
  await expect(page.getByText("(needs attention)")).toBeAttached();
  await page.getByRole("link", { name: "View overdue directives" }).click();
  await expect(page).toHaveURL(/show=OVERDUE/);
  const row = page.getByRole("row").filter({ hasText: title });
  await expect(row.getByText("Overdue", { exact: true })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
  await capture(page, "directives-overdue");

  await row.getByRole("link", { name: title }).click();
  await expect(page.getByText(/This directive was due on/)).toBeVisible();
});

test("the publication and directive lists filter and stay usable on a phone", async ({ page }) => {
  await page.goto("/portal/publications?status=PUBLISHED&sort=-publishedOn");
  await expect(page.getByRole("heading", { level: 1, name: "Publications" })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
  await page.goto("/portal/directives?priority=URGENT");
  await expect(page.getByRole("heading", { level: 1, name: "Directives" })).toBeVisible();
  await expectNoSeriousAccessibilityIssues(page);
});

import { randomInt } from "node:crypto";

import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";
import { expectNoSeriousAccessibilityIssues } from "./axe";

const MAILPIT = process.env.MAILPIT_URL ?? "";
const PASSWORD = "a-long-test-password-1";

/** Sign-in is limited to 5 a minute per address, so each test comes from its own address. */
async function actAsNewAddress(context: BrowserContext): Promise<void> {
  const ip = `198.51.100.${randomInt(1, 255)}`;
  await context.route("**/api/auth/**", (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } }),
  );
}

async function findEmailText(request: APIRequestContext, to: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const search = await request.get(
      `${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`,
    );
    const { messages } = (await search.json()) as { messages: { ID: string }[] };
    const first = messages[0];
    if (first) {
      const message = await request.get(`${MAILPIT}/api/v1/message/${first.ID}`);
      return ((await message.json()) as { Text: string }).Text;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`No email arrived for ${to}`);
}

test.describe("sign in", () => {
  test.beforeEach(({ context }) => actAsNewAddress(context));

  test("the sign-in and forgot-password pages are accessible", async ({ page }) => {
    await page.goto("/portal/sign-in");
    await expect(page.getByRole("heading", { level: 1, name: "Staff sign in" })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
    await page.getByRole("link", { name: "Forgot your password?" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Forgot your password?" }),
    ).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("a wrong password shows one message that does not say which part was wrong", async ({
    page,
  }) => {
    await page.goto("/portal/sign-in");
    await page.getByLabel("Email").fill("nobody@example.org");
    await page.getByLabel("Password").fill("not-the-right-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "not correct" })).toBeVisible();
  });

  test("an empty form lists what is missing", async ({ page }) => {
    await page.goto("/portal/sign-in");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
    await expect(page.getByText("Enter your password")).toBeVisible();
  });

  test("forgot password gives the same answer for any email", async ({ page }) => {
    await page.goto("/portal/forgot-password");
    await page.getByLabel("Email").fill("nobody@example.org");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("If an active account uses that email");
  });

  test("a reset link without a token explains itself", async ({ page }) => {
    await page.goto("/portal/reset-password");
    await expect(
      page.getByRole("alert").filter({ hasText: "not valid or has expired" }),
    ).toBeVisible();
  });

  test("the Super Admin signs in and reaches the overview", async ({ page }) => {
    await page.goto("/portal/sign-in");
    await page.getByLabel("Email").fill(process.env.E2E_ADMIN_EMAIL ?? "");
    await page.getByLabel("Password").fill(process.env.E2E_ADMIN_PASSWORD ?? "");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  });
});

test.describe("the API refuses people it should", () => {
  test("a signed-out request gets 401 on every portal endpoint", async ({ request }) => {
    for (const path of [
      "/users",
      "/settings",
      "/audit-logs",
      "/dashboard/summary",
      "/departments",
      "/vacancies",
      "/job-applications",
      "/programs",
      "/institutions",
      "/publications",
      "/directives",
    ]) {
      expect((await request.get(`/api/v1${path}`)).status(), path).toBe(401);
    }
  });
});

test.describe("signed in as Super Admin", () => {
  test.use({ storageState: ADMIN_STATE_FILE });

  for (const [path, heading] of [
    ["/portal", "Overview"],
    ["/portal/users", "Users"],
    ["/portal/settings", "Settings"],
    ["/portal/audit-log", "Audit log"],
    ["/portal/profile", "Profile"],
    ["/portal/vacancies", "Vacancies"],
    ["/portal/job-applications", "Job applications"],
    ["/portal/programs", "Programs"],
    ["/portal/institutions", "Institutions"],
    ["/portal/publications", "Publications"],
    ["/portal/directives", "Directives"],
  ] as const) {
    test(`${path} opens and has no serious accessibility problems`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expectNoSeriousAccessibilityIssues(page);
    });
  }

  test("the sidebar lists every module for the Super Admin", async ({ page, isMobile }) => {
    test.skip(isMobile, "On a phone the sidebar is a drawer.");
    await page.goto("/portal");
    const sidebar = page.locator('[data-slot="sidebar"]');
    for (const name of [
      "Overview",
      "Programs",
      "Institutions",
      "Publications",
      "Directives",
      "Vacancies",
      "Job applications",
      "Users",
      "Settings",
      "Audit log",
    ]) {
      await expect(sidebar.getByRole("link", { name })).toBeVisible();
    }
  });

  test("saving the settings shows a toast, writes the audit log and updates the public site", async ({
    page,
    request,
    baseURL,
  }) => {
    const text = `Notice ${randomInt(1000, 9999)}`;
    await page.goto("/portal/settings");
    const bar = page.getByLabel("Show the announcement bar");
    const original = await bar.isChecked();
    await bar.check();
    await page.getByLabel("Text", { exact: true }).fill(text);
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();

    await page.goto("/portal/audit-log?action=settings.updated");
    await expect(page.getByRole("cell", { name: "settings.updated" }).first()).toBeVisible();

    const home = await request.get(`${baseURL ?? ""}/`);
    expect(await home.text()).toContain(text);

    await page.goto("/portal/settings");
    if (!original) {
      await page.getByLabel("Show the announcement bar").uncheck();
    }
    await page.getByLabel("Text", { exact: true }).fill("");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Settings saved")).toBeVisible();
  });

  test("settings reject a bad web address and say which field", async ({ page }) => {
    await page.goto("/portal/settings");
    await page.getByLabel("Map link").fill("not a link");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByText("Start with http:// or https://")).toBeVisible();
  });
});

test.describe("invited staff", () => {
  test.skip(!MAILPIT, "Needs MAILPIT_URL.");

  test("a Staff member is invited by email, sets a password, and is kept out of admin pages", async ({
    browser,
    baseURL,
  }) => {
    const email = `staff.${randomInt(100000, 999999)}@example.org`;
    const adminContext = await browser.newContext({ storageState: ADMIN_STATE_FILE });
    const departments = (await (
      await adminContext.request.get(`${baseURL ?? ""}/api/v1/departments`)
    ).json()) as { data: { id: string; code: string }[] };
    const office = departments.data.find((d) => d.code === "RESEARCH_POLICY");
    const created = await adminContext.request.post(`${baseURL ?? ""}/api/v1/users`, {
      headers: { origin: baseURL ?? "" },
      data: { name: "Invited Staff", email, role: "STAFF", departmentId: office?.id },
    });
    expect(created.status()).toBe(201);

    const text = await findEmailText(adminContext.request, email);
    const link = /https?:\/\/\S+\/reset-password\/\S+/.exec(text)?.[0];
    expect(link).toBeTruthy();

    const staffContext = await browser.newContext();
    await actAsNewAddress(staffContext);
    const page = await staffContext.newPage();
    await page.goto(link ?? "");
    await expect(
      page.getByRole("heading", { level: 1, name: "Welcome to the portal" }),
    ).toBeVisible();
    await page.getByLabel("New password", { exact: true }).fill(PASSWORD);
    await page.getByLabel("Confirm new password").fill(PASSWORD);
    await page.getByRole("button", { name: "Set password" }).click();
    await expect(page.getByText("Your password is set")).toBeVisible();

    await expect(page).toHaveURL(/\/portal\/sign-in/);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();

    await expect(page.getByRole("link", { name: "Users", exact: true })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Settings", exact: true })).toHaveCount(0);

    await page.goto("/portal/users");
    await expect(page.getByRole("heading", { level: 1, name: "Access denied" })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);

    await page.goto("/portal/applications");
    await expect(page.getByRole("heading", { level: 1, name: "Access denied" })).toBeVisible();

    for (const path of [
      "/users",
      "/settings",
      "/audit-logs",
      "/applications",
      "/scholarship-awards",
      "/vacancies",
      "/job-applications",
      "/programs",
      "/institutions",
    ]) {
      expect(
        (await staffContext.request.get(`${baseURL ?? ""}/api/v1${path}`)).status(),
        path,
      ).toBe(403);
    }
    expect(
      (
        await staffContext.request.patch(`${baseURL ?? ""}/api/v1/settings`, {
          headers: { origin: baseURL ?? "" },
          data: {},
        })
      ).status(),
    ).toBe(403);

    // Research & Policy Staff read their office's publications, but only a Director issues directives.
    expect((await staffContext.request.get(`${baseURL ?? ""}/api/v1/publications`)).status()).toBe(
      200,
    );
    expect(
      (
        await staffContext.request.post(`${baseURL ?? ""}/api/v1/directives`, {
          headers: { origin: baseURL ?? "" },
          data: {},
        })
      ).status(),
    ).toBe(403);

    const users = (await (
      await adminContext.request.get(`${baseURL ?? ""}/api/v1/users?q=${encodeURIComponent(email)}`)
    ).json()) as { data: { id: string }[] };
    const deactivated = await adminContext.request.patch(
      `${baseURL ?? ""}/api/v1/users/${users.data[0]?.id ?? ""}`,
      { headers: { origin: baseURL ?? "" }, data: { isActive: false } },
    );
    expect(deactivated.status()).toBe(200);
    await page.goto("/portal");
    await expect(page).toHaveURL(/\/portal\/sign-in$/);

    await adminContext.close();
    await staffContext.close();
  });
});

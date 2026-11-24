import { expect, test } from "@playwright/test";

import { expectNoSeriousAccessibilityIssues } from "./axe";

// These tests read the sample content added by `npm run db:seed:sample` (development and CI only).

const PAGES = [
  { path: "/about", heading: /About Omar Education/ },
  { path: "/governance", heading: /Governance and accountability/ },
  { path: "/departments", heading: /offices behind the foundation/ },
  { path: "/departments/research-and-policy-institute", heading: "Research & Policy Institute" },
  { path: "/programs", heading: /Educational and vocational programs/ },
  { path: "/programs/sample-web-development", heading: "Sample: Web development" },
  { path: "/institutions", heading: /Schools, colleges and training centers/ },
  { path: "/institutions/sample-skills-center", heading: "Sample Skills Center" },
  { path: "/admissions", heading: "Admissions" },
  { path: "/scholarships", heading: "Scholarships" },
  { path: "/careers", heading: /Work with the foundation/ },
  { path: "/careers/sample-teacher", heading: "Sample: Teacher" },
  { path: "/research", heading: /Research and policy work/ },
  { path: "/research/sample-literacy-report", heading: "Sample: Literacy report" },
  { path: "/news", heading: "News and events" },
  { path: "/news/sample-event", heading: "Sample: Open day" },
  { path: "/faqs", heading: /Frequently asked questions/ },
  { path: "/contact", heading: "Get in touch" },
  { path: "/privacy-policy", heading: "Privacy policy" },
  { path: "/terms", heading: "Terms of use" },
];

test.describe("public pages", () => {
  for (const { path, heading } of PAGES) {
    test(`${path} loads with its heading and no serious accessibility issues`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
      await expectNoSeriousAccessibilityIssues(page);
    });
  }

  test("the home page shows content sections from the database", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "The foundation in numbers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Programs that build skills/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Latest research/ })).toBeVisible();
    await expectNoSeriousAccessibilityIssues(page);
  });

  test("the top bar shows the contact details from Settings", async ({ page, isMobile }) => {
    test.skip(isMobile, "The top bar is hidden on small screens.");
    await page.goto("/");
    await expect(page.getByRole("banner").getByRole("link", { name: /0311/ })).toBeVisible();
  });

  test("a category filter is a link that narrows the list and can be shared", async ({ page }) => {
    await page.goto("/programs");
    await page.getByRole("link", { name: "Skills", exact: true }).click();
    await expect(page).toHaveURL(/\/programs\?category=SKILLS$/);
    await expect(page.getByRole("link", { name: "Skills", exact: true })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.getByRole("link", { name: "Sample: Web development" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sample: Secondary school support" })).toHaveCount(
      0,
    );
  });

  test("the research search finds a publication by its title", async ({ page }) => {
    await page.goto("/research");
    await page.getByRole("searchbox", { name: "Search research" }).fill("literacy");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/research\?q=literacy$/);
    await expect(page.getByRole("link", { name: "Sample: Literacy report" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sample: Scholarship brief" })).toHaveCount(0);
  });

  test("a list card opens its detail page", async ({ page }) => {
    await page.goto("/news");
    await page.getByRole("link", { name: "Sample: Open day" }).click();
    await expect(page).toHaveURL(/\/news\/sample-event$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sample: Open day");
  });

  test("a detail page has a canonical link, Open Graph tags and structured data", async ({
    page,
  }) => {
    await page.goto("/careers/sample-teacher");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/careers\/sample-teacher$/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Sample: Teacher",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    const jobPosting = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(JSON.parse(jobPosting ?? "{}")).toMatchObject({
      "@type": "JobPosting",
      title: "Sample: Teacher",
    });
  });

  test("an unknown detail address says so and asks search engines to skip it", async ({ page }) => {
    await page.goto("/news/no-such-article");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "This page could not be found",
    );
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content", /noindex/);
  });

  test("an invalid filter value is ignored instead of failing the page", async ({ page }) => {
    const response = await page.goto("/programs?category=NOPE&page=-3");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("link", { name: "Sample: Web development" })).toBeVisible();
  });

  test("robots.txt hides the portal and sitemap.xml lists public pages", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /portal");
    expect(robots).toContain("/sitemap.xml");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/about");
    expect(sitemap).toContain("/programs/sample-web-development");
    expect(sitemap).not.toContain("/portal");
  });

  test("the share image is served as a PNG", async ({ request }) => {
    const response = await request.get("/opengraph-image");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
  });
});

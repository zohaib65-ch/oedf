import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

import { capture, shotName } from "./screenshots";

const SERIOUS_IMPACTS = ["serious", "critical"];

/**
 * Fails the test when axe finds a serious or critical accessibility problem on the page.
 *
 * The fixed header is checked with every rule except color contrast. Its background is translucent
 * glass over the dark banner, and axe cannot read the banner's gradient behind it: from page to
 * page it measures the nav text against the white page instead and reports a contrast failure
 * that is not there (screenshots and the design system's contrast table show white and gold on
 * navy, at least 7.9:1). Every other element gets the full check, color contrast included.
 *
 * Toasts stacked behind the newest one are left out: sonner dims them on purpose while they wait
 * behind it. The newest toast is checked like everything else.
 *
 * Every page checked here is also saved as a screenshot for the review (`capture`).
 */
export async function expectNoSeriousAccessibilityIssues(page: Page): Promise<void> {
  await page.evaluate(() =>
    // Wait for running transitions so axe does not measure colors halfway through a fade. A
    // cancelled transition rejects `finished`, which is fine: it is no longer running.
    Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
  const content = await new AxeBuilder({ page })
    .exclude("header")
    .exclude('[data-sonner-toast][data-front="false"]')
    .analyze();
  // Pages without a header (the sign-in screens) have nothing to check here.
  const header =
    (await page.locator("header").count()) > 0
      ? await new AxeBuilder({ page }).include("header").disableRules(["color-contrast"]).analyze()
      : { violations: [] };

  const serious = [...content.violations, ...header.violations].filter(
    (violation) => violation.impact && SERIOUS_IMPACTS.includes(violation.impact),
  );
  await capture(page, shotName());
  expect(serious).toEqual([]);
}

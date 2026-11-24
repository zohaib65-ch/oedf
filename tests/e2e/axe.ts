import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const SERIOUS_IMPACTS = ["serious", "critical"];
const HEADER = "header";
// Far enough that the header has switched from its glass look to the solid navy one.
const SCROLL_PAST_HERO_PX = 400;

function seriousViolations(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]) {
  return violations.filter(
    (violation) => violation.impact && SERIOUS_IMPACTS.includes(violation.impact),
  );
}

/** Waits for running transitions: axe would otherwise measure colors halfway through a fade. */
async function waitForTransitions(page: Page): Promise<void> {
  await page.evaluate(() =>
    // A cancelled transition rejects `finished`, which is fine: it is no longer running.
    Promise.all(
      document.getAnimations().map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}

/**
 * Fails the test when axe finds a serious or critical accessibility problem on the page.
 *
 * The header is checked separately. At the top of a page it is translucent glass over the dark
 * banner, and axe cannot read the banner's gradient behind it (it sometimes measures against the
 * white page instead and reports a false contrast failure). So the header gets every check except
 * color contrast at the top, and the color contrast check once it is solid navy after scrolling.
 */
export async function expectNoSeriousAccessibilityIssues(page: Page): Promise<void> {
  await waitForTransitions(page);
  const body = await new AxeBuilder({ page }).exclude(HEADER).analyze();
  const headerAtTop = await new AxeBuilder({ page })
    .include(HEADER)
    .disableRules(["color-contrast"])
    .analyze();

  await page.evaluate((scrollTo) => {
    // Short pages (such as the 404 page) cannot scroll, so give the page room to.
    document.documentElement.style.minHeight = `${scrollTo + window.innerHeight}px`;
    window.scrollTo(0, scrollTo);
  }, SCROLL_PAST_HERO_PX);
  await page.waitForFunction(() => window.scrollY > 0);
  await waitForTransitions(page);
  const headerSolid = await new AxeBuilder({ page })
    .include(HEADER)
    .withRules(["color-contrast"])
    .analyze();

  expect(
    seriousViolations([...body.violations, ...headerAtTop.violations, ...headerSolid.violations]),
  ).toEqual([]);
}

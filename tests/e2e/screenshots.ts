import { test, type Page } from "@playwright/test";

const counts = new Map<string, number>();

/** A file name from the running test's title, numbered for each shot within the test. */
export function shotName(): string {
  const info = test.info();
  const slug = info.titlePath
    .slice(1)
    .join(" ")
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-|-$/g, "")
    .slice(0, 90);
  return `${slug}-${String((counts.get(info.testId) ?? 0) + 1)}`;
}

/** Where every run's screenshots go, one folder per device. Playwright empties it at the start of a run. */
export const SCREENSHOT_DIR = "test-results/screenshots";

/**
 * Saves a full-page screenshot for the review, taken while the test records still exist (the
 * global teardown removes them afterwards). Waits for fonts and transitions so the shot is stable.
 */
export async function capture(page: Page, name: string): Promise<void> {
  counts.set(test.info().testId, (counts.get(test.info().testId) ?? 0) + 1);
  await page.evaluate(async () => {
    await document.fonts.ready;
    // Lazy images below the fold never load for a full-page shot, so load and decode them all.
    const images = [...document.images];
    for (const image of images) {
      image.loading = "eager";
    }
    await Promise.all(images.map((image) => image.decode().catch(() => undefined)));
    await Promise.all(
      document
        .getAnimations()
        // A looping animation (a loading pulse or spinner) never finishes, so it is not waited for.
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    );
  });
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${test.info().project.name}/${name}.png`,
    // Toasts and the caret move between runs; hiding the caret keeps shots comparable.
    caret: "hide",
    fullPage: true,
  });
}

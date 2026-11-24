import { randomInt } from "node:crypto";

import type { BrowserContext } from "@playwright/test";

/**
 * Makes each test a different visitor to the site's own API, so the rate limit (5 submissions per
 * 10 minutes per IP per form) never trips between tests or runs. The header is added only to
 * requests for `/api/v1`: on a request to Cloudinary it would fail the browser's CORS check.
 */
export async function actAsNewVisitor(context: BrowserContext): Promise<void> {
  const ip = `203.0.113.${randomInt(1, 255)}`;
  await context.route("**/api/v1/**", (route) =>
    route.continue({ headers: { ...route.request().headers(), "x-forwarded-for": ip } }),
  );
}

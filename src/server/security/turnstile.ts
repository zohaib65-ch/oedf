import "server-only";

import { getServerEnv } from "@/env";
import { AppError } from "@/server/http/errors";
import { logger } from "@/server/lib/logger";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const VERIFY_TIMEOUT_MS = 5000;

function spamCheckError(message: string): AppError {
  return new AppError("VALIDATION_ERROR", message, { fieldErrors: { turnstileToken: [message] } });
}

/**
 * Checks the visitor's spam-check token with Cloudflare. When no secret key is set (local
 * development) the check is skipped; a real deployment must set one (see `src/env.ts`).
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<void> {
  const { TURNSTILE_SECRET_KEY } = getServerEnv();
  if (!TURNSTILE_SECRET_KEY) {
    return;
  }
  if (!token) {
    throw spamCheckError("Please complete the spam check.");
  }

  let isHuman = false;
  try {
    const response = await fetch(VERIFY_URL, {
      method: "POST",
      body: new URLSearchParams({ secret: TURNSTILE_SECRET_KEY, response: token, remoteip: ip }),
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    isHuman = ((await response.json()) as { success?: boolean }).success === true;
  } catch (error: unknown) {
    logger.error({ err: error }, "Turnstile verification could not be completed");
    throw spamCheckError("The spam check is not available right now. Please try again.");
  }
  if (!isHuman) {
    throw spamCheckError("The spam check failed. Please try again.");
  }
}

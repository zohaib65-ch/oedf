import "server-only";

import { AppError } from "@/server/http/errors";
import { getClientIp } from "@/server/security/client-ip";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { verifyTurnstile } from "@/server/security/turnstile";

const TEN_MINUTES_MS = 10 * 60 * 1000;

/** At most 5 submissions per 10 minutes per IP per form. */
export const FORM_RATE_LIMIT = { limit: 5, windowMs: TEN_MINUTES_MS } as const;
/** Reading a status or asking for upload permission is lighter than submitting a form. */
export const LOOKUP_RATE_LIMIT = { limit: 10, windowMs: TEN_MINUTES_MS } as const;
export const UPLOAD_RATE_LIMIT = { limit: 30, windowMs: TEN_MINUTES_MS } as const;

interface GuardInput {
  /** Names the form, so each form has its own limit. */
  scope: string;
  limit: number;
  windowMs: number;
  /** The honeypot field. Real visitors never see it, so any value means a bot. */
  faxNumber?: string | undefined;
  /** Uploads are only rate-limited; every other public request also needs the spam check. */
  turnstileToken?: string | undefined;
  needsTurnstile?: boolean;
}

/** The checks every public request passes first: honeypot, then rate limit, then the spam check. */
export async function guardPublicRequest(
  request: Request,
  { scope, limit, windowMs, faxNumber, turnstileToken, needsTurnstile = true }: GuardInput,
): Promise<void> {
  if (faxNumber) {
    throw new AppError("VALIDATION_ERROR", "We could not accept this submission.");
  }
  const ip = getClientIp(request);
  await enforceRateLimit({ scope, ip, limit, windowMs });
  if (needsTurnstile) {
    await verifyTurnstile(turnstileToken, ip);
  }
}

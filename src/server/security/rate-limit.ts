import "server-only";
import { createHash } from "node:crypto";

import { AppError } from "@/server/http/errors";
import { incrementRateLimit } from "@/server/repositories/rate-limit.repository";

interface RateLimitRule {
  /** Names what is limited, for example `application` or `contact`. */
  scope: string;
  ip: string;
  limit: number;
  windowMs: number;
}

/**
 * Allows `limit` calls per window for one IP and scope, then throws a 429. The window is fixed
 * (for example 10:00 to 10:10). The IP is stored only as a hash.
 */
export async function enforceRateLimit({
  scope,
  ip,
  limit,
  windowMs,
}: RateLimitRule): Promise<void> {
  const windowIndex = Math.floor(Date.now() / windowMs);
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  const expiresAt = new Date((windowIndex + 1) * windowMs);

  const count = await incrementRateLimit(`${scope}:${ipHash}:${windowIndex}`, expiresAt);
  if (count > limit) {
    throw new AppError(
      "RATE_LIMITED",
      "Too many attempts. Please wait a few minutes and try again.",
    );
  }
}

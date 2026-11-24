import { timingSafeEqual } from "node:crypto";

import { getServerEnv } from "@/env";
import { AppError } from "@/server/http/errors";
import { withApiHandler } from "@/server/http/handler";
import { ok } from "@/server/http/responses";
import { cleanupStaleUploads } from "@/server/services/cleanup.service";

function hasValidSecret(request: Request): boolean {
  const { CRON_SECRET } = getServerEnv();
  if (!CRON_SECRET) {
    return false;
  }
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${CRON_SECRET}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

// Called by the host's daily cron job, not by a browser, so it proves itself with the secret
// instead of the same-origin check. With no CRON_SECRET set (local development) it refuses everyone.
const handler = withApiHandler(
  async (request) => {
    if (!hasValidSecret(request)) {
      throw new AppError("UNAUTHORIZED", "Missing or wrong secret.");
    }
    return ok(await cleanupStaleUploads());
  },
  { isServerToServer: true },
);

export const POST = handler;
// Some hosts (Vercel cron) can only send GET requests. The secret protects both.
export const GET = handler;

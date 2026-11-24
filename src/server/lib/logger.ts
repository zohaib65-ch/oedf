import "server-only";
import pino from "pino";

import { getServerEnv } from "@/env";

const env = getServerEnv();

/**
 * Server-side logger. Never log secrets, CNIC numbers, financial details or personal documents.
 * Secrets that could end up in a logged object are redacted as a safety net.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.cnic"],
});

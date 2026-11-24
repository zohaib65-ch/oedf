import "server-only";
import pino from "pino";

import { getServerEnv } from "@/env";

const LEVEL_BY_ENVIRONMENT = { development: "debug", test: "silent", production: "info" } as const;

/**
 * Server-side logger. Never log secrets, CNIC numbers, financial details or personal documents.
 * Secrets that could end up in a logged object are redacted as a safety net.
 */
export const logger = pino({
  level: LEVEL_BY_ENVIRONMENT[getServerEnv().NODE_ENV],
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.cnic"],
});

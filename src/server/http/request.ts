import "server-only";
import type { z } from "zod";

import { AppError } from "@/server/http/errors";

const MAX_BODY_BYTES = 100_000;

/** Reads a JSON body of at most 100 KB and validates it. Failures are readable `AppError`s. */
export async function readJson<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) {
    throw new AppError("PAYLOAD_TOO_LARGE", "The request is too large.");
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AppError("VALIDATION_ERROR", "The request must be valid JSON.");
  }
  return schema.parse(body);
}

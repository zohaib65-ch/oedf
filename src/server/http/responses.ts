import "server-only";

import type { AppError } from "@/server/http/errors";

/** Standard success response: `{ "data": … }`. */
export function ok(data: unknown): Response {
  return Response.json({ data });
}

/** Standard error response: `{ "error": { "code", "message", "details" } }`. */
export function errorResponse(error: AppError): Response {
  return Response.json(
    { error: { code: error.code, message: error.message, details: error.details ?? {} } },
    { status: error.status },
  );
}

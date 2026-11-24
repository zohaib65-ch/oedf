import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { publicEnv } from "@/env";
import { AppError } from "@/server/http/errors";
import { errorResponse } from "@/server/http/responses";
import { logger } from "@/server/lib/logger";

const STATE_CHANGING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const SITE_ORIGIN = new URL(publicEnv.NEXT_PUBLIC_SITE_URL).origin;

type RouteHandler<TContext> = (request: Request, context: TContext) => Promise<Response>;
type HandlerFunction<TContext> = (
  request: Request,
  context: TContext,
) => Response | Promise<Response>;

/** Messages by the field's dotted path, for example `applicant.email`, so nested form fields can show them. */
function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }
  return fieldErrors;
}

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof z.ZodError) {
    return new AppError("VALIDATION_ERROR", "Some fields are not valid.", {
      fieldErrors: toFieldErrors(error),
    });
  }
  // The real cause goes to the log only. Callers never see stack traces or internal messages.
  logger.error({ err: error }, "Unexpected error in route handler");
  return new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}

interface HandlerOptions {
  /**
   * Turn the same-origin check off for a caller that is not a browser, such as the host's cron job.
   * That route must authenticate in another way (a secret).
   */
  isServerToServer?: boolean;
}

/**
 * Wraps every route handler: rejects state-changing requests that do not come from the site's own
 * origin, then maps typed errors and Zod errors to the standard error response.
 */
export function withApiHandler<TContext>(
  handler: HandlerFunction<TContext>,
  { isServerToServer = false }: HandlerOptions = {},
): RouteHandler<TContext> {
  return async (request, context) => {
    try {
      const isStateChanging = STATE_CHANGING_METHODS.has(request.method);
      if (isStateChanging && !isServerToServer && request.headers.get("origin") !== SITE_ORIGIN) {
        throw new AppError("FORBIDDEN", "This request is not allowed from this origin.");
      }
      return await handler(request, context);
    } catch (error: unknown) {
      // Next.js uses thrown errors to control rendering (for example while the build checks which routes can be static). They are not failures.
      unstable_rethrow(error);
      return errorResponse(toAppError(error));
    }
  };
}

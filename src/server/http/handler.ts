import "server-only";
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

function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  if (error instanceof z.ZodError) {
    return new AppError("VALIDATION_ERROR", "Some fields are not valid.", {
      fieldErrors: z.flattenError(error).fieldErrors,
    });
  }
  // The real cause goes to the log only. Callers never see stack traces or internal messages.
  logger.error({ err: error }, "Unexpected error in route handler");
  return new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.");
}

/**
 * Wraps every route handler: rejects state-changing requests that do not come from the site's own
 * origin, then maps typed errors and Zod errors to the standard error response.
 */
export function withApiHandler<TContext>(
  handler: HandlerFunction<TContext>,
): RouteHandler<TContext> {
  return async (request, context) => {
    try {
      const isStateChanging = STATE_CHANGING_METHODS.has(request.method);
      if (isStateChanging && request.headers.get("origin") !== SITE_ORIGIN) {
        throw new AppError("FORBIDDEN", "This request is not allowed from this origin.");
      }
      return await handler(request, context);
    } catch (error: unknown) {
      return errorResponse(toAppError(error));
    }
  };
}

import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

import { PORTAL_SIGN_IN_PATH } from "@/lib/constants/navigation";

// Pages a signed-out person must reach: signing in, and getting back in after a forgotten password.
const OPEN_PORTAL_PATHS = new Set([
  PORTAL_SIGN_IN_PATH,
  "/portal/forgot-password",
  "/portal/reset-password",
]);

/**
 * A fast check that sends signed-out visitors to the sign-in page. It only looks for the session
 * cookie, so it is a convenience, not security: every portal page and API route checks the real
 * session and permission again on the server.
 */
export function proxy(request: NextRequest) {
  if (OPEN_PORTAL_PATHS.has(request.nextUrl.pathname) || getSessionCookie(request)) {
    return NextResponse.next();
  }
  return NextResponse.redirect(new URL(PORTAL_SIGN_IN_PATH, request.url));
}

export const config = { matcher: "/portal/:path*" };

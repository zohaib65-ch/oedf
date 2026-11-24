import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PORTAL_SIGN_IN_PATH } from "@/lib/constants/navigation";
import { hasPermission, type Permission } from "@/lib/constants/permissions";
import { buildStaffContext, type StaffContext } from "@/server/auth/api-session";
import { getAuth } from "@/server/auth/auth";

/** The signed-in staff member. Redirects to the portal sign-in page when there is no session. */
export async function requireSession(): Promise<StaffContext> {
  const auth = await getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) {
    redirect(PORTAL_SIGN_IN_PATH);
  }
  return buildStaffContext(session.user, {
    ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    userAgent: requestHeaders.get("user-agent") ?? "",
  });
}

export type PageAccess =
  { isAllowed: true; staff: StaffContext } | { isAllowed: false; staff: StaffContext };

/** Checks a page's permission. The page shows the 403 view when `isAllowed` is false. */
export async function checkPagePermission(permission: Permission): Promise<PageAccess> {
  const staff = await requireSession();
  return { isAllowed: hasPermission(staff, permission), staff };
}

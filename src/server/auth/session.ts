import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PORTAL_SIGN_IN_PATH } from "@/lib/constants/navigation";
import { getAuth } from "@/server/auth/auth";

/** The signed-in staff member. Redirects to the portal sign-in page when there is no session. */
export async function requireSession() {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect(PORTAL_SIGN_IN_PATH);
  }
  return session;
}

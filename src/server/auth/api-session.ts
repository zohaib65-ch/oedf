import "server-only";

import { getAuth } from "@/server/auth/auth";
import { AppError } from "@/server/http/errors";

export interface StaffContext {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
}

/** The signed-in staff member behind an API request, or a 401. */
export async function requireApiSession(request: Request): Promise<StaffContext> {
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Sign in to continue.");
  }
  const { user } = session;
  return {
    id: user.id,
    name: user.name,
    role: user.role ?? "STAFF",
    departmentId: user.departmentId ?? null,
  };
}

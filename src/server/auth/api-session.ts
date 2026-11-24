import "server-only";

import { connection } from "next/server";

import type { ROLES } from "@/lib/constants/enums";
import { hasPermission, type Permission } from "@/lib/constants/permissions";
import { getAuth } from "@/server/auth/auth";
import { AppError } from "@/server/http/errors";
import { findDepartmentCodeById } from "@/server/repositories/department.repository";
import { getClientIp } from "@/server/security/client-ip";

type Role = (typeof ROLES)[number];

const ROLE_SET: ReadonlySet<string> = new Set<Role>([
  "SUPER_ADMIN",
  "CEO_OFFICE",
  "DIRECTOR",
  "STAFF",
]);

function toRole(value: string | null | undefined): Role {
  return value && ROLE_SET.has(value) ? (value as Role) : "STAFF";
}

/** The signed-in staff member and where the request came from. Passed to every service call. */
export interface StaffContext {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  departmentCode: Awaited<ReturnType<typeof findDepartmentCodeById>>;
  ipAddress: string;
  userAgent: string;
}

export async function buildStaffContext(
  user: {
    id: string;
    name: string;
    email: string;
    role?: string | null;
    departmentId?: string | null;
  },
  meta: { ipAddress: string; userAgent: string },
): Promise<StaffContext> {
  const departmentId = user.departmentId ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toRole(user.role),
    departmentId,
    departmentCode: departmentId ? await findDepartmentCodeById(departmentId) : null,
    ...meta,
  };
}

/** The signed-in staff member behind an API request, or a 401. */
export async function requireApiSession(request: Request): Promise<StaffContext> {
  // A GET handler must be answered per request, never prerendered at build time.
  await connection();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new AppError("UNAUTHORIZED", "Sign in to continue.");
  }
  return buildStaffContext(session.user, {
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? "",
  });
}

/** The signed-in staff member, who must also hold the permission, or a 401 or 403. */
export async function requireApiPermission(
  request: Request,
  permission: Permission,
): Promise<StaffContext> {
  const staff = await requireApiSession(request);
  if (!hasPermission(staff, permission)) {
    throw new AppError("FORBIDDEN", "You do not have permission to do this.");
  }
  return staff;
}

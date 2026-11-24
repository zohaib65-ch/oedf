import "server-only";

import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "@/lib/validations/user";
import type { StaffContext } from "@/server/auth/api-session";
import { AppError } from "@/server/http/errors";
import { findDepartmentCodeById } from "@/server/repositories/department.repository";
import {
  countActiveSuperAdmins,
  createUserAccount,
  findUserById,
  findUserIdByEmail,
  listUsers,
  sendPasswordLink,
  updateUserAccount,
  type UserRecord,
} from "@/server/repositories/user.repository";
import { recordAudit } from "@/server/services/audit-log.service";

const INVITATION_PATH = "/portal/reset-password?invited=1";
const RESET_PATH = "/portal/reset-password";

export async function getUsers(
  query: ListUsersQuery,
): Promise<{ items: UserRecord[]; total: number }> {
  return listUsers(
    { q: query.q, role: query.role },
    { page: query.page, pageSize: query.pageSize },
  );
}

async function requireDepartment(departmentId: string): Promise<void> {
  if (!(await findDepartmentCodeById(departmentId))) {
    throw new AppError("VALIDATION_ERROR", "Choose a valid office.", {
      fieldErrors: { departmentId: ["Choose a valid office"] },
    });
  }
}

async function requireUser(id: string): Promise<UserRecord> {
  const user = /^[0-9a-f]{24}$/.test(id) ? await findUserById(id) : null;
  if (!user) {
    throw new AppError("NOT_FOUND", "This user could not be found.");
  }
  return user;
}

/** Creates the account and emails an invitation to set a password. */
export async function createUser(staff: StaffContext, input: CreateUserInput): Promise<UserRecord> {
  await requireDepartment(input.departmentId);
  if (await findUserIdByEmail(input.email)) {
    throw new AppError("CONFLICT", "An account with this email already exists.", {
      fieldErrors: { email: ["An account with this email already exists"] },
    });
  }
  const user = await createUserAccount(input);
  await recordAudit(staff, {
    action: "user.created",
    entityType: "User",
    entityId: user.id,
    metadata: { role: user.role },
  });
  await sendPasswordLink(user.email, INVITATION_PATH);
  return user;
}

/** The changes that would leave the portal without an active Super Admin are refused. */
async function guardAgainstLockout(
  staff: StaffContext,
  target: UserRecord,
  input: UpdateUserInput,
): Promise<void> {
  const isDeactivating = input.isActive === false && target.isActive;
  const isDemoting = input.role !== undefined && input.role !== "SUPER_ADMIN";
  if (target.id === staff.id && isDeactivating) {
    throw new AppError("CONFLICT", "You cannot deactivate your own account.");
  }
  const isLosingAdmin =
    target.role === "SUPER_ADMIN" && target.isActive && (isDeactivating || isDemoting);
  if (isLosingAdmin && (await countActiveSuperAdmins()) <= 1) {
    throw new AppError("CONFLICT", "There must always be one active Super Admin.");
  }
}

function describeChanges(target: UserRecord, input: UpdateUserInput): Record<string, string> {
  const changes: Record<string, string> = {};
  if (input.role !== undefined && input.role !== target.role) {
    changes.role = `${target.role} to ${input.role}`;
  }
  if (input.departmentId !== undefined && input.departmentId !== target.departmentId) {
    changes.departmentId = "changed";
  }
  if (input.name !== undefined && input.name !== target.name) {
    changes.name = "changed";
  }
  if (input.isActive !== undefined && input.isActive !== target.isActive) {
    changes.isActive = String(input.isActive);
  }
  return changes;
}

export async function updateUser(
  staff: StaffContext,
  id: string,
  input: UpdateUserInput,
): Promise<UserRecord> {
  const target = await requireUser(id);
  if (input.departmentId !== undefined) {
    await requireDepartment(input.departmentId);
  }
  await guardAgainstLockout(staff, target, input);

  const changes = describeChanges(target, input);
  if (Object.keys(changes).length === 0) {
    return target;
  }
  await updateUserAccount(id, input);
  const isStatusChange = "isActive" in changes;
  await recordAudit(staff, {
    action: isStatusChange
      ? input.isActive
        ? "user.reactivated"
        : "user.deactivated"
      : "user.updated",
    entityType: "User",
    entityId: id,
    metadata: changes,
  });
  return requireUser(id);
}

/** Sends the person a new password link. A deactivated account cannot be reset. */
export async function sendUserPasswordReset(staff: StaffContext, id: string): Promise<void> {
  const target = await requireUser(id);
  if (!target.isActive) {
    throw new AppError("CONFLICT", "This account is deactivated. Reactivate it first.");
  }
  await sendPasswordLink(target.email, RESET_PATH);
  await recordAudit(staff, {
    action: "user.password-reset-requested",
    entityType: "User",
    entityId: id,
  });
}

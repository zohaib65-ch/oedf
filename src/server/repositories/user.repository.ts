import "server-only";
import mongoose from "mongoose";

import type { ROLES } from "@/lib/constants/enums";
import { getAuth } from "@/server/auth/auth";
import { connectDb } from "@/server/db/connection";

type Role = (typeof ROLES)[number];

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
  createdAt: string;
}

interface UserDocument {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role?: Role;
  departmentId?: string | null;
  banned?: boolean | null;
  createdAt: Date;
}

function toUserRecord(user: UserDocument): UserRecord {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role ?? "STAFF",
    departmentId: user.departmentId ?? null,
    isActive: user.banned !== true,
    createdAt: user.createdAt.toISOString(),
  };
}

/** Better Auth owns the `user` collection, so it is read through the raw collection, never a model. */
async function getUserCollection() {
  await connectDb();
  return mongoose.connection.collection<UserDocument>("user");
}

const escapeRegExp = (value: string) => value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);

export async function listUsers(
  filter: { q?: string | undefined; role?: Role | undefined },
  paging: { page: number; pageSize: number },
): Promise<{ items: UserRecord[]; total: number }> {
  const collection = await getUserCollection();
  const query: mongoose.mongo.Filter<UserDocument> = {};
  if (filter.role) {
    query.role = filter.role;
  }
  if (filter.q) {
    const pattern = new RegExp(escapeRegExp(filter.q), "i");
    query.$or = [{ name: pattern }, { email: pattern }];
  }
  const [rows, total] = await Promise.all([
    collection
      .find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((paging.page - 1) * paging.pageSize)
      .limit(paging.pageSize)
      .toArray(),
    collection.countDocuments(query),
  ]);
  return { items: rows.map(toUserRecord), total };
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  const collection = await getUserCollection();
  const user = await collection.findOne({ _id: new mongoose.Types.ObjectId(id) });
  return user ? toUserRecord(user) : null;
}

export async function findUserIdByEmail(email: string): Promise<string | null> {
  const collection = await getUserCollection();
  const user = await collection.findOne({ email }, { projection: { _id: 1 } });
  return user ? user._id.toString() : null;
}

/** How many active Super Admins there are, so the last one can never be removed. */
export async function countActiveSuperAdmins(): Promise<number> {
  const collection = await getUserCollection();
  return collection.countDocuments({ role: "SUPER_ADMIN", banned: { $ne: true } });
}

interface NewUser {
  name: string;
  email: string;
  role: Role;
  departmentId: string;
}

/**
 * Creates the account with a random password nobody knows. The person sets their own through the
 * invitation link, so no password is ever chosen or sent by an administrator.
 */
export async function createUserAccount(input: NewUser): Promise<UserRecord> {
  const auth = await getAuth();
  const { user } = await auth.api.createUser({
    body: {
      name: input.name,
      email: input.email,
      password: `${crypto.randomUUID()}${crypto.randomUUID()}`,
      role: input.role,
      data: { departmentId: input.departmentId },
    },
  });
  const created = await findUserById(user.id);
  if (!created) {
    throw new Error("The new account could not be read back.");
  }
  return created;
}

export interface UserChanges {
  name?: string | undefined;
  role?: Role | undefined;
  departmentId?: string | undefined;
  isActive?: boolean | undefined;
}

/** Applies the changes. Deactivating also ends every session, so access stops immediately. */
export async function updateUserAccount(id: string, changes: UserChanges): Promise<void> {
  const context = await (await getAuth()).$context;
  const { isActive, ...rest } = changes;
  const data: Record<string, unknown> = { ...rest };
  if (isActive !== undefined) {
    data.banned = !isActive;
    data.banReason = isActive ? null : "Deactivated by Super Admin";
  }
  await context.internalAdapter.updateUser(id, data);
  if (isActive === false) {
    await context.internalAdapter.deleteUserSessions(id);
  }
}

/** Emails a link to set a new password. The same call serves the invitation and a reset. */
export async function sendPasswordLink(email: string, redirectTo: string): Promise<void> {
  const auth = await getAuth();
  await auth.api.requestPasswordReset({ body: { email, redirectTo } });
}

import { render } from "@react-email/render";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEPARTMENTS } from "@/lib/constants/departments";
import type { StaffContext } from "@/server/auth/api-session";
import { getAuth } from "@/server/auth/auth";
import { connectDb } from "@/server/db/connection";
import { AuditLogModel } from "@/server/db/models/audit-log.model";
import { DepartmentModel } from "@/server/db/models/department.model";
import { sendEmail } from "@/server/email/send-email";
import { ensureDepartments } from "@/server/repositories/department.repository";
import {
  createUser,
  getUsers,
  sendUserPasswordReset,
  updateUser,
} from "@/server/services/user.service";

vi.mock("@/server/email/send-email", () => ({ sendEmail: vi.fn() }));

const PASSWORD = "a-long-enough-password";
let departmentId = "";
let admin: StaffContext;

function actor(user: { id: string; name: string }): StaffContext {
  return {
    id: user.id,
    name: user.name,
    email: "admin@example.org",
    role: "SUPER_ADMIN",
    departmentId,
    departmentCode: "CEO_OFFICE",
    ipAddress: "203.0.113.9",
    userAgent: "test",
  };
}

beforeEach(async () => {
  await connectDb();
  await Promise.all([
    AuditLogModel.deleteMany({}),
    DepartmentModel.deleteMany({}),
    ...["user", "account", "session", "verification"].map((name) =>
      mongoose.connection.collection(name).deleteMany({}),
    ),
  ]);
  await ensureDepartments(DEPARTMENTS);
  departmentId =
    (await DepartmentModel.findOne({ code: "ADMISSIONS_SCHOLARSHIPS" }).lean())?._id.toString() ??
    "";
  const auth = await getAuth();
  const { user } = await auth.api.createUser({
    body: {
      email: `admin-${crypto.randomUUID()}@example.org`,
      password: PASSWORD,
      name: "Admin",
      role: "SUPER_ADMIN",
    },
  });
  admin = actor(user);
  vi.mocked(sendEmail).mockReset();
  vi.mocked(sendEmail).mockResolvedValue(true);
});

const newUser = (email: string) => ({
  name: "New Director",
  email,
  role: "DIRECTOR" as const,
  departmentId,
});

/** The token inside the link that the invitation or reset email carries. */
async function lastEmailToken(): Promise<string> {
  const call = vi.mocked(sendEmail).mock.calls.at(-1)?.[0];
  const text = call ? await render(call.template, { plainText: true }) : "";
  const link = /https?:\/\/\S+\/reset-password\/[^\s?]+/.exec(text)?.[0] ?? "";
  return link.split("/").at(-1) ?? "";
}

describe("createUser", () => {
  it("creates the account, emails an invitation and lets the person set their own password", async () => {
    const created = await createUser(admin, newUser("director@example.org"));

    expect(created).toMatchObject({ role: "DIRECTOR", departmentId, isActive: true });
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "director@example.org",
        subject: expect.stringContaining("invited"),
      }),
    );
    expect(await AuditLogModel.countDocuments({ action: "user.created" })).toBe(1);

    const auth = await getAuth();
    await expect(
      auth.api.signInEmail({ body: { email: "director@example.org", password: PASSWORD } }),
    ).rejects.toThrow();
    await auth.api.resetPassword({
      body: { newPassword: PASSWORD, token: await lastEmailToken() },
    });
    const result = await auth.api.signInEmail({
      body: { email: "director@example.org", password: PASSWORD },
    });
    expect(result.user.role).toBe("DIRECTOR");
  });

  it("refuses an email that is already in use and an office that does not exist", async () => {
    await createUser(admin, newUser("taken@example.org"));
    await expect(createUser(admin, newUser("taken@example.org"))).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      createUser(admin, { ...newUser("other@example.org"), departmentId: "0".repeat(24) }),
    ).rejects.toMatchObject({ details: { fieldErrors: { departmentId: expect.any(Array) } } });
  });
});

describe("getUsers", () => {
  it("searches by name or email and filters by role", async () => {
    await createUser(admin, newUser("one@example.org"));
    await createUser(admin, { ...newUser("two@example.org"), role: "STAFF", name: "Zed Worker" });

    expect((await getUsers({ page: 1, pageSize: 20, q: "zed" })).items.map((u) => u.email)).toEqual(
      ["two@example.org"],
    );
    expect((await getUsers({ page: 1, pageSize: 20, role: "DIRECTOR" })).total).toBe(1);
  });
});

describe("updateUser", () => {
  it("changes the role and records what changed", async () => {
    const created = await createUser(admin, newUser("change@example.org"));
    const updated = await updateUser(admin, created.id, { role: "STAFF" });

    expect(updated.role).toBe("STAFF");
    const entry = await AuditLogModel.findOne({ action: "user.updated" }).lean();
    expect(entry?.metadata).toEqual({ role: "DIRECTOR to STAFF" });
  });

  it("deactivating a person ends their sessions and stops them signing in", async () => {
    const auth = await getAuth();
    const created = await createUser(admin, newUser("leaver@example.org"));
    await auth.api.resetPassword({
      body: { newPassword: PASSWORD, token: await lastEmailToken() },
    });
    const { token } = await auth.api.signInEmail({
      body: { email: "leaver@example.org", password: PASSWORD },
    });

    await updateUser(admin, created.id, { isActive: false });

    expect(
      await auth.api.getSession({ headers: new Headers({ authorization: `Bearer ${token}` }) }),
    ).toBeNull();
    await expect(
      auth.api.signInEmail({ body: { email: "leaver@example.org", password: PASSWORD } }),
    ).rejects.toThrow();
    expect(await AuditLogModel.countDocuments({ action: "user.deactivated" })).toBe(1);

    await updateUser(admin, created.id, { isActive: true });
    expect(await AuditLogModel.countDocuments({ action: "user.reactivated" })).toBe(1);
  });

  it("never lets the last Super Admin be deactivated or demoted", async () => {
    await expect(updateUser(admin, admin.id, { isActive: false })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(updateUser(admin, admin.id, { role: "STAFF" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });

  it("answers an unknown user with not found", async () => {
    await expect(updateUser(admin, "0".repeat(24), { name: "X" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("sendUserPasswordReset", () => {
  it("emails a reset link and refuses a deactivated account", async () => {
    const created = await createUser(admin, newUser("reset@example.org"));
    vi.mocked(sendEmail).mockClear();

    await sendUserPasswordReset(admin, created.id);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "reset@example.org",
        subject: expect.stringContaining("Reset"),
      }),
    );

    await updateUser(admin, created.id, { isActive: false });
    await expect(sendUserPasswordReset(admin, created.id)).rejects.toMatchObject({
      code: "CONFLICT",
    });
  });
});

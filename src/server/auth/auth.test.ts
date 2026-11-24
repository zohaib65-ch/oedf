import { describe, expect, it } from "vitest";

import { getAuth } from "@/server/auth/auth";

const PASSWORD = "a-long-enough-password";

async function createStaff(email: string, role: "DIRECTOR" | "STAFF") {
  const auth = await getAuth();
  return auth.api.createUser({ body: { email, password: PASSWORD, name: "Test Staff", role } });
}

describe("auth", () => {
  it("lets Super Admin create a staff account that can then sign in", async () => {
    const auth = await getAuth();
    await createStaff("director@example.org", "DIRECTOR");

    const result = await auth.api.signInEmail({
      body: { email: "director@example.org", password: PASSWORD },
    });
    expect(result.user.email).toBe("director@example.org");
    expect(result.user.role).toBe("DIRECTOR");
  });

  it("gives accounts created without a role the Staff role", async () => {
    const auth = await getAuth();
    const { user } = await auth.api.createUser({
      body: { email: "staff@example.org", password: PASSWORD, name: "Staff Member" },
    });

    expect(user.role).toBe("STAFF");
  });

  it("does not allow public sign-up", async () => {
    const auth = await getAuth();

    await expect(
      auth.api.signUpEmail({
        body: { email: "visitor@example.org", password: PASSWORD, name: "Visitor" },
      }),
    ).rejects.toThrow();
  });

  it("rejects a password shorter than 12 characters", async () => {
    const auth = await getAuth();

    await expect(
      auth.api.createUser({
        body: { email: "short@example.org", password: "short-pass", name: "Short Password" },
      }),
    ).rejects.toThrow();
  });

  it("rejects a wrong password", async () => {
    const auth = await getAuth();
    await createStaff("careful@example.org", "STAFF");

    await expect(
      auth.api.signInEmail({
        body: { email: "careful@example.org", password: "not-the-right-password" },
      }),
    ).rejects.toThrow();
  });
});

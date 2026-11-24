// Creates and removes the accounts and records the end-to-end tests use. Run by the global setup
// and teardown (`tsx --conditions=react-server`), never by hand against a real database:
//   create --email <email> --password <password>   a throwaway Super Admin
//   clean                                          everything the tests made
import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";

import mongoose from "mongoose";

import { getAuth } from "@/server/auth/auth";
import { connectDb } from "@/server/db/connection";
import { findDepartmentIdByCode } from "@/server/repositories/department.repository";

import { assertTestDatabase } from "./test-database";

// Better Auth builds its indexes in the background; closing at once only logs a harmless error.
const AUTH_INDEX_GRACE_MS = 1000;

/** Accounts the tests create: the throwaway Super Admin and invited Staff members. */
const TEST_ACCOUNT_EMAIL = /^(?:e2e-admin\.\d+|staff\.\d{6})@example\.org$/;
/** Addresses the public form tests type in. */
const TEST_MESSAGE_EMAILS = [
  "visitor@example.org",
  "rate@example.org",
  "a@example.org",
  "x@example.org",
  "test.applicant@example.org",
];
/** Test records carry reference numbers in the year 2099. */
const TEST_REFERENCE = /-2099-/;

async function createAdmin(email: string, password: string): Promise<void> {
  const auth = await getAuth();
  await auth.api.createUser({
    body: {
      email,
      password,
      name: "E2E Admin",
      role: "SUPER_ADMIN",
      data: { departmentId: await findDepartmentIdByCode("CEO_OFFICE") },
    },
  });
}

async function clean(): Promise<void> {
  const { db } = mongoose.connection;
  if (!db) {
    throw new Error("Not connected.");
  }
  const users = await db
    .collection("user")
    .find({ email: TEST_ACCOUNT_EMAIL }, { projection: { _id: 1 } })
    .toArray();
  const userIds = users.map((user) => user._id);
  const applications = await db
    .collection("applications")
    .find({ referenceNumber: TEST_REFERENCE }, { projection: { _id: 1 } })
    .toArray();

  await Promise.all([
    db.collection("auditLogs").deleteMany({ actorId: { $in: userIds } }),
    db.collection("account").deleteMany({ userId: { $in: userIds } }),
    db.collection("session").deleteMany({ userId: { $in: userIds } }),
    db
      .collection("verification")
      .deleteMany({ value: { $in: userIds.map((id) => id.toString()) } }),
    db
      .collection("scholarshipAwards")
      .deleteMany({ applicationId: { $in: applications.map((item) => item._id) } }),
    db.collection("applications").deleteMany({ referenceNumber: TEST_REFERENCE }),
    db.collection("jobApplications").deleteMany({ referenceNumber: TEST_REFERENCE }),
    db.collection("vacancies").deleteMany({ $or: [{ title: /^E2E / }, { slug: /^e2e-/ }] }),
    db.collection("contactMessages").deleteMany({ email: { $in: TEST_MESSAGE_EMAILS } }),
  ]);
  await db.collection("user").deleteMany({ _id: { $in: userIds } });
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { email: { type: "string" }, password: { type: "string" } },
});

assertTestDatabase(process.env.MONGODB_URI);
try {
  await connectDb();
  if (positionals[0] === "create" && values.email && values.password) {
    await createAdmin(values.email, values.password);
  } else if (positionals[0] === "clean") {
    await clean();
  } else {
    throw new Error("Use `create --email <email> --password <password>` or `clean`.");
  }
} finally {
  await delay(AUTH_INDEX_GRACE_MS);
  await mongoose.disconnect();
}

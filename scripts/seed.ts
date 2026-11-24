import { setTimeout as delay } from "node:timers/promises";

import mongoose from "mongoose";

import { getSeedEnv } from "@/env";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { getAuth } from "@/server/auth/auth";
import { connectDb } from "@/server/db/connection";
import {
  ensureDepartments,
  findDepartmentIdByCode,
} from "@/server/repositories/department.repository";
import { ensureSiteSettings } from "@/server/repositories/site-settings.repository";

// Better Auth creates its own indexes in the background and gives no way to wait for them. Closing the
// connection too early only logs a harmless error, so the script waits a moment before it exits.
const AUTH_INDEX_GRACE_MS = 1000;

const SUPER_ADMIN_NAME = "Super Admin";
// The technical administrator belongs to the Chief Executive Office until the client says otherwise.
const SUPER_ADMIN_DEPARTMENT_CODE = "CEO_OFFICE";

// Contact details come from the foundation's letterhead and are NOT confirmed by the client yet
// (docs/open-questions.md, C2 and C3). The site shows them as placeholders until they are.
const DEFAULT_SETTINGS = {
  contact: {
    address: "House No R200, Street No 2, Wasli Chowk, near Almakka Karyana, College Town, Vehari",
    phone: "0311 0046225",
    email: "",
    officeHours: "",
  },
  admissionsOpen: false,
  scholarshipsOpen: false,
};

async function ensureSuperAdmin(): Promise<boolean> {
  const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = getSeedEnv();
  const auth = await getAuth();
  const context = await auth.$context;

  if (await context.internalAdapter.findUserByEmail(SEED_ADMIN_EMAIL)) {
    return false;
  }

  const departmentId = await findDepartmentIdByCode(SUPER_ADMIN_DEPARTMENT_CODE);
  await auth.api.createUser({
    body: {
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      name: SUPER_ADMIN_NAME,
      role: "SUPER_ADMIN",
      data: { departmentId },
    },
  });
  return true;
}

async function seed(): Promise<void> {
  await connectDb();
  const departmentsCreated = await ensureDepartments(DEPARTMENTS);
  const settingsCreated = await ensureSiteSettings(DEFAULT_SETTINGS);
  const adminCreated = await ensureSuperAdmin();

  console.info(`Offices created: ${departmentsCreated} of ${DEPARTMENTS.length}`);
  console.info(`Site settings: ${settingsCreated ? "created" : "already present"}`);
  console.info(`Super Admin: ${adminCreated ? "created" : "already present"}`);
}

try {
  await seed();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await delay(AUTH_INDEX_GRACE_MS);
  await mongoose.disconnect();
}

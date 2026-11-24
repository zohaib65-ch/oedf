import { setTimeout as delay } from "node:timers/promises";
import { parseArgs } from "node:util";

import mongoose from "mongoose";
import { z } from "zod";

import { DEPARTMENTS } from "@/lib/constants/departments";
import { getAuth } from "@/server/auth/auth";
import { connectDb } from "@/server/db/connection";
import {
  ensureDepartments,
  findDepartmentIdByCode,
} from "@/server/repositories/department.repository";
import { ensureSiteSettings } from "@/server/repositories/site-settings.repository";

import { ask } from "./prompt";

// Better Auth creates its own indexes in the background and gives no way to wait for them. Closing the
// connection too early only logs a harmless error, so the script waits a moment before it exits.
const AUTH_INDEX_GRACE_MS = 1000;

const SUPER_ADMIN_NAME = "Super Admin";
const SUPER_ADMIN_ROLE = "SUPER_ADMIN";
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

const credentialsSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(12, "The password needs at least 12 characters"),
});

/**
 * The first Super Admin's email and password. They come from `--email` and `--password` (for CI)
 * or are asked for in the terminal. They are stored in the database, never in an env file.
 */
async function readCredentials(): Promise<z.infer<typeof credentialsSchema>> {
  const { values } = parseArgs({
    options: { email: { type: "string" }, password: { type: "string" } },
  });
  const hasFlags = values.email !== undefined && values.password !== undefined;
  if (!hasFlags && !process.stdin.isTTY) {
    throw new Error(
      "No Super Admin exists. Run `npm run db:seed -- --email <email> --password <password>`.",
    );
  }
  console.info("No Super Admin exists yet. Create the first one (stored in the database).");
  return credentialsSchema.parse({
    email: values.email ?? (await ask("Email: ")),
    password:
      values.password ?? (await ask("Password (12+ characters, hidden): ", { isHidden: true })),
  });
}

async function ensureSuperAdmin(): Promise<boolean> {
  const auth = await getAuth();
  const context = await auth.$context;

  const existing = await context.adapter.count({
    model: "user",
    where: [{ field: "role", value: SUPER_ADMIN_ROLE }],
  });
  if (existing > 0) {
    return false;
  }

  const { email, password } = await readCredentials();
  const departmentId = await findDepartmentIdByCode(SUPER_ADMIN_DEPARTMENT_CODE);
  await auth.api.createUser({
    body: {
      email,
      password,
      name: SUPER_ADMIN_NAME,
      role: SUPER_ADMIN_ROLE,
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

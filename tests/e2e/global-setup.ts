import { execFileSync } from "node:child_process";
import { randomBytes, randomInt } from "node:crypto";

import { assertTestDatabase } from "./test-database";

/** Runs the account script with the server-only code paths the app itself uses. */
export function runTestAccounts(...args: string[]): void {
  execFileSync("npx", ["tsx", "--conditions=react-server", "tests/e2e/test-accounts.ts", ...args], {
    stdio: "inherit",
    env: process.env,
  });
}

/**
 * Refuses a database that could be production, removes anything an earlier run left, and creates
 * a throwaway Super Admin for this run. Its email and password reach the tests through the
 * environment, so no real account is ever used.
 */
export default function globalSetup(): void {
  assertTestDatabase(process.env.MONGODB_URI);
  runTestAccounts("clean");
  const email = `e2e-admin.${String(randomInt(100_000, 999_999))}@example.org`;
  const password = randomBytes(24).toString("base64url");
  // `--name=value`: a random password can start with "-", which would read as another option.
  runTestAccounts("create", `--email=${email}`, `--password=${password}`);
  process.env.E2E_ADMIN_EMAIL = email;
  process.env.E2E_ADMIN_PASSWORD = password;
}

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { expect, test as setup } from "@playwright/test";

import { ADMIN_STATE_FILE } from "./auth-state";

// Signing in is rate limited (5 per minute), so it happens once and every test reuses the session.
setup("sign in as the seeded Super Admin", async ({ request, baseURL }) => {
  mkdirSync(dirname(ADMIN_STATE_FILE), { recursive: true });
  const { E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD } = process.env;

  if (!E2E_ADMIN_EMAIL || !E2E_ADMIN_PASSWORD) {
    // Tests that need the session skip themselves; an empty state file keeps the others working.
    writeFileSync(ADMIN_STATE_FILE, JSON.stringify({ cookies: [], origins: [] }));
    setup.skip(true, "Needs E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD.");
    return;
  }

  const response = await request.post("/api/auth/sign-in/email", {
    headers: { origin: baseURL ?? "" },
    data: { email: E2E_ADMIN_EMAIL, password: E2E_ADMIN_PASSWORD },
  });
  expect(response.status()).toBe(200);
  await request.storageState({ path: ADMIN_STATE_FILE });
});

import { existsSync } from "node:fs";

import { defineConfig, devices } from "@playwright/test";

// Tests that prepare their own records (tests/e2e/db.ts) use the same database as the app. CI sets
// the variables in the workflow instead of a file.
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = `http://localhost:${PORT}`;
const isCi = Boolean(process.env.CI);

// Locally the tests use the installed Google Chrome; CI installs Playwright's own Chromium.
const browserChannel = isCi ? undefined : "chrome";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: isCi ? "github" : "list",
  use: { baseURL: BASE_URL, trace: "on-first-retry" },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { channel: browserChannel } },
    {
      name: "desktop",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"], channel: browserChannel },
    },
    {
      name: "mobile",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: { ...devices["Pixel 7"], channel: browserChannel },
    },
  ],
  webServer: {
    command: "npm run start",
    url: `${BASE_URL}/api/v1/health`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});

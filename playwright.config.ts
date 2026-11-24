import { defineConfig, devices } from "@playwright/test";

const PORT = 3000;
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
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: browserChannel } },
    { name: "mobile", use: { ...devices["Pixel 7"], channel: browserChannel } },
  ],
  webServer: {
    command: "npm run start",
    url: `${BASE_URL}/api/v1/health`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
});

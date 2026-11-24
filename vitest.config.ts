import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup.ts"],
    env: {
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      BETTER_AUTH_SECRET: "test-secret-that-is-at-least-32-characters-long",
      CLOUDINARY_URL: "cloudinary://123456789012345:test-secret@test-cloud",
    },
    coverage: {
      provider: "v8",
      include: ["src/server/services/**", "src/lib/validations/**"],
    },
  },
});

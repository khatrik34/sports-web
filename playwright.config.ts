import { defineConfig } from "@playwright/test";

// Run the actual website and Java backend before invoking this suite; no fixture server is started.
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: process.env.E2E_SITE_URL || "http://localhost:3001",
    browserName: "chromium",
    trace: "retain-on-failure",
  },
});

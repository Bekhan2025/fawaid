import { defineConfig, devices } from "@playwright/test";
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  use: { baseURL: `http://127.0.0.1:3100${basePath}/`, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: staticExport ? "bun scripts/serve-export.ts" : "bun .next/standalone/server.js",
    wait: { stdout: /Ready (in|at)/ },
    env: { PORT: "3100", HOSTNAME: "127.0.0.1", NODE_ENV: "production" },
    reuseExistingServer: false,
    timeout: 30_000,
  },
});

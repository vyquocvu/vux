import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3417);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;
const CHROME_PATH =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL: BASE_URL,
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: CHROME_PATH,
    },
  },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `yarn dev -H 127.0.0.1 -p ${PORT}`,
        url: `${BASE_URL}/api/auth/me`,
        reuseExistingServer: false,
        timeout: 45_000,
      },
});

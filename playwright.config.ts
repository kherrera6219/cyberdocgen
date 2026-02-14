import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E & Visual Regression Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
const runCrossBrowser = process.env.PLAYWRIGHT_CROSS_BROWSER === "true";
const runVisual = process.env.PLAYWRIGHT_VISUAL === "true";

const projects = [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
];

if (runCrossBrowser) {
  projects.push(
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  );
}

if (runVisual) {
  projects.push({
    name: "visual-chromium",
    testDir: "./tests/visual",
    use: {
      ...devices["Desktop Chrome"],
      launchOptions: {
        args: ["--font-render-hinting=none", "--disable-gpu"],
      },
    },
  });
}

export default defineConfig({
  testDir: "./tests/e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }], ["list"]],
  /* Global timeout settings to prevent hanging tests */
  timeout: 30 * 1000, // 30 seconds per test
  globalTimeout: 10 * 60 * 1000, // 10 minutes max for entire test run
  expect: {
    timeout: 5000, // 5 seconds for expect assertions
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      threshold: 0.2,
      animations: "disabled",
    },
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:5000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
  },

  /* Configure projects for major browsers */
  projects,

  /* Run your local dev server before starting the tests */
  webServer: {
    command:
      "cross-env DEPLOYMENT_MODE=local LOCAL_AUTH_BYPASS=false LOCAL_SERVER=true NODE_ENV=test HOST=127.0.0.1 PORT=5000 LOCAL_PORT=5000 LOCAL_DATA_PATH=./test-data/e2e-local tsx server/index.ts",
    url: "http://localhost:5000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

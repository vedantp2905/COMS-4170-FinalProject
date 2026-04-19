import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the COMS 4170 course project.
 *
 * We intentionally exercise a broad set of Playwright features:
 *  - 3 rendering engines (Chromium, Firefox, WebKit)
 *  - 2 mobile emulation profiles
 *  - HTML + JSON + list reporters
 *  - Automatic trace/screenshot/video capture on failure
 *  - Parallel workers
 *  - Configurable retries
 */
export default defineConfig({
  testDir: './tests',
  // Run all tests in a file in parallel and all files in parallel
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 4,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
});

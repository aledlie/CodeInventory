import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 *
 * Browser test strategy:
 * 1. Chrome tests run first (primary browser)
 * 2. Only if Chrome passes, other browsers run
 *
 * Use projects to control execution order in CI/CD.
 */
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/browser-results.json' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    // Chrome - primary browser
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox - secondary browser (no dependencies for separate CI job)
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // WebKit/Safari - secondary browser (no dependencies for separate CI job)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});

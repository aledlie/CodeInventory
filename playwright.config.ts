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
    // Chrome runs first - this is our primary browser
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    // Firefox runs after Chrome passes
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['chromium'], // Only runs if chromium passes
    },

    // WebKit/Safari runs after Chrome passes
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['chromium'], // Only runs if chromium passes
    },

    // Mobile Chrome (optional - runs after desktop Chrome)
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['chromium'],
    },

    // Mobile Safari (optional - runs after desktop Chrome)
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      dependencies: ['chromium'],
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

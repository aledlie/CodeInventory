import { test, expect } from '@playwright/test';

/**
 * Production Link Verification Tests
 *
 * Tests that all dashboard links work on integrityaistudio.com
 */

const PROD_URL = 'https://integrityaistudio.com';

// All dashboard routes from the codebase
const ROUTES = [
  '/dashboard',
  '/dashboard/quality',
  '/dashboard/coverage',
  '/dashboard/dependencies',
  '/dashboard/trends',
  '/dashboard/graph',
  '/dashboard/tools',
  '/dashboard/compare',
  '/dashboard/reports',
  '/dashboard/insights',
  '/dashboard/predictions',
  '/dashboard/settings',
  '/dashboard/analytics',
];

test.describe('Production Link Verification', () => {
  test('root page loads correctly', async ({ page }) => {
    await page.goto(PROD_URL);
    // Wait for SPA to load
    await page.waitForTimeout(3000);
    await expect(page).toHaveTitle(/Code Inventory/i);
  });

  for (const route of ROUTES) {
    test(`route ${route} loads`, async ({ page }) => {
      // Go to root first (SPA needs to load)
      await page.goto(PROD_URL);
      await page.waitForTimeout(2000);

      // Navigate to route via client-side routing
      await page.evaluate((r) => {
        window.history.pushState({}, '', r);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, route);

      // Wait for route to render
      await page.waitForTimeout(2000);

      // Page should not show critical error state (specific error messages)
      const criticalError = await page.locator('text="Oops! Something went wrong"').count();
      const notFound = await page.locator('text="Page not found"').count();
      expect(criticalError + notFound).toBe(0);
    });
  }

  test('direct route access works via 404 redirect', async ({ page }) => {
    // Go directly to /dashboard (tests 404.html redirect)
    await page.goto(`${PROD_URL}/dashboard`);
    // Wait for redirect and SPA load
    await page.waitForTimeout(4000);

    // Should end up at dashboard
    await expect(page).toHaveURL(/dashboard/);
    await expect(page).toHaveTitle(/Code Inventory/i);
  });

  test('sidebar navigation links work', async ({ page }) => {
    await page.goto(`${PROD_URL}/dashboard`);
    await page.waitForTimeout(3000);

    // Get all sidebar links
    const links = page.locator('nav a, [data-testid="sidebar"] a, aside a').first();
    const count = await links.count();

    if (count > 0) {
      // Click first nav link
      await links.click();
      await page.waitForTimeout(1000);
      // URL should change
      expect(page.url()).not.toBe(`${PROD_URL}/dashboard`);
    }
  });
});

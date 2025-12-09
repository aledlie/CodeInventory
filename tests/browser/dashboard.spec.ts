import { test, expect } from '@playwright/test';

/**
 * Dashboard Browser Tests
 *
 * These tests verify the dashboard UI works correctly across browsers.
 * Chrome tests run first; other browsers only run if Chrome passes.
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should load dashboard page', async ({ page }) => {
    await expect(page).toHaveTitle(/Code Inventory/);
  });

  test('should display main navigation', async ({ page }) => {
    const sidebar = page.locator('[data-testid="sidebar"]').or(page.locator('nav'));
    await expect(sidebar).toBeVisible();
  });

  test('should show metric cards', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('[data-testid="metric-card"]', { timeout: 10000 }).catch(() => {
      // Fallback: look for any card-like elements
    });

    const cards = page.locator('[data-testid="metric-card"]').or(
      page.locator('.MuiCard-root')
    );

    // Should have at least one metric card
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should navigate to quality page', async ({ page }) => {
    // Try multiple selectors for quality link
    const qualityLink = page.locator('a[href*="quality"]').or(
      page.getByRole('link', { name: /quality/i })
    ).or(page.locator('text=Quality').first());

    await qualityLink.first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/quality/);
  });

  test('should navigate to coverage page', async ({ page }) => {
    // Try multiple selectors for coverage link
    const coverageLink = page.locator('a[href*="coverage"]').or(
      page.getByRole('link', { name: /coverage/i })
    ).or(page.locator('text=Coverage').first());

    await coverageLink.first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/coverage/);
  });

  test('should navigate to dependencies page', async ({ page }) => {
    // Try multiple selectors for dependencies link
    const depsLink = page.locator('a[href*="dependencies"]').or(
      page.getByRole('link', { name: /dependenc/i })
    ).or(page.locator('text=Dependencies').first());

    await depsLink.first().click({ timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/dependencies/);
  });
});

test.describe('Dashboard Responsiveness', () => {
  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Page should still load and be functional
    await expect(page).toHaveTitle(/Code Inventory/);
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');

    await expect(page).toHaveTitle(/Code Inventory/);
  });
});

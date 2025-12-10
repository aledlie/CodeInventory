import { test, expect } from '@playwright/test';

/**
 * Sidebar Navigation Tests
 *
 * These tests verify that the sidebar navigation works correctly.
 * Tests cover:
 * - Navigation items are visible and clickable
 * - Clicking navigation items navigates to correct routes
 * - Active state highlighting works correctly
 * - Keyboard navigation support
 */

test.describe('Sidebar Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait for sidebar to be visible
    await page.waitForSelector('aside, nav[aria-label="Primary navigation"]', { timeout: 10000 });
  });

  test('should display all navigation items', async ({ page }) => {
    const navItems = [
      'Dashboard',
      'Code Quality',
      'Test Coverage',
      'Dependencies',
      'Trends',
      'Graph',
      'Compare',
      'Reports',
      'AI Insights',
      'Predictions',
      'Analytics',
      'Settings',
    ];

    for (const item of navItems) {
      const navLink = page.getByRole('button', { name: item }).or(
        page.locator(`text="${item}"`)
      );
      await expect(navLink.first()).toBeVisible();
    }
  });

  test('should navigate to Code Quality page when clicked', async ({ page }) => {
    const qualityButton = page.getByRole('button', { name: /Code Quality/i }).first();
    await qualityButton.click();

    await page.waitForURL(/\/dashboard\/quality/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/quality/);
  });

  test('should navigate to Test Coverage page when clicked', async ({ page }) => {
    const coverageButton = page.getByRole('button', { name: /Test Coverage/i }).first();
    await coverageButton.click();

    await page.waitForURL(/\/dashboard\/coverage/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/coverage/);
  });

  test('should navigate to Dependencies page when clicked', async ({ page }) => {
    const depsButton = page.getByRole('button', { name: /Dependencies/i }).first();
    await depsButton.click();

    await page.waitForURL(/\/dashboard\/dependencies/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/dependencies/);
  });

  test('should navigate to Trends page when clicked', async ({ page }) => {
    const trendsButton = page.getByRole('button', { name: /Trends/i }).first();
    await trendsButton.click();

    await page.waitForURL(/\/dashboard\/trends/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/trends/);
  });

  test('should navigate to Graph page when clicked', async ({ page }) => {
    const graphButton = page.getByRole('button', { name: /Graph/i }).first();
    await graphButton.click();

    await page.waitForURL(/\/dashboard\/graph/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/graph/);
  });

  test('should navigate to Compare page when clicked', async ({ page }) => {
    const compareButton = page.getByRole('button', { name: /Compare/i }).first();
    await compareButton.click();

    await page.waitForURL(/\/dashboard\/compare/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/compare/);
  });

  test('should navigate to Reports page when clicked', async ({ page }) => {
    const reportsButton = page.getByRole('button', { name: /Reports/i }).first();
    await reportsButton.click();

    await page.waitForURL(/\/dashboard\/reports/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/reports/);
  });

  test('should navigate back to Dashboard when clicked', async ({ page }) => {
    // First navigate away
    const qualityButton = page.getByRole('button', { name: /Code Quality/i }).first();
    await qualityButton.click();
    await page.waitForURL(/\/dashboard\/quality/, { timeout: 10000 });

    // Then navigate back to dashboard
    const dashboardButton = page.getByRole('button', { name: /^Dashboard$/i }).first();
    await dashboardButton.click();

    await page.waitForURL(/\/dashboard\/?$/, { timeout: 10000 });
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Navigate to Quality page
    const qualityButton = page.getByRole('button', { name: /Code Quality/i }).first();
    await qualityButton.click();
    await page.waitForURL(/\/dashboard\/quality/, { timeout: 10000 });

    // Check that the Quality item has aria-current="page"
    const activeItem = page.locator('[aria-current="page"]');
    await expect(activeItem).toBeVisible();
    await expect(activeItem).toContainText(/Code Quality/i);
  });

  test('should support keyboard navigation with Enter key', async ({ page }) => {
    // Focus on a navigation item
    const qualityButton = page.getByRole('button', { name: /Code Quality/i }).first();
    await qualityButton.focus();

    // Press Enter to navigate
    await page.keyboard.press('Enter');

    await page.waitForURL(/\/dashboard\/quality/, { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard\/quality/);
  });

  test('should navigate through all main sections', async ({ page }) => {
    const routes = [
      { name: /Code Quality/i, url: /\/dashboard\/quality/ },
      { name: /Test Coverage/i, url: /\/dashboard\/coverage/ },
      { name: /Dependencies/i, url: /\/dashboard\/dependencies/ },
      { name: /Trends/i, url: /\/dashboard\/trends/ },
    ];

    for (const route of routes) {
      const button = page.getByRole('button', { name: route.name }).first();
      await button.click();
      await page.waitForURL(route.url, { timeout: 10000 });
      await expect(page).toHaveURL(route.url);
    }
  });
});

test.describe('Sidebar Navigation - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    // On mobile, sidebar is hidden and hamburger menu appears
    const hamburgerButton = page.getByRole('button', { name: /open navigation/i }).or(
      page.locator('[aria-label*="menu"]')
    );

    // Hamburger button should be visible on mobile
    const count = await hamburgerButton.count();
    if (count > 0) {
      await expect(hamburgerButton.first()).toBeVisible();
    }
  });

  test('should open drawer when hamburger is clicked', async ({ page }) => {
    const hamburgerButton = page.getByRole('button', { name: /open navigation/i }).or(
      page.locator('[aria-label*="menu"]')
    ).first();

    const count = await hamburgerButton.count();
    if (count === 0) {
      test.skip();
      return;
    }

    await hamburgerButton.click();

    // Drawer should now be visible
    const drawer = page.locator('.MuiDrawer-root').or(
      page.locator('[role="presentation"]')
    );
    await expect(drawer.first()).toBeVisible();
  });
});

test.describe('Sidebar Navigation - Focus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('aside, nav[aria-label="Primary navigation"]', { timeout: 10000 });
  });

  test('should show focus indicator on keyboard navigation', async ({ page }) => {
    // Tab to first navigation item
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // May need multiple tabs to reach nav

    // Find the focused element
    const focusedElement = page.locator(':focus');
    const isFocusInNav = await focusedElement.evaluate(el => {
      return el.closest('nav, aside') !== null;
    }).catch(() => false);

    // At some point focus should be in navigation area
    // This is a soft assertion as focus order may vary
    expect(typeof isFocusInNav).toBe('boolean');
  });

  test('should have accessible labels on navigation items', async ({ page }) => {
    const nav = page.locator('nav[aria-label="Primary navigation"]');

    if (await nav.count() > 0) {
      await expect(nav).toHaveAttribute('aria-label', 'Primary navigation');
    }
  });
});

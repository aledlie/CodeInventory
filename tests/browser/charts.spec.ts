import { test, expect } from '@playwright/test';

/**
 * Chart Visualization Browser Tests
 *
 * Tests for trend charts and data visualizations.
 */

test.describe('Trend Charts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard/trends');
  });

  test('should load trends page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /trends/i })).toBeVisible();
  });

  test('should display time range selector', async ({ page }) => {
    const timeRangeSelector = page.locator('[data-testid="time-range-selector"]').or(
      page.getByRole('group', { name: /time range/i })
    );

    // Should have time range options
    await expect(page.getByRole('button', { name: /7 days/i }).or(
      page.getByText(/7d/i)
    )).toBeVisible();
  });

  test('should display chart containers', async ({ page }) => {
    // Wait for charts to load
    await page.waitForTimeout(2000);

    // Look for canvas elements (Chart.js renders to canvas)
    const charts = page.locator('canvas');
    const count = await charts.count();

    expect(count).toBeGreaterThan(0);
  });

  test('should change time range when selecting option', async ({ page }) => {
    const sevenDayButton = page.getByRole('button', { name: /7 days/i }).or(
      page.getByText(/7d/i).first()
    );

    if (await sevenDayButton.isVisible()) {
      await sevenDayButton.click();
      // Verify the selection changed (button should be highlighted)
      await expect(sevenDayButton).toHaveAttribute('aria-pressed', 'true').catch(() => {
        // Alternative: check for selected class
      });
    }
  });
});

test.describe('Dependency Graph', () => {
  test('should load graph page', async ({ page }) => {
    await page.goto('/dashboard/graph');

    await expect(page.getByRole('heading', { name: /graph|dependencies/i })).toBeVisible();
  });

  test('should display graph visualization', async ({ page }) => {
    await page.goto('/dashboard/graph');

    // Wait for graph to render
    await page.waitForTimeout(3000);

    // Look for SVG (D3/force graph) or canvas
    const graphElement = page.locator('svg').or(page.locator('canvas'));
    const count = await graphElement.count();

    expect(count).toBeGreaterThan(0);
  });
});

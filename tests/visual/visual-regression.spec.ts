/**
 * Visual Regression Tests for Compliance Scorecard
 * 
 * Uses Playwright's visual comparison capabilities to detect
 * unintended UI changes in critical compliance views.
 */

import { test, expect } from '@playwright/test';

test.describe('Visual Regression - Compliance Scorecard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard with scorecard
    await page.goto('/dashboard');
    
    // Wait for the page to fully load
    await page.waitForLoadState('networkidle');
  });

  test('dashboard scorecard renders correctly', async ({ page }) => {
    // Wait for scorecard component to be visible
    const scorecard = page.locator('[data-testid="compliance-scorecard"]');
    await expect(scorecard).toBeVisible({ timeout: 10000 });
    
    // Take a screenshot and compare
    await expect(page).toHaveScreenshot('dashboard-scorecard.png', {
      maxDiffPixelRatio: 0.02, // Allow 2% difference for anti-aliasing
      animations: 'disabled',
    });
  });

  test('scorecard with perfect score displays correctly', async ({ page }) => {
    // Navigate to a profile with 100% compliance
    await page.goto('/dashboard?demo=perfect-score');
    await page.waitForLoadState('networkidle');
    
    const scorecard = page.locator('[data-testid="compliance-scorecard"]');
    await expect(scorecard).toBeVisible();
    
    await expect(page).toHaveScreenshot('scorecard-perfect-score.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('scorecard with critical gaps displays correctly', async ({ page }) => {
    // Navigate to a profile with compliance gaps
    await page.goto('/dashboard?demo=critical-gaps');
    await page.waitForLoadState('networkidle');
    
    const scorecard = page.locator('[data-testid="compliance-scorecard"]');
    await expect(scorecard).toBeVisible();
    
    await expect(page).toHaveScreenshot('scorecard-critical-gaps.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('gap analysis view renders correctly', async ({ page }) => {
    await page.goto('/gap-analysis');
    await page.waitForLoadState('networkidle');
    
    // Wait for the gap analysis table to load
    const gapTable = page.locator('[data-testid="gap-analysis-table"]');
    await expect(gapTable).toBeVisible({ timeout: 10000 });
    
    await expect(page).toHaveScreenshot('gap-analysis-view.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('framework comparison chart renders correctly', async ({ page }) => {
    await page.goto('/frameworks/comparison');
    await page.waitForLoadState('networkidle');
    
    const chart = page.locator('[data-testid="framework-comparison-chart"]');
    await expect(chart).toBeVisible({ timeout: 10000 });
    
    await expect(page).toHaveScreenshot('framework-comparison.png', {
      maxDiffPixelRatio: 0.05, // Charts may have minor rendering differences
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Responsive Layout', () => {
  test('dashboard renders correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('dashboard renders correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});

test.describe('Visual Regression - Dark Mode', () => {
  test('scorecard renders correctly in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const scorecard = page.locator('[data-testid="compliance-scorecard"]');
    await expect(scorecard).toBeVisible();
    
    await expect(page).toHaveScreenshot('scorecard-dark-mode.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});

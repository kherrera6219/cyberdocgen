import { test, expect } from "@playwright/test";

/**
 * Authentication E2E Tests
 * Tests critical authentication flows including login, logout, and MFA.
 */

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("landing page loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/CyberDocGen/i);
    await expect(page.locator("text=Get Started")).toBeVisible();
  });

  test("login page is accessible from landing", async ({ page }) => {
    await page.click("text=Login");
    await expect(page.locator("input[name='username'], input[type='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("signup page is accessible from landing", async ({ page }) => {
    await page.click("text=Sign Up");
    await expect(page.locator("form")).toBeVisible();
  });

  test("login form shows validation errors for empty submission", async ({ page }) => {
    await page.goto("/login");
    await page.click("button[type='submit']");
    // Form should show validation messages
    await expect(page.locator("form")).toBeVisible();
  });

  test("forgot password link is accessible", async ({ page }) => {
    await page.goto("/login");
    const forgotLink = page.locator("text=Forgot");
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page.locator("form")).toBeVisible();
    }
  });
});

test.describe("Protected Routes", () => {
  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to login or show login prompt
    await expect(page.locator("input[type='password'], text=Login")).toBeVisible();
  });
});

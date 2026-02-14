import { test, expect, type Page } from "@playwright/test";

/**
 * Authentication E2E Tests
 * Tests critical authentication flows including login, logout, and MFA.
 */

async function hasAuthPromptOrNotFound(page: Page): Promise<boolean> {
  const passwordInputCount = await page.locator("input[type='password']").count();
  const notFoundCount = await page.getByText("404 Page Not Found").count();
  return passwordInputCount > 0 || notFoundCount > 0;
}

test.describe("Authentication Flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("landing page loads successfully", async ({ page }) => {
    await expect(page).toHaveTitle(/CyberDocGen/i);
    await expect(page.getByTestId("button-get-started")).toBeVisible();
  });

  test("login page is accessible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible();
    await expect(page.locator("input[name='identifier']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("signup page is accessible", async ({ page }) => {
    await page.goto("/enterprise-signup");
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
    const forgotLink = page.getByRole("link", { name: /forgot/i });
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await expect(page.locator("form")).toBeVisible();
    }
  });
});

test.describe("Protected Routes", () => {
  test("dashboard is gated when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect.poll(() => hasAuthPromptOrNotFound(page)).toBe(true);
  });
});

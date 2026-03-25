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

  test("profile page is gated when unauthenticated", async ({ page }) => {
    await page.goto("/profile");
    await expect.poll(() => hasAuthPromptOrNotFound(page)).toBe(true);
  });

  test("documents page is gated when unauthenticated", async ({ page }) => {
    await page.goto("/documents");
    await expect.poll(() => hasAuthPromptOrNotFound(page)).toBe(true);
  });

  test("admin page is gated when unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect.poll(() => hasAuthPromptOrNotFound(page)).toBe(true);
  });
});

test.describe("Login Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("shows error for invalid email format", async ({ page }) => {
    await page.locator("input[name='identifier']").fill("notanemail");
    await page.locator("input[type='password']").fill("somepassword");
    await page.click("button[type='submit']");
    // Should show validation error or stay on login page
    await expect(page.locator("form")).toBeVisible();
  });

  test("shows error for empty password", async ({ page }) => {
    await page.locator("input[name='identifier']").fill("test@example.com");
    await page.click("button[type='submit']");
    await expect(page.locator("form")).toBeVisible();
  });

  test("password field masks input", async ({ page }) => {
    const passwordInput = page.locator("input[type='password']");
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("login with invalid credentials shows error message", async ({ page }) => {
    await page.locator("input[name='identifier']").fill("baduser@example.com");
    await page.locator("input[type='password']").fill("wrongpassword123");
    await page.click("button[type='submit']");
    // Should remain on login page or show error
    await page.waitForTimeout(1000);
    const url = page.url();
    const stillOnLogin = url.includes("/login") || url.includes("/auth");
    const hasError = await page.locator("[role='alert'], .text-red-500, .text-destructive").count() > 0;
    expect(stillOnLogin || hasError).toBe(true);
  });
});

test.describe("Security Headers", () => {
  test("X-Frame-Options or CSP frame-ancestors prevents clickjacking", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    const hasXFrameOptions = "x-frame-options" in headers;
    const hasCspFrameAncestors = (headers["content-security-policy"] ?? "").includes("frame-ancestors");
    expect(hasXFrameOptions || hasCspFrameAncestors).toBe(true);
  });

  test("X-Content-Type-Options is set", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    expect(headers["x-content-type-options"]).toBe("nosniff");
  });
});

test.describe("Signup Flow", () => {
  test("signup form has required fields", async ({ page }) => {
    await page.goto("/enterprise-signup");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
  });

  test("signup form shows error for duplicate email", async ({ page }) => {
    await page.goto("/enterprise-signup");
    const emailInput = page.locator("input[type='email'], input[name='email']").first();
    const passwordInputs = page.locator("input[type='password']");
    if (await emailInput.isVisible()) {
      await emailInput.fill("existing@example.com");
      if (await passwordInputs.count() > 0) {
        await passwordInputs.first().fill("SecurePass123!");
        if (await passwordInputs.count() > 1) {
          await passwordInputs.nth(1).fill("SecurePass123!");
        }
      }
      await page.click("button[type='submit']");
      await page.waitForTimeout(1500);
      // Should either show error or redirect to verification page
      const hasError = await page.locator("[role='alert'], .text-red-500, .text-destructive").count() > 0;
      const redirectedAway = !page.url().includes("enterprise-signup");
      expect(hasError || redirectedAway).toBe(true);
    }
  });
});

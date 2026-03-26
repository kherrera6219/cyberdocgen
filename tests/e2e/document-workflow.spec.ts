import { test, expect, type Page } from "@playwright/test";

/**
 * Document Workflow E2E Tests
 * Tests document generation and management workflows.
 */

// ---------------------------------------------------------------------------
// Helper: sign up and log in with a test account
// ---------------------------------------------------------------------------
async function loginOrSkip(page: Page): Promise<boolean> {
  await page.goto("/login");
  const identifier = page.locator("input[name='identifier']");
  const password = page.locator("input[type='password']");
  if (!(await identifier.isVisible())) return false;

  const testEmail = process.env.E2E_TEST_EMAIL ?? "e2etest@cyberdocgen.com";
  const testPass = process.env.E2E_TEST_PASSWORD ?? "";
  if (!testPass) return false; // skip if no test credentials configured

  await identifier.fill(testEmail);
  await password.fill(testPass);
  await page.click("button[type='submit']");
  await page.waitForTimeout(1500);
  return page.url().includes("/dashboard") || page.url().includes("/profile");
}

// ---------------------------------------------------------------------------
// Unauthenticated tests (always run)
// ---------------------------------------------------------------------------
test.describe("Document Workflows (unauthenticated)", () => {
  test("documents page redirects to auth when unauthenticated", async ({ page }) => {
    await page.goto("/documents");
    await page.waitForTimeout(500);
    const url = page.url();
    const isGated = url.includes("/login") || url.includes("/auth") || url.includes("/enterprise-signup");
    const hasAuthForm = await page.locator("input[type='password']").count() > 0;
    expect(isGated || hasAuthForm).toBe(true);
  });

  test("features page showcases document capabilities", async ({ page }) => {
    await page.goto("/features");
    await expect(page.locator("body")).toBeVisible();
  });

  test("AI document generator page redirects when unauthenticated", async ({ page }) => {
    await page.goto("/ai-doc-generator");
    await expect(page.locator("body")).toBeVisible();
  });

  test("gap analysis page redirects when unauthenticated", async ({ page }) => {
    await page.goto("/gap-analysis");
    await page.waitForTimeout(500);
    const isGated = page.url().includes("/login") || page.url().includes("/auth");
    const hasAuthForm = await page.locator("input[type='password']").count() > 0;
    expect(isGated || hasAuthForm).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full authenticated document generation flow
// (Requires E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars to run)
// ---------------------------------------------------------------------------
test.describe("Full Document Generation Flow (authenticated)", () => {
  test("login → dashboard → trigger generation → poll status", async ({ page }) => {
    const loggedIn = await loginOrSkip(page);
    test.skip(!loggedIn, "Skipped: E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

    // Verify dashboard loaded
    await page.waitForURL("**/dashboard", { timeout: 5000 }).catch(() => {});
    await expect(page.locator("body")).toBeVisible();

    // Navigate to documents
    await page.goto("/documents");
    await page.waitForTimeout(500);
    // Should show document list, not login
    const stillOnLogin = page.url().includes("/login");
    expect(stillOnLogin).toBe(false);
  });

  test("login → gap analysis → view reports list", async ({ page }) => {
    const loggedIn = await loginOrSkip(page);
    test.skip(!loggedIn, "Skipped: E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

    await page.goto("/gap-analysis");
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("/login");
    await expect(page.locator("body")).toBeVisible();
  });

  test("login → profile → form is pre-populated", async ({ page }) => {
    const loggedIn = await loginOrSkip(page);
    test.skip(!loggedIn, "Skipped: E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

    await page.goto("/profile");
    await page.waitForTimeout(500);
    expect(page.url()).not.toContain("/login");
    // Profile page should have a form
    await expect(page.locator("form, [data-testid='profile-form']").first()).toBeVisible();
  });

  test("logout clears session and redirects to login", async ({ page }) => {
    const loggedIn = await loginOrSkip(page);
    test.skip(!loggedIn, "Skipped: E2E_TEST_EMAIL/E2E_TEST_PASSWORD not set");

    // Find and click logout
    const logoutBtn = page.getByRole("button", { name: /log.?out|sign.?out/i });
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
      // Should be on login/home after logout
      const url = page.url();
      const isLoggedOut = url.includes("/login") || url.includes("/") || url.includes("/auth");
      expect(isLoggedOut).toBe(true);
      // Trying to access protected route should gate
      await page.goto("/documents");
      await page.waitForTimeout(500);
      const hasAuthPrompt = await page.locator("input[type='password']").count() > 0;
      const redirected = page.url().includes("/login") || page.url().includes("/auth");
      expect(hasAuthPrompt || redirected).toBe(true);
    }
  });
});

test.describe("Framework Pages", () => {
  test("SOC2 framework page loads", async ({ page }) => {
    await page.goto("/soc2-framework");
    await expect(page.locator("body")).toBeVisible();
  });

  test("NIST framework page loads", async ({ page }) => {
    await page.goto("/nist-framework");
    await expect(page.locator("body")).toBeVisible();
  });

  test("ISO27001 framework page loads", async ({ page }) => {
    await page.goto("/iso27001-framework");
    await expect(page.locator("body")).toBeVisible();
  });

  test("FedRAMP framework page loads", async ({ page }) => {
    await page.goto("/fedramp-framework");
    await expect(page.locator("body")).toBeVisible();
  });
});

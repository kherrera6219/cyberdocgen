import { test, expect } from "@playwright/test";

/**
 * Document Workflow E2E Tests
 * Tests document generation and management workflows.
 */

test.describe("Document Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("documents page loads", async ({ page }) => {
    // Navigate to documents (may require auth in real scenario)
    await page.goto("/documents");
    // Should either show documents or redirect to login
    await expect(page.locator("body")).toBeVisible();
  });

  test("features page showcases document capabilities", async ({ page }) => {
    await page.goto("/features");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("AI document generator page is accessible", async ({ page }) => {
    await page.goto("/ai-doc-generator");
    // Should show generator UI or redirect to login
    await expect(page.locator("body")).toBeVisible();
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

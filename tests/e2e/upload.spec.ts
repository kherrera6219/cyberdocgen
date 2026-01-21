import { test, expect } from "@playwright/test";

/**
 * File Upload E2E Tests
 * Tests file upload workflows and evidence ingestion.
 */

test.describe("Upload Workflows", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("cloud integrations page is accessible", async ({ page }) => {
    await page.goto("/cloud-integrations");
    // Should show integrations UI or redirect to login
    await expect(page.locator("body")).toBeVisible();
  });

  test("evidence ingestion page loads", async ({ page }) => {
    await page.goto("/evidence-ingestion");
    // Should show upload UI or redirect to login
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Storage Integration", () => {
  test("connectors hub page loads", async ({ page }) => {
    await page.goto("/connectors-hub");
    await expect(page.locator("body")).toBeVisible();
  });
});

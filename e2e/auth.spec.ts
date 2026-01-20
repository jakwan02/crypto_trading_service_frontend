import { test, expect } from "@playwright/test";

const email = process.env.E2E_USER_EMAIL || "";
const password = process.env.E2E_USER_PASSWORD || "";

test.describe("auth", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("login flow (optional)", async ({ page }) => {
    test.skip(!email || !password, "E2E_USER_EMAIL/E2E_USER_PASSWORD not set");
    await page.goto("/login");
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(market|)$/);
  });
});


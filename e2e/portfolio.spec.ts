import { test, expect } from "@playwright/test";

test.describe("portfolio", () => {
  test("portfolio route is reachable", async ({ page }) => {
    await page.goto("/portfolio");
    await expect(page.locator("main")).toBeVisible();
  });
});


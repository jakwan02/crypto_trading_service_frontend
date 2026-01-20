import { test, expect } from "@playwright/test";

test.describe("alerts", () => {
  test("alerts route is reachable", async ({ page }) => {
    await page.goto("/alerts");
    await expect(page.locator("main")).toBeVisible();
  });
});


import { test, expect } from "@playwright/test";

test.describe("watchlists", () => {
  test("watchlists route is reachable", async ({ page }) => {
    await page.goto("/watchlists");
    await expect(page.locator("main")).toBeVisible();
  });
});


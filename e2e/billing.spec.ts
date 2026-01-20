import { test, expect } from "@playwright/test";

test.describe("billing", () => {
  test("upgrade page renders", async ({ page }) => {
    await page.goto("/upgrade");
    await expect(page.locator("h1")).toBeVisible();
  });
});


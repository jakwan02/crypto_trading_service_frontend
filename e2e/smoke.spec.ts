import { test, expect } from "@playwright/test";

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /CoinDash/ })).toBeVisible();
});

test("search page loads", async ({ page }) => {
  await page.goto("/search");
  await expect(page.locator("h1")).toContainText(/Search|검색/);
});

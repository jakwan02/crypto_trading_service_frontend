import { test, expect, type APIRequestContext } from "@playwright/test";

const FULL = String(process.env.E2E_FULL || "").trim() === "1";
const MAILHOG_BASE = String(process.env.E2E_MAILHOG_BASE_URL || "http://127.0.0.1:18025").trim().replace(/\/+$/, "");

function randEmail(): string {
  const stamp = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `e2e+${stamp}@example.local`;
}

function strongPassword(): string {
  return `E2E-Pass-${Date.now()}-Aa0!`;
}

async function waitForVerificationToken(request: APIRequestContext, toEmail: string): Promise<string> {
  const deadline = Date.now() + 60_000;
  const target = String(toEmail || "").trim().toLowerCase();
  if (!target) throw new Error("missing_to_email");

  while (Date.now() < deadline) {
    const res = await request.get(`${MAILHOG_BASE}/api/v2/messages`);
    if (res.ok()) {
      const payload = (await res.json().catch(() => null)) as any;
      const items: any[] = Array.isArray(payload?.items) ? payload.items : [];

      for (const it of items) {
        const headers = it?.Content?.Headers || {};
        const toList: string[] = Array.isArray(headers?.To) ? headers.To : [];
        const to = toList.map((x) => String(x || "").toLowerCase()).join(",");
        if (!to.includes(target)) continue;

        const body = String(it?.Content?.Body || "");
        const match =
          body.match(/token=([A-Za-z0-9._-]+)/) ||
          body.match(/인증 토큰:\s*([A-Za-z0-9._-]+)/) ||
          body.match(/verification token:\s*([A-Za-z0-9._-]+)/i);
        if (match?.[1]) return match[1];
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error("mailhog_token_timeout");
}

test.describe("week6-e2e-fullflow", () => {
  test.describe.configure({ mode: "serial" });

  test("signup -> email verify -> login -> upgrade(mock) -> cancel -> watchlist/share -> alerts -> portfolio", async ({
    page,
    request
  }) => {
    test.skip(!FULL, "E2E_FULL=1 환경에서만 실행");

    const email = randEmail();
    const password = strongPassword();

    await page.goto("/signup");
    await page.getByTestId("signup-email").fill(email);
    await page.getByTestId("signup-password").fill(password);
    await page.getByTestId("signup-password-confirm").fill(password);
    await page.getByTestId("signup-submit").click();
    await page.waitForURL(/\/verify-email/);

    const token = await waitForVerificationToken(request, email);
    await page.goto(`/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&next=/market`);
    await page.waitForURL(/\/login/);

    await page.getByTestId("login-email").fill(email);
    await page.getByTestId("login-password").fill(password);
    await page.getByTestId("login-submit").click();
    await page.waitForURL(/\/market/);

    await page.goto("/upgrade");
    await page.getByRole("button", { name: "MOCK" }).click();
    await page.getByTestId("upgrade-checkout").click();
    await page.waitForURL(/\/app\/billing\/dev\/mock\//);

    await page.locator("#btn-ok").click();
    await expect(page.locator("#out")).toContainText("paid", { timeout: 20_000 });

    await page.goto("/billing");
    await expect(page.getByTestId("billing-plan")).toHaveText("PRO", { timeout: 30_000 });
    await expect(page.getByTestId("billing-subscription")).toHaveAttribute("data-sub-provider", "mock");
    await expect(page.getByTestId("billing-subscription")).toHaveAttribute("data-sub-status", "active");

    await page.getByTestId("billing-cancel").click();
    await expect(page.getByTestId("billing-subscription")).toHaveAttribute("data-sub-status", "cancel_at_period_end", {
      timeout: 30_000
    });

    await page.goto("/watchlists");
    await page.getByTestId("watchlists-create-name").fill("E2E WL");
    await page.getByTestId("watchlists-create-submit").click();
    await page.getByTestId("watchlists-add-symbol").fill("BTCUSDT");
    await page.getByTestId("watchlists-add-submit").click();
    await page.getByTestId("watchlists-share").click();
    const shareUrl = await page.getByTestId("watchlists-share-url").inputValue();
    expect(shareUrl).toContain("/watchlists/shared/");
    await page.goto(shareUrl);
    await expect(page.locator("main")).toBeVisible();

    await page.goto("/alerts");
    await page.getByTestId("alerts-create").click();
    await expect(page.getByTestId("alerts-rules")).toContainText("BTCUSDT", { timeout: 30_000 });

    await page.goto("/portfolio");
    await page.getByTestId("portfolio-create-tx").click();
    await expect(page.getByTestId("portfolio-tx-history")).toContainText("BTCUSDT", { timeout: 30_000 });
  });
});

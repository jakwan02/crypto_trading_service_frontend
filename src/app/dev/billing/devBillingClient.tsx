"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import type { BillingCurrency, BillingSkuKind } from "@/types/billing";

type DevCheckoutRes = {
  order_no?: string;
  redirect_url?: string;
  checkout_url?: string;
  provider?: string;
  expires_at?: string;
};

type AnyObj = Record<string, unknown>;

function isObj(v: unknown): v is AnyObj {
  return typeof v === "object" && v !== null;
}

function pickStr(obj: AnyObj | null, key: string): string | undefined {
  const v = obj?.[key];
  return typeof v === "string" ? v : undefined;
}

async function postDevCheckout(body: Record<string, unknown>): Promise<DevCheckoutRes> {
  const res = await fetch("/api/dev/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const raw: unknown = await res.json().catch(() => null);
  const js = isObj(raw) ? raw : null;
  if (!res.ok) {
    const err = new Error(pickStr(js, "message") || pickStr(js, "code") || `dev_checkout_${res.status}`) as Error & {
      status?: number;
      code?: string;
      payload?: unknown;
    };
    err.status = res.status;
    err.code = pickStr(js, "code") || String(res.status);
    err.payload = raw ?? undefined;
    throw err;
  }
  return {
    order_no: pickStr(js, "order_no"),
    redirect_url: pickStr(js, "redirect_url"),
    checkout_url: pickStr(js, "checkout_url"),
    provider: pickStr(js, "provider"),
    expires_at: pickStr(js, "expires_at")
  };
}

export default function DevBillingClient() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<BillingSkuKind>("sub");
  const [currency, setCurrency] = useState<BillingCurrency>("USD");
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  const allowedCurrencies = useMemo(() => (kind === "sub" ? (["USD"] as BillingCurrency[]) : ["KRW", "USD", "JPY", "EUR"]), [kind]);

  const start = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await postDevCheckout({
        plan_code: "pro",
        kind,
        currency,
        return_path: "/billing/return",
        cancel_path: "/billing/return?cancel=1"
      });
      const url = String(res.redirect_url || res.checkout_url || "").trim();
      if (!url) throw new Error("missing_redirect_url");
      window.location.assign(url);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [currency, kind]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("devBilling.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("devBilling.desc")}</p>
        </header>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("devBilling.kind")}</label>
              <div className="mt-2 inline-flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-semibold text-gray-600">
                <button
                  type="button"
                  onClick={() => setKind("sub")}
                  className={`w-full rounded-full px-3 py-2 ${
                    kind === "sub" ? "bg-primary text-ink" : "hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  sub
                </button>
                <button
                  type="button"
                  onClick={() => setKind("pass30")}
                  className={`w-full rounded-full px-3 py-2 ${
                    kind === "pass30" ? "bg-primary text-ink" : "hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  pass30
                </button>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("devBilling.currency")}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as BillingCurrency)}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              >
                {allowedCurrencies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {kind === "sub" ? <p className="mt-1 text-xs text-gray-500">{t("devBilling.subUsdOnly")}</p> : null}
            </div>
          </div>

          <button
            type="button"
            onClick={start}
            disabled={loading}
            className="mt-5 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-500"
          >
            {loading ? "..." : t("devBilling.start")}
          </button>

          {error ? (
            <div className="mt-4">
              <ApiErrorView error={error} onRetry={start} />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

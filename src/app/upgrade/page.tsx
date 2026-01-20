"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { useQuery } from "@tanstack/react-query";
import ApiErrorView from "@/components/common/ApiErrorView";
import PlanCard from "@/components/billing/PlanCard";
import CurrencySelect from "@/components/billing/CurrencySelect";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { createCheckout, getPlans } from "@/lib/billingClient";
import type { BillingCurrency, BillingProvider, BillingSkuKind, Plan } from "@/types/billing";

function readParam(name: string): string {
  if (typeof window === "undefined") return "";
  try {
    return String(new URLSearchParams(window.location.search || "").get(name) || "").trim();
  } catch {
    return "";
  }
}

export default function UpgradePage() {
  const router = useRouter();
  const { user, isPro, sessionReady } = useAuth();
  const ccyDefault = useSymbolsStore((s) => s.ccyDefault);
  const { t } = useTranslation();
  const [kind, setKind] = useState<BillingSkuKind>("sub");
  const [currency, setCurrency] = useState<BillingCurrency>(ccyDefault);
  const [provider, setProvider] = useState<BillingProvider>("paypal");
  const [coupon, setCoupon] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const plansQuery = useQuery({
    queryKey: ["billingPlans"],
    queryFn: getPlans,
    staleTime: 60_000
  });

  const plans = plansQuery.data?.plans ?? [];
  const planFree = useMemo(() => plans.find((p) => p.code === "free") || null, [plans]);
  const planPro = useMemo(() => plans.find((p) => p.code === "pro") || null, [plans]);
  const selectedPlan = planPro || planFree;

  // 변경 이유: deep link(/upgrade?kind=pass30)에서 초기 kind를 반영
  useEffect(() => {
    const raw = readParam("kind").toLowerCase();
    if (raw === "sub" || raw === "pass30") setKind(raw as BillingSkuKind);
  }, []);

  // 변경 이유: 통화는 계정 기본값(store)을 우선 반영하되, sub(paypal)는 USD로 고정
  useEffect(() => {
    setCurrency(ccyDefault);
  }, [ccyDefault]);

  const availableProviders = useMemo(() => {
    const skus = (selectedPlan?.sku ?? []).filter((s) => s && s.is_active !== false);
    const list = skus.filter((s) => String(s.kind || "").toLowerCase() === kind).map((s) => s.provider);
    const uniq = Array.from(new Set(list.filter(Boolean))) as BillingProvider[];
    if (uniq.length) return uniq;
    // fallback (서버 SKU 미노출 대비)
    return kind === "sub" ? (["paypal"] as BillingProvider[]) : (["eximbay"] as BillingProvider[]);
  }, [kind, selectedPlan?.sku]);

  useEffect(() => {
    if (!availableProviders.length) return;
    if (availableProviders.includes(provider)) return;
    setProvider(availableProviders[0]);
  }, [availableProviders, provider]);

  const billingCurrency = useMemo(() => {
    // 변경 이유: PayPal 구독은 USD만 허용(서버 정책과 일치)
    if (kind === "sub") return "USD" as BillingCurrency;
    return currency;
  }, [currency, kind]);

  const startCheckout = useCallback(async () => {
    setError(null);
    if (!sessionReady) return;
    if (!user) {
      const next = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/upgrade";
      router.push(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    const planCode = String(selectedPlan?.code || "pro").toLowerCase();
    if (planCode !== "pro") {
      setError(new Error("invalid_plan"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCheckout({
        plan_code: "pro",
        kind,
        provider,
        currency: billingCurrency,
        coupon: coupon.trim() || undefined,
        return_path: "/billing/return",
        cancel_path: "/billing/return?cancel=1"
      });
      const url = String(res.redirect_url || res.checkout_url || "").trim();
      if (!url) throw new Error("missing_redirect_url");
      window.location.assign(url);
    } catch (e) {
      setError(e);
    } finally {
      setIsSubmitting(false);
    }
  }, [billingCurrency, coupon, kind, provider, router, selectedPlan?.code, sessionReady, user]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("upgrade.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("upgrade.desc")}</p>
        </header>

        {plansQuery.isError ? (
          <ApiErrorView error={plansQuery.error} onRetry={() => plansQuery.refetch()} />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="grid gap-4">
            {planFree ? (
              <PlanCard plan={planFree} selected={selectedPlan?.code === "free"} current={!isPro} onSelect={() => {}} />
            ) : null}
            {planPro ? (
              <PlanCard plan={planPro} selected={selectedPlan?.code === "pro"} current={isPro} onSelect={() => {}} />
            ) : null}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t("upgrade.payTitle")}</h2>

            <div className="mt-4 space-y-4">
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-gray-600">{t("upgrade.kind")}</label>
                <div className="inline-flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1 text-xs font-semibold text-gray-600">
                  <button
                    type="button"
                    onClick={() => setKind("sub")}
                    className={`w-full rounded-full px-3 py-2 ${
                      kind === "sub" ? "bg-primary text-ink" : "hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {t("upgrade.kindSub")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setKind("pass30")}
                    className={`w-full rounded-full px-3 py-2 ${
                      kind === "pass30" ? "bg-primary text-ink" : "hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {t("upgrade.kindPass30")}
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-gray-600">{t("upgrade.currency")}</label>
                <CurrencySelect
                  value={billingCurrency}
                  onChange={setCurrency}
                  disabled={kind === "sub"}
                  allowed={kind === "sub" ? (["USD"] as BillingCurrency[]) : undefined}
                />
                {kind === "sub" ? (
                  <p className="text-xs text-gray-500">{t("upgrade.currencySubNote")}</p>
                ) : (
                  <p className="text-xs text-gray-500">{t("upgrade.currencyNote")}</p>
                )}
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-gray-600">{t("upgrade.provider")}</label>
                <div className="flex flex-wrap gap-2">
                  {availableProviders.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                        provider === p
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-gray-200 bg-white text-gray-600 hover:border-primary/30 hover:text-primary"
                      }`}
                    >
                      {String(p).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-xs font-semibold text-gray-600">{t("upgrade.coupon")}</label>
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder={t("upgrade.couponPlaceholder")}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>

              <CheckoutButton label={t("upgrade.cta")} onClick={startCheckout} loading={isSubmitting} testId="upgrade-checkout" />

              {error ? (
                <div className="mt-3">
                  <ApiErrorView
                    error={error}
                    onRetry={startCheckout}
                    onGoBilling={() => router.push("/billing")}
                    onUpgrade={() => router.push("/upgrade")}
                  />
                </div>
              ) : null}

              {isPro ? <p className="text-xs text-emerald-600">{t("upgrade.active")}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

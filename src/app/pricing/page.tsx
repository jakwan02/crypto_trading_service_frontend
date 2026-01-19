"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { useAuth } from "@/contexts/AuthContext";
import { getPlans } from "@/lib/billingClient";

export default function PricingPage() {
  const { t } = useTranslation();
  const { user, plan } = useAuth();
  const plansQ = useQuery({ queryKey: ["billing.plans"], queryFn: getPlans });

  const items = plansQ.data?.plans ?? [];

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("pricing.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("pricing.desc")}</p>
        </header>

        {plansQ.isError ? (
          <div className="max-w-2xl">
            <ApiErrorView error={plansQ.error} onRetry={() => plansQ.refetch()} />
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {items.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
              {plansQ.isLoading ? t("common.loading") : t("pricing.empty")}
            </div>
          ) : (
            items.map((p) => {
              const code = String(p.code || "");
              const name = String(p.name || code || "-");
              const sku = (p.sku ?? []).find((s) => s && s.is_active !== false) || null;
              const priceUsd = typeof sku?.price_usd_cents === "number" ? sku.price_usd_cents / 100 : null;
              const isCurrent = String(plan?.code || "").toLowerCase() === code.toLowerCase();
              return (
                <div key={code} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
                      <p className="mt-1 text-sm text-gray-500">{t("pricing.cardSub")}</p>
                    </div>
                    {isCurrent ? (
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {t("pricing.current")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-xs text-gray-500">{t("pricing.price")}</p>
                    <p className="mt-2 text-2xl font-semibold text-gray-900">
                      {priceUsd != null ? (
                        <>
                          ${priceUsd.toFixed(2)} <span className="text-sm font-medium text-gray-500">USD</span>
                        </>
                      ) : (
                        "-"
                      )}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{t("pricing.billingCycle")}</p>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {!user ? (
                      <Link
                        href={`/signup?next=${encodeURIComponent("/pricing")}`}
                        className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
                      >
                        {t("pricing.ctaStartFree")}
                      </Link>
                    ) : (
                      <Link
                        href="/upgrade"
                        className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
                      >
                        {t("pricing.ctaUpgrade")}
                      </Link>
                    )}
                    <Link
                      href="/billing"
                      className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                    >
                      {t("pricing.ctaGoBilling")}
                    </Link>
                  </div>

                  <div className="mt-4 text-xs text-gray-500">
                    <p>
                      <Link href="/terms" className="font-semibold text-primary hover:underline">
                        {t("pricing.terms")}
                      </Link>
                      {" · "}
                      <Link href="/privacy" className="font-semibold text-primary hover:underline">
                        {t("pricing.privacy")}
                      </Link>
                      {" · "}
                      <Link href="/support" className="font-semibold text-primary hover:underline">
                        {t("pricing.support")}
                      </Link>
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

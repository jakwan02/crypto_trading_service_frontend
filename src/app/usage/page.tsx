"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import { getPlans } from "@/lib/billingClient";
import type { UsageMe } from "@/types/usage";
import { useTranslation } from "react-i18next";

function getAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

async function fetchUsageMe(): Promise<UsageMe> {
  return await apiRequest<UsageMe>("/usage/me", { method: "GET", headers: getAuthHeaders() });
}

function pct(n: number, d: number): number {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0;
  return Math.max(0, Math.min(100, (n / d) * 100));
}

function entInt(ent: unknown, path: string[]): number | null {
  let cur: unknown = ent;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  const x = Number(cur);
  return Number.isFinite(x) ? x : null;
}

export default function UsagePage() {
  const { t } = useTranslation();

  const usageQuery = useQuery({
    queryKey: ["usageMe"],
    queryFn: fetchUsageMe,
    staleTime: 5_000
  });

  const plansQuery = useQuery({
    queryKey: ["billingPlans"],
    queryFn: getPlans,
    staleTime: 60_000
  });

  const planCode = String(usageQuery.data?.plan || "").trim().toLowerCase();
  const planEnt = useMemo(() => {
    const plans = plansQuery.data?.plans ?? [];
    const found = plans.find((p) => String(p.code || "").trim().toLowerCase() === planCode);
    return found?.ent ?? {};
  }, [planCode, plansQuery.data?.plans]);

  const callsToday = Number(usageQuery.data?.today?.api_calls ?? usageQuery.data?.today?.calls_today ?? 0);
  const callsLimit =
    Number(usageQuery.data?.today?.limit ?? usageQuery.data?.limits?.api?.calls_per_day ?? 0) || 0;
  const callsPct = pct(callsToday, callsLimit);

  const rpmLimit = Number(usageQuery.data?.limits?.api?.rpm ?? 0) || 0;
  const rpmUsed = Number(usageQuery.data?.limits?.api?.rpm_used ?? 0) || 0;
  const hasRpmUsed = Number.isFinite(rpmUsed) && rpmUsed > 0;
  const rpmPct = pct(rpmUsed, rpmLimit);

  const shouldUpsell = planCode === "free" || callsPct >= 80 || (hasRpmUsed && rpmPct >= 80);

  const entRows = useMemo(() => {
    const rows: Array<{ label: string; value: string }> = [];
    const maxLists = entInt(planEnt, ["watchlists", "max_lists"]);
    const maxItems = entInt(planEnt, ["watchlists", "max_items_per_list"]);
    const maxAlerts = entInt(planEnt, ["alerts", "max_rules"]);
    const maxHistory = entInt(planEnt, ["history", "max_days"]);

    rows.push({ label: "watchlists.max_lists", value: maxLists === null ? "-" : String(maxLists) });
    rows.push({ label: "watchlists.max_items_per_list", value: maxItems === null ? "-" : String(maxItems) });
    rows.push({ label: "alerts.max_rules", value: maxAlerts === null ? "-" : String(maxAlerts) });
    rows.push({ label: "history.max_days", value: maxHistory === null ? "-" : String(maxHistory) });
    return rows;
  }, [planEnt]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("usage.title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("usage.desc")}</p>
            </div>
            {shouldUpsell ? (
              <Link
                href="/upgrade"
                className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
              >
                {t("common.proUpgrade")}
              </Link>
            ) : null}
          </header>

          {usageQuery.isLoading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : usageQuery.isError ? (
            <ApiErrorView error={usageQuery.error} onRetry={() => usageQuery.refetch()} />
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">{t("usage.plan")}</h2>
                  <p className="mt-3 text-2xl font-semibold text-gray-900">{(planCode || "-").toUpperCase()}</p>
                  <p className="mt-1 text-xs text-gray-500">{t("usage.planHint")}</p>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">{t("usage.callsToday")}</h2>
                  <p className="mt-3 text-2xl font-semibold text-gray-900">
                    {callsToday} / {callsLimit || "-"}
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-primary" style={{ width: `${callsPct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{t("usage.callsTodayHint")}</p>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">{t("usage.rpm")}</h2>
                  <p className="mt-3 text-2xl font-semibold text-gray-900">
                    {hasRpmUsed ? `${rpmUsed} / ${rpmLimit || "-"}` : `${rpmLimit || "-"}`
                    }
                  </p>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-primary" style={{ width: `${hasRpmUsed ? rpmPct : 0}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {hasRpmUsed ? t("usage.rpmHint") : t("usage.rpmHintNoUsed")}
                  </p>
                </section>
              </div>

              <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">{t("usage.entitlements")}</h2>
                  <Link href="/billing" className="text-xs font-semibold text-primary">
                    {t("billing.goBilling")}
                  </Link>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {entRows.map((row) => (
                    <div key={row.label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-600">{row.label}</p>
                      <p className="mt-2 text-lg font-semibold text-gray-900">{row.value}</p>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}


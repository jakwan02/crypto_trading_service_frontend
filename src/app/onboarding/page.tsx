"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { createAlertRule } from "@/lib/alertsClient";
import { patchOnboarding, getOnboarding } from "@/lib/onboardingClient";
import { addWatchlistItem, createWatchlist } from "@/lib/watchlistsClient";

function parseSymbols(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 20);
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const stateQ = useQuery({ queryKey: ["onboarding"], queryFn: getOnboarding });

  const [market, setMarket] = useState("spot");
  const [symbolsText, setSymbolsText] = useState("BTCUSDT,ETHUSDT");

  const symbols = useMemo(() => parseSymbols(symbolsText), [symbolsText]);

  const saveStepM = useMutation({
    mutationFn: async (step: Record<string, unknown>) => await patchOnboarding({ step }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["onboarding"] });
    }
  });

  const createWatchlistM = useMutation({
    mutationFn: async () => {
      const res = await createWatchlist({ name: "Watchlist", tags: [], is_public: false });
      const wid = String(res.id || "");
      if (!wid) throw new Error("watchlist_create_failed");
      for (const sym of symbols) {
        await addWatchlistItem(wid, { market, symbol: sym });
      }
      await saveStepM.mutateAsync({ market, symbols, watchlist_id: wid, watchlist_created: true });
      return wid;
    }
  });

  const createAlertM = useMutation({
    mutationFn: async () => {
      const sym = symbols[0];
      if (!sym) throw new Error("no_symbol");
      await createAlertRule({
        market,
        symbol: sym,
        type: "pct",
        window: "1d",
        op: "gt",
        value: 5,
        repeat: "once",
        channels: { email: true },
        is_active: true
      });
      await saveStepM.mutateAsync({ alert_created: true, alert_symbol: sym });
      return true;
    }
  });

  const completeM = useMutation({
    mutationFn: async () => await patchOnboarding({ completed: true }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["onboarding"] });
    }
  });

  const step = (stateQ.data?.state?.step ?? {}) as Record<string, unknown>;
  const watchlistCreated = Boolean(step.watchlist_created);
  const alertCreated = Boolean(step.alert_created);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("onboarding.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("onboarding.desc")}</p>
          </header>

          {stateQ.isError ? <ApiErrorView error={stateQ.error} onRetry={() => stateQ.refetch()} /> : null}

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("onboarding.step1")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("onboarding.market")}</label>
                <select value={market} onChange={(e) => setMarket(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                  <option value="spot">spot</option>
                  <option value="um">um</option>
                  <option value="cm">cm</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("onboarding.symbols")}</label>
                <input value={symbolsText} onChange={(e) => setSymbolsText(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">{t("onboarding.symbolHint")}</p>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("onboarding.step2")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("onboarding.step2Desc")}</p>
            {createWatchlistM.isError ? <div className="mt-3"><ApiErrorView error={createWatchlistM.error} /></div> : null}
            <button
              type="button"
              disabled={watchlistCreated || createWatchlistM.isPending || symbols.length === 0}
              onClick={() => createWatchlistM.mutate()}
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
            >
              {watchlistCreated ? t("onboarding.done") : t("onboarding.createWatchlist")}
            </button>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("onboarding.step3")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("onboarding.step3Desc")}</p>
            {createAlertM.isError ? <div className="mt-3"><ApiErrorView error={createAlertM.error} /></div> : null}
            <button
              type="button"
              disabled={!watchlistCreated || alertCreated || createAlertM.isPending || symbols.length === 0}
              onClick={() => createAlertM.mutate()}
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
            >
              {alertCreated ? t("onboarding.done") : t("onboarding.createAlert")}
            </button>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("onboarding.finish")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("onboarding.finishDesc")}</p>
            {completeM.isError ? <div className="mt-3"><ApiErrorView error={completeM.error} /></div> : null}
            <button
              type="button"
              disabled={completeM.isPending || !watchlistCreated || !alertCreated}
              onClick={() => completeM.mutate()}
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
            >
              {t("onboarding.complete")}
            </button>
          </section>
        </div>
      </main>
    </RequireAuth>
  );
}

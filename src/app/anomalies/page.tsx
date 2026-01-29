"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { useAuth } from "@/contexts/AuthContext";
import { getAnomaliesLatest } from "@/lib/insightsClient";
import { patchOnboarding } from "@/lib/onboardingClient";
import type { AnomalyKind, AnomalyWindow, InsightMarket } from "@/types/insights";

const KINDS: AnomalyKind[] = ["volume", "volatility", "liquidity"];
const WINDOWS: AnomalyWindow[] = ["1h", "4h", "1d"];
const MARKETS: Array<{ id: InsightMarket; labelKey: string }> = [
  { id: "um", labelKey: "common.marketUm" },
  { id: "spot", labelKey: "common.marketSpot" }
];

function fmtNum(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "-";
  return x.toFixed(digits);
}

function fmtCompact(x: number): string {
  if (!Number.isFinite(x)) return "-";
  try {
    return x.toLocaleString(undefined, { maximumFractionDigits: 0 });
  } catch {
    return String(x);
  }
}

export default function AnomaliesPage() {
  const { t } = useTranslation();
  const { user, sessionReady } = useAuth();
  const [market, setMarket] = useState<InsightMarket>("um");
  const [window, setWindow] = useState<AnomalyWindow>("1h");
  const [kind, setKind] = useState<AnomalyKind>("volume");

  const q = useQuery({
    queryKey: ["anomalies.latest", market, window, kind],
    queryFn: () => getAnomaliesLatest({ market, window, kind, limit: 30 }),
    staleTime: 10_000
  });

  const asOfText = useMemo(() => {
    const ts = Number(q.data?.as_of_ts_ms || 0);
    if (!Number.isFinite(ts) || ts <= 0) return "-";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }, [q.data?.as_of_ts_ms]);

  const items = q.data?.items ?? [];
  const asOfTsMs = Number(q.data?.as_of_ts_ms || 0);

  useEffect(() => {
    if (!user || !sessionReady) return;
    void (async () => {
      try {
        await patchOnboarding({ step: { anomaly_opened: true } });
      } catch {
        // ignore (best-effort)
      }
    })();
  }, [user, sessionReady]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("anomalies.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("anomalies.desc")}</p>
        </header>

        <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-4">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">{t("anomalies.fieldMarket")}</span>
            <select
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              value={String(market)}
              onChange={(e) => setMarket(e.target.value as InsightMarket)}
            >
              {MARKETS.map((m) => (
                <option key={String(m.id)} value={String(m.id)}>
                  {t(m.labelKey)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-600">{t("anomalies.fieldWindow")}</span>
            <select
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              value={String(window)}
              onChange={(e) => setWindow(e.target.value as AnomalyWindow)}
            >
              {WINDOWS.map((w) => (
                <option key={String(w)} value={String(w)}>
                  {String(w)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-gray-600">{t("anomalies.fieldKind")}</span>
            <select
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              value={String(kind)}
              onChange={(e) => setKind(e.target.value as AnomalyKind)}
            >
              {KINDS.map((k) => (
                <option key={String(k)} value={String(k)}>
                  {t(`anomalies.kind.${k}`)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-gray-600">{t("anomalies.asOf")}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{asOfText}</p>
            </div>
          </div>
        </div>

        {q.error ? <ApiErrorView error={q.error} onRetry={() => q.refetch()} /> : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">{t("anomalies.latestTitle")}</h2>
          <p className="mt-1 text-xs text-gray-500">{t("anomalies.hintReplay")}</p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="px-2 py-2">{t("anomalies.colSymbol")}</th>
                  <th className="px-2 py-2">{t("anomalies.colScore")}</th>
                  <th className="px-2 py-2">{t("anomalies.colZ")}</th>
                  <th className="px-2 py-2">{t("anomalies.colPct")}</th>
                  <th className="px-2 py-2">{t("anomalies.colQv")}</th>
                  <th className="px-2 py-2">{t("anomalies.colAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((it) => {
                  const sym = String(it.symbol || "").toUpperCase();
                  const pct = typeof it.meta?.pct_change === "number" ? it.meta.pct_change : NaN;
                  const qv = typeof it.meta?.quote_volume === "number" ? it.meta.quote_volume : NaN;
                  const replayHref = `/chart/${encodeURIComponent(sym)}?market=${encodeURIComponent(String(market))}&tf=1m${
                    asOfTsMs > 0 ? `&ts=${encodeURIComponent(String(asOfTsMs))}` : ""
                  }`;
                  return (
                    <tr key={`${sym}:${String(it.kind)}:${String(it.score)}`} className="text-gray-700">
                      <td className="px-2 py-2 font-semibold text-gray-900 whitespace-nowrap">{sym}</td>
                      <td className="px-2 py-2">{fmtNum(Number(it.score ?? NaN), 2)}</td>
                      <td className="px-2 py-2">{fmtNum(Number(it.z ?? NaN), 2)}</td>
                      <td className="px-2 py-2">{Number.isFinite(pct) ? `${fmtNum(pct, 2)}%` : "-"}</td>
                      <td className="px-2 py-2">{fmtCompact(qv)}</td>
                      <td className="px-2 py-2">
                        <Link
                          href={replayHref}
                          className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                        >
                          {t("anomalies.replay")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {q.isLoading ? <p className="mt-4 text-sm text-gray-500">{t("common.loading")}</p> : null}
          {!q.isLoading && items.length === 0 ? <p className="mt-4 text-sm text-gray-500">{t("anomalies.empty")}</p> : null}
        </section>
      </div>
    </main>
  );
}

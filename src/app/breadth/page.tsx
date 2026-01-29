"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getBreadthHistory, getBreadthLatest } from "@/lib/insightsClient";
import type { BreadthWindow, InsightMarket } from "@/types/insights";

const WINDOWS: BreadthWindow[] = ["1h", "4h", "1d"];
const MARKETS: Array<{ id: InsightMarket; labelKey: string }> = [
  { id: "um", labelKey: "common.marketUm" },
  { id: "spot", labelKey: "common.marketSpot" }
];

function fmtPct(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "-";
  return `${(x * 100).toFixed(digits)}%`;
}

function fmtNumber(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "-";
  return x.toFixed(digits);
}

function fmtRetPct(x: number, digits: number = 2): string {
  if (!Number.isFinite(x)) return "-";
  return `${x.toFixed(digits)}%`;
}

export default function BreadthPage() {
  const { t } = useTranslation();
  const [market, setMarket] = useState<InsightMarket>("um");
  const [window, setWindow] = useState<BreadthWindow>("1d");

  const latestQ = useQuery({
    queryKey: ["breadth.latest", market, window],
    queryFn: () => getBreadthLatest({ market, window }),
    staleTime: 10_000
  });

  const historyQ = useQuery({
    queryKey: ["breadth.history", market, window],
    queryFn: () => getBreadthHistory({ market, window, days: 7 }),
    staleTime: 60_000
  });

  const asOfText = useMemo(() => {
    const ts = Number(latestQ.data?.as_of_ts_ms || 0);
    if (!Number.isFinite(ts) || ts <= 0) return "-";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString();
  }, [latestQ.data?.as_of_ts_ms]);

  const b = latestQ.data?.breadth;
  const dispersion = useMemo(() => {
    const p25 = Number(b?.ret_p25 ?? NaN);
    const p75 = Number(b?.ret_p75 ?? NaN);
    if (!Number.isFinite(p25) || !Number.isFinite(p75)) return NaN;
    return p75 - p25;
  }, [b?.ret_p25, b?.ret_p75]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("breadth.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("breadth.desc")}</p>
        </header>

        <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold text-gray-600">{t("breadth.fieldMarket")}</span>
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
            <span className="text-xs font-semibold text-gray-600">{t("breadth.fieldWindow")}</span>
            <select
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
              value={String(window)}
              onChange={(e) => setWindow(e.target.value as BreadthWindow)}
            >
              {WINDOWS.map((w) => (
                <option key={String(w)} value={String(w)}>
                  {String(w)}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-gray-600">{t("breadth.asOf")}</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{asOfText}</p>
            </div>
          </div>
        </div>

        {latestQ.error ? <ApiErrorView error={latestQ.error} onRetry={() => latestQ.refetch()} /> : null}
        {historyQ.error ? <ApiErrorView error={historyQ.error} onRetry={() => historyQ.refetch()} /> : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold text-gray-900">{t("breadth.latestTitle")}</h2>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600">
              <span className="font-semibold">{t("breadth.regime")}</span>
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 ring-1 ring-gray-200">
                {String(b?.regime || "-")}
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">{t("breadth.advDec")}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {Number(b?.adv ?? 0).toLocaleString()} / {Number(b?.dec ?? 0).toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {t("breadth.advRatio")}: {fmtPct(Number(b?.adv_ratio ?? NaN), 1)}
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">{t("breadth.returns")}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{fmtRetPct(Number(b?.median_ret ?? NaN), 2)}</p>
              <p className="mt-1 text-xs text-gray-500">
                IQR: {fmtRetPct(Number(b?.ret_p25 ?? NaN), 2)} ~ {fmtRetPct(Number(b?.ret_p75 ?? NaN), 2)} (
                {fmtNumber(dispersion, 2)})
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">{t("breadth.liquidity")}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{fmtPct(Number(b?.up_qv_share ?? NaN), 1)}</p>
              <p className="mt-1 text-xs text-gray-500">
                {t("breadth.top10Share")}: {fmtPct(Number(b?.top10_qv_share ?? NaN), 1)}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">{t("breadth.historyTitle")}</h2>
          <p className="mt-1 text-xs text-gray-500">{t("breadth.historyDesc")}</p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="px-2 py-2">{t("breadth.colTime")}</th>
                  <th className="px-2 py-2">{t("breadth.colRegime")}</th>
                  <th className="px-2 py-2">{t("breadth.colAdvRatio")}</th>
                  <th className="px-2 py-2">{t("breadth.colMedian")}</th>
                  <th className="px-2 py-2">{t("breadth.colTop10")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(historyQ.data?.items ?? []).map((it) => {
                  const d = new Date(Number(it.time || 0));
                  const ts = Number.isFinite(d.getTime()) ? d.toLocaleString() : "-";
                  return (
                    <tr key={String(it.time)} className="text-gray-700">
                      <td className="px-2 py-2 whitespace-nowrap">{ts}</td>
                      <td className="px-2 py-2">{String(it.regime || "-")}</td>
                      <td className="px-2 py-2">{fmtPct(Number(it.adv_ratio ?? NaN), 1)}</td>
                      <td className="px-2 py-2">{fmtRetPct(Number(it.median_ret ?? NaN), 2)}</td>
                      <td className="px-2 py-2">{fmtPct(Number(it.top10_qv_share ?? NaN), 1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {latestQ.isLoading || historyQ.isLoading ? (
            <p className="mt-4 text-sm text-gray-500">{t("common.loading")}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}


"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSymbols } from "@/hooks/useSymbols";
import { useSymbolsStore } from "@/store/useSymbolStore";

export default function ChartLandingPage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const { data } = useSymbols("1d");
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = query.trim().toUpperCase();
    if (!q) return list.slice(0, 12);
    return list.filter((row) => row.symbol.includes(q) || row.baseAsset.toUpperCase().includes(q)).slice(0, 12);
  }, [data, query]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t("chart.hubTitle")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("chart.hubDesc")}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setMarket("spot")}
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                market === "spot" ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
              }`}
            >
              {t("common.marketSpot")}
            </button>
            <button
              type="button"
              onClick={() => setMarket("um")}
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                market === "um" ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
              }`}
            >
              {t("common.marketUm")}
            </button>
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("market.searchPlaceholder")}
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((row) => (
            <Link
              key={row.symbol}
              href={`/chart/${row.symbol}`}
              className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900">{row.symbol}</span>
                <span className={`text-xs ${row.change24h >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {row.change24h.toFixed(2)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">{t("chart.chartDesc")}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

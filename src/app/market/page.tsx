"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import SymbolTable from "@/components/SymbolTable";
import { useSymbolsStore } from "@/store/useSymbolStore";
import type { SymbolRow } from "@/hooks/useSymbols";

type FilterMode = "all" | "gainers" | "losers";

export default function MarketPage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const { t } = useTranslation();

  const filterFn = useMemo(() => {
    if (filterMode === "gainers") return (row: SymbolRow) => row.change24h > 0;
    if (filterMode === "losers") return (row: SymbolRow) => row.change24h < 0;
    return undefined;
  }, [filterMode]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t("market.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("market.desc")}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
                onClick={() => setMarket("spot")}
                className={`rounded-full px-4 py-1 text-sm font-medium ${
                  market === "spot"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {t("common.marketSpot")}
              </button>
              <button
                type="button"
                onClick={() => setMarket("um")}
                className={`rounded-full px-4 py-1 text-sm font-medium ${
                  market === "um"
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                }`}
              >
                {t("common.marketUm")}
              </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-gray-500">
            {(["all", "gainers", "losers"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`rounded-full px-3 py-1 ${
                  filterMode === mode ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                }`}
              >
                {mode === "all"
                  ? t("market.filterAll")
                  : mode === "gainers"
                    ? t("market.filterGainers")
                    : t("market.filterLosers")}
              </button>
            ))}
          </div>
        </div>

        <SymbolTable filterFn={filterFn} />
      </div>
    </main>
  );
}

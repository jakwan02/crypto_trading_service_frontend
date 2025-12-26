"use client";

import { useMemo, useState } from "react";
import SymbolTable from "@/components/SymbolTable";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { useAuth } from "@/contexts/AuthContext";
import type { SymbolRow } from "@/hooks/useSymbols";

type FilterMode = "all" | "gainers" | "losers";

export default function MarketPage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const { isPro } = useAuth();
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

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
            <h1 className="text-2xl font-semibold text-gray-900">Market Overview</h1>
            <p className="mt-1 text-sm text-gray-500">
              실시간 가격, 거래량, 변동률을 기준으로 시장을 스크리닝합니다.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              onClick={() => setMarket("spot")}
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                market === "spot" ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
              }`}
            >
              Spot
            </button>
            <button
              type="button"
              onClick={() => setMarket("um")}
              className={`rounded-full px-4 py-1 text-sm font-medium ${
                market === "um" ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
              }`}
            >
              UM
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
                {mode === "all" ? "전체" : mode === "gainers" ? "상승" : "하락"}
              </button>
            ))}
          </div>
        </div>

        <SymbolTable
          limit={isPro ? undefined : 50}
          filterFn={filterFn}
        />

        {!isPro ? (
          <div className="mt-4 rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">
            무료 플랜은 상위 50개 심볼만 제공합니다. 전체 심볼과 실시간 업데이트는 Pro에서 이용할 수 있습니다.
          </div>
        ) : null}
      </div>
    </main>
  );
}

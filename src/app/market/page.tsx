"use client";

import SymbolTable from "@/components/SymbolTable";
import { useSymbolsStore } from "@/store/useSymbolStore";

export default function MarketPage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Market Overview</h1>
            <p className="mt-1 text-sm text-gray-500">
              거래량과 가격 변동이 큰 심볼을 빠르게 탐색할 수 있습니다.
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

        <SymbolTable />
      </div>
    </main>
  );
}

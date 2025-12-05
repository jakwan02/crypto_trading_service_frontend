"use client";

import SymbolTable from "@/components/SymbolTable";
import { useSymbolsStore } from "@/store/useSymbolStore";

export default function HomePage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);

  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              Crypto Symbols ({market.toUpperCase()})
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              실시간 가격·거래량·1일 등락률 기준으로 정렬되는 심볼 목록입니다.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 p-1 ring-1 ring-slate-800">
            <button
              type="button"
              onClick={() => setMarket("spot")}
              className={`rounded-full px-3 py-1 text-sm ${
                market === "spot"
                  ? "bg-emerald-500 text-black"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              Spot
            </button>
            <button
              type="button"
              onClick={() => setMarket("um")}
              className={`rounded-full px-3 py-1 text-sm ${
                market === "um"
                  ? "bg-emerald-500 text-black"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              UM
            </button>
          </div>
        </header>

        <section>
          <SymbolTable />
        </section>
      </div>
    </main>
  );
}
// filename: src/app/chart/[symbol]/SymbolChartClient.tsx
"use client";

import { useState } from "react";
import ChartContainer from "@/components/ChartContainer";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

type Props = {
  symbol: string;
};

export default function SymbolChartClient({ symbol }: Props) {
  const [tf, setTf] = useState<string>("1d");

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{symbol} Chart</h1>
            <p className="mt-1 text-sm text-slate-400">
              타임프레임별 과거 데이터와 실시간 흐름을 확인할 수 있습니다.
            </p>
          </div>
          <div className="inline-flex flex-wrap items-center gap-1 rounded-full bg-slate-900/80 p-1 ring-1 ring-slate-800">
            {TIMEFRAMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTf(item)}
                className={`rounded-full px-2 py-1 text-xs sm:text-sm ${
                  tf === item
                    ? "bg-emerald-500 text-black"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <section className="rounded-xl bg-slate-900/80 p-4 ring-1 ring-slate-800">
          <ChartContainer symbol={symbol} timeframe={tf} />
        </section>
      </div>
    </main>
  );
}
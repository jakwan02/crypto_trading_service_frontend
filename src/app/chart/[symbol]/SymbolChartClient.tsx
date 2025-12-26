// filename: frontend/app/chart/[symbol]/SymbolChartClient.tsx
"use client";

import { useMemo, useState } from "react";
import ChartContainer from "@/components/ChartContainer";
import { useSymbols, type MetricWindow } from "@/hooks/useSymbols";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

type Props = {
  symbol: string;
};

export default function SymbolChartClient({ symbol }: Props) {
  const [tf, setTf] = useState<string>("1d");
  const sym = (symbol || "").toUpperCase();
  const tfWin = tf as MetricWindow;
  const { data: symbols } = useSymbols(tfWin);
  const info = useMemo(() => symbols?.find((row) => row.symbol === sym), [symbols, sym]);
  const changeValue = info?.change24h;
  const changeIsNumber = Number.isFinite(changeValue);
  const tfLabel = tf;

  const fmtPrice = (x: number) =>
    Number.isFinite(x)
      ? x.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 8 })
      : "-";
  const fmtCompact = (x: number) => {
    if (!Number.isFinite(x)) return "-";
    const ax = Math.abs(x);
    if (ax === 0) return "0";
    if (ax >= 1_000_000_000_000) return (x / 1_000_000_000_000).toFixed(2) + "T";
    if (ax >= 1_000_000_000) return (x / 1_000_000_000).toFixed(2) + "B";
    if (ax >= 1_000_000) return (x / 1_000_000).toFixed(2) + "M";
    if (ax >= 1_000) return (x / 1_000).toFixed(2) + "K";
    return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  if (!sym) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-gray-500">
          심볼이 올바르지 않습니다.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{sym} Chart</h1>
            <p className="mt-1 text-sm text-gray-500">
              타임프레임별 과거 데이터와 실시간 흐름을 확인할 수 있습니다.
            </p>
          </div>

          <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-gray-200 bg-gray-50 p-1">
            {TIMEFRAMES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTf(item)}
                className={`rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${
                  tf === item ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
                }`}
              >
                {item.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Current Price</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {Number.isFinite(info?.price) ? fmtPrice(info?.price ?? NaN) : "-"}
            </p>
          </div>
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{tfLabel} Change</p>
            <p
              className={`mt-2 text-xl font-semibold ${
                !changeIsNumber
                  ? "text-gray-400"
                  : changeValue >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
              }`}
            >
              {changeIsNumber ? `${changeValue?.toFixed(2)}%` : "-"}
            </p>
          </div>
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{tfLabel} Volume</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {Number.isFinite(info?.volume) ? fmtCompact(info?.volume ?? NaN) : "-"}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <ChartContainer symbol={sym} timeframe={tf} />
        </section>
      </div>
    </main>
  );
}

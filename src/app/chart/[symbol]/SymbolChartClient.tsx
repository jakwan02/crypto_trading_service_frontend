// filename: frontend/app/chart/[symbol]/SymbolChartClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Sparkles } from "lucide-react";
import ChartContainer from "@/components/ChartContainer";
import { useSymbols, type MetricWindow } from "@/hooks/useSymbols";
import { useAuth } from "@/contexts/AuthContext";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

type Props = {
  symbol: string;
};

export default function SymbolChartClient({ symbol }: Props) {
  const [tf, setTf] = useState<string>("1d");
  const sym = (symbol || "").toUpperCase();
  const tfWin = tf as MetricWindow;
  const { data: symbols } = useSymbols(tfWin, { tickerSymbols: sym ? [sym] : [] });
  const { isPro } = useAuth();
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
    if (ax >= 1_000_000_000_000) return (x / 1_000_000_000_000).toFixed(2).replace(/\.00$/, "") + "조";
    if (ax >= 100_000_000) return (x / 100_000_000).toFixed(2).replace(/\.00$/, "") + "억";
    if (ax >= 10_000) return (x / 10_000).toFixed(2).replace(/\.00$/, "") + "만";
    if (ax >= 1_000) return (x / 1_000).toFixed(2).replace(/\.00$/, "") + "천";
    if (ax >= 100) return (x / 100).toFixed(2).replace(/\.00$/, "") + "백";
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
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900">{sym}</h1>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                LIVE
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              실시간 차트와 AI 분석 요약을 함께 확인할 수 있습니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/alerts"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              <Bell className="h-4 w-4" /> 알림 설정
            </Link>
            <Link
              href="/indicators"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <Sparkles className="h-4 w-4" /> AI 인사이트
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-4">
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
            <p className="text-xs text-gray-500">{tfLabel} 거래량</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {Number.isFinite(info?.volume) ? fmtCompact(info?.volume ?? NaN) : "-"}
            </p>
          </div>
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{tfLabel} 거래대금</p>
            <p className="mt-2 text-xl font-semibold text-gray-900">
              {Number.isFinite(info?.quoteVolume) ? fmtCompact(info?.quoteVolume ?? NaN) : "-"}
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
              {!isPro ? (
                <span className="rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs text-gray-400">
                  무료 플랜은 최근 1개월 히스토리만 제공됩니다.
                </span>
              ) : null}
            </div>
            <ChartContainer symbol={sym} timeframe={tf} />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">AI Signal</h3>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  PRO
                </span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="font-medium text-gray-900">상승 확률</p>
                  <p className="text-xs text-gray-500">62% · 변동성 확대 구간</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="font-medium text-gray-900">리스크 알림</p>
                  <p className="text-xs text-gray-500">단기 과열, 추세 유지 확인 필요</p>
                </div>
              </div>
              {!isPro ? (
                <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                  Pro로 업그레이드하면 상세 신호와 리포트를 제공합니다.
                  <Link href="/upgrade" className="ml-2 font-semibold text-primary">
                    업그레이드
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">Tech Indicators</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>RSI</span>
                  <span className="font-medium text-gray-900">58 · 중립</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>MACD</span>
                  <span className="font-medium text-gray-900">상승 전환</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>볼린저 밴드</span>
                  <span className="font-medium text-gray-900">상단 근접</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">News</h3>
                <Link href="/news" className="text-xs font-semibold text-primary">
                  더보기
                </Link>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {[
                  "BTC 관련 규제 뉴스 업데이트",
                  "거래소 유동성 확대 보고서",
                  "고래 지갑 이동 감지"
                ].map((news) => (
                  <li key={news} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    {news}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

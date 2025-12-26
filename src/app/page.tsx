"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useSymbols } from "@/hooks/useSymbols";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { useAuth } from "@/contexts/AuthContext";

const NEWS_ITEMS = [
  {
    title: "비트코인 현물 ETF 자금 유입 지속",
    source: "CoinDesk",
    time: "10분 전"
  },
  {
    title: "알트코인 거래량 급증, 변동성 확대",
    source: "Cointelegraph",
    time: "35분 전"
  },
  {
    title: "미 연준 발표 앞두고 시장 관망세",
    source: "Bloomberg",
    time: "1시간 전"
  }
];

function fmtCompact(x: number) {
  if (!Number.isFinite(x)) return "-";
  const ax = Math.abs(x);
  if (ax >= 1_000_000_000_000) return `${(x / 1_000_000_000_000).toFixed(2).replace(/\\.00$/, "")}조`;
  if (ax >= 100_000_000) return `${(x / 100_000_000).toFixed(2).replace(/\\.00$/, "")}억`;
  if (ax >= 10_000) return `${(x / 10_000).toFixed(2).replace(/\\.00$/, "")}만`;
  if (ax >= 1_000) return `${(x / 1_000).toFixed(2).replace(/\\.00$/, "")}천`;
  return x.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function HomePage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const { isPro } = useAuth();
  const { data, isLoading } = useSymbols("1d");

  const summary = useMemo(() => {
    if (!data || data.length === 0) return null;
    const totalQuote = data.reduce((acc, row) => acc + (Number.isFinite(row.quoteVolume) ? row.quoteVolume : 0), 0);
    const upCount = data.filter((row) => row.change24h > 0).length;
    const avgChange =
      data.reduce((acc, row) => acc + (Number.isFinite(row.change24h) ? row.change24h : 0), 0) / data.length;
    const gainers = [...data].sort((a, b) => b.change24h - a.change24h).slice(0, 5);
    const losers = [...data].sort((a, b) => a.change24h - b.change24h).slice(0, 5);
    const volumes = [...data].sort((a, b) => b.quoteVolume - a.quoteVolume).slice(0, 6);

    return {
      totalQuote,
      upCount,
      totalSymbols: data.length,
      avgChange,
      gainers,
      losers,
      volumes
    };
  }, [data]);

  const gainers = summary?.gainers ?? [];
  const losers = summary?.losers ?? [];
  const volumes = summary?.volumes ?? [];

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-gray-200 bg-white/90 p-8 shadow-sm">
          <div className="pointer-events-none absolute right-[-10%] top-[-40%] h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-30%] left-[15%] h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="relative z-10 grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                AI market dashboard
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-gray-900 md:text-4xl">
                지금 시장 흐름을 읽고, 중요한 변화만 빠르게 포착하세요
              </h1>
              <p className="mt-4 text-sm text-gray-600 md:text-base">
                실시간 데이터, 차트, 알림, 프리미엄 분석을 한 화면에서 연결해 투자 판단 시간을 줄입니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/market"
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                >
                  마켓 바로가기
                </Link>
                <Link
                  href="/alerts"
                  className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                >
                  알림 설정
                </Link>
              </div>
            </div>
            <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Today&apos;s Focus</p>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span>실시간 가격 업데이트</span>
                  <span className="text-xs text-secondary">~200ms</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span>급변동 알림</span>
                  <span className="text-xs text-secondary">24h</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span>거래량/거래대금 분리</span>
                  <span className="text-xs text-secondary">Base/Quote</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Market Pulse</h2>
                <p className="mt-1 text-sm text-gray-500">실시간 데이터 기반으로 오늘의 시장 흐름을 요약합니다.</p>
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
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">전체 심볼</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary ? summary.totalSymbols.toLocaleString() : isLoading ? "..." : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-400">현재 마켓 기준</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">24h 거래대금</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary ? fmtCompact(summary.totalQuote) : isLoading ? "..." : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-400">Quote Volume 합계</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">평균 변동률</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary ? `${summary.avgChange.toFixed(2)}%` : isLoading ? "..." : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-400">시장 모멘텀</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Top Gainers</h3>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {gainers.length === 0 ? (
                    <li className="rounded-lg bg-gray-50 px-3 py-2 text-gray-400">데이터 로딩 중</li>
                  ) : (
                    gainers.map((row) => (
                      <li key={row.symbol} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="font-medium text-gray-900">{row.symbol}</span>
                        <span className="text-emerald-600">+{row.change24h.toFixed(2)}%</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Top Losers</h3>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {losers.length === 0 ? (
                    <li className="rounded-lg bg-gray-50 px-3 py-2 text-gray-400">데이터 로딩 중</li>
                  ) : (
                    losers.map((row) => (
                      <li key={row.symbol} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="font-medium text-gray-900">{row.symbol}</span>
                        <span className="text-red-600">{row.change24h.toFixed(2)}%</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Volume Spike</h3>
                <span className="text-xs text-gray-400">Top 6</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {volumes.length === 0 ? (
                  <li className="text-gray-400">데이터 로딩 중</li>
                ) : (
                  volumes.map((row) => (
                    <li key={row.symbol} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{row.symbol}</span>
                      <span className="text-gray-600">{fmtCompact(row.quoteVolume)}</span>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/market"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                마켓 전체 보기 <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">AI Highlights</h3>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  PRO
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { title: "시장 모멘텀", desc: "중립 → 강세 전환 신호 감지" },
                  { title: "BTC 변동성", desc: "단기 과열 경고, 변동성 상향" },
                  { title: "알트 섹터", desc: "메이저 알트 순환 매수 집중" }
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              {!isPro ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                  Pro 구독 시 전체 AI 리포트와 세부 지표를 확인할 수 있습니다.
                  <Link href="/upgrade" className="ml-2 font-semibold text-primary">
                    업그레이드
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">실시간 뉴스</h3>
              <Link href="/news" className="text-xs font-semibold text-primary">
                전체 보기
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {NEWS_ITEMS.map((item) => (
                <li key={item.title} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {item.source} · {item.time}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">빠른 액션</h3>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-600">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                가격 알림을 설정하고 급변동을 실시간으로 받아보세요.
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                자주 보는 코인을 워치리스트로 묶어 빠르게 확인할 수 있습니다.
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                리스크 경고 알림을 통해 손절 타이밍을 놓치지 않습니다.
              </div>
            </div>
            <Link
              href="/alerts"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              알림 관리로 이동 <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

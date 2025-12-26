"use client";

import Link from "next/link";
import SymbolTable from "@/components/SymbolTable";
import { useSymbolsStore } from "@/store/useSymbolStore";

export default function HomePage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
        <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-blue-50 via-white to-teal-50 p-8">
          <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-6 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl" />
          <div className="relative z-10 grid gap-6 md:grid-cols-[1.3fr_1fr]">
            <div className="fade-up">
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary">
                Live crypto market
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-gray-900 md:text-4xl">
                암호화폐 시장을 한눈에 파악하고, 지금 바로 시작하세요
              </h1>
              <p className="mt-3 text-sm text-gray-600 md:text-base">
                최소한의 메뉴와 명확한 데이터 구성으로 빠르게 판단하고, 빠르게 거래할 수 있도록
                설계했습니다.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/signup"
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
                >
                  Start Trading
                </Link>
                <Link
                  href="/market"
                  className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                >
                  View Market
                </Link>
              </div>
            </div>
            <div className="fade-up rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">Today&apos;s Focus</p>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>실시간 가격 업데이트</span>
                  <span className="text-xs text-secondary">~200ms</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>강화된 변동률 알림</span>
                  <span className="text-xs text-secondary">24h</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                  <span>거래량·회전율 분리</span>
                  <span className="text-xs text-secondary">Base/Quote</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Crypto Symbols ({market.toUpperCase()})
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              실시간 가격·거래량·1일 등락률 기준으로 정렬되는 심볼 목록입니다.
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

        <section>
          <SymbolTable />
        </section>

        <section className="fade-up rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900">이용 안내</h3>
          <p className="mt-2 text-sm text-gray-600">
            심볼을 클릭하면 상세 차트로 이동합니다. 향후 계정·결제 기능이 추가되면
            원클릭으로 거래를 이어갈 수 있도록 연결될 예정입니다.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              명확한 내비게이션으로 핵심 행동을 빠르게 수행합니다.
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              실시간 데이터는 눈에 띄게 배치해 인사이트를 제공합니다.
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              향후 결제·KYC 확장을 고려한 구조로 설계했습니다.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

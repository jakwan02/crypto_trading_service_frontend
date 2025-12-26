"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = ["전체", "모멘텀", "온체인", "파생", "리스크"] as const;

const SIGNALS = [
  {
    id: "sig-1",
    category: "모멘텀",
    title: "AI 모멘텀 스코어",
    summary: "시장 모멘텀 강세 전환 신호",
    value: "72/100",
    pro: true
  },
  {
    id: "sig-2",
    category: "파생",
    title: "펀딩비 컨디션",
    summary: "롱 포지션 우위, 과열 주의",
    value: "+0.018%",
    pro: true
  },
  {
    id: "sig-3",
    category: "온체인",
    title: "고래 지갑 순유입",
    summary: "순유입 확대, 매집 가능성",
    value: "↑ 6.2%",
    pro: true
  },
  {
    id: "sig-4",
    category: "리스크",
    title: "변동성 경보",
    summary: "변동성 확장 구간 진입",
    value: "High",
    pro: false
  },
  {
    id: "sig-5",
    category: "모멘텀",
    title: "섹터 로테이션",
    summary: "메이저 알트 순환 매수 강화",
    value: "Alt +",
    pro: false
  },
  {
    id: "sig-6",
    category: "파생",
    title: "청산 히트맵",
    summary: "상단 4% 구간 집중",
    value: "Heat",
    pro: true
  }
];

export default function IndicatorsPage() {
  const { isPro } = useAuth();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("전체");

  const filtered = useMemo(() => {
    if (category === "전체") return SIGNALS;
    return SIGNALS.filter((item) => item.category === category);
  }, [category]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">AI Insights</h1>
            <p className="mt-1 text-sm text-gray-500">AI가 산출한 지표와 시장 신호를 한 곳에서 확인합니다.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
            <Sparkles className="h-4 w-4 text-primary" />
            최신 업데이트 3분 전
          </div>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-1 text-xs font-semibold ${
                category === item ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((signal) => (
            <div
              key={signal.id}
              className={`relative rounded-3xl border border-gray-200 bg-white p-5 shadow-sm ${
                signal.pro && !isPro ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  {signal.category}
                </span>
                {signal.pro ? (
                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                    PRO
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">{signal.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{signal.summary}</p>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-500">현재 값</span>
                <span className="text-sm font-semibold text-gray-900">{signal.value}</span>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary"
              >
                상세 보기
              </button>

              {signal.pro && !isPro ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/80 text-center text-xs text-gray-500">
                  <p>Pro 구독 시 전체 지표를 확인할 수 있습니다.</p>
                  <Link href="/upgrade" className="mt-2 font-semibold text-primary">
                    업그레이드
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

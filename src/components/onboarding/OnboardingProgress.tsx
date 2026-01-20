"use client";

// 변경 이유: Week6 온보딩 진행 바 UI를 공통 컴포넌트로 제공

import { useMemo } from "react";

export default function OnboardingProgress(props: { done: number; total: number; pct?: number; label?: string }) {
  const pct = useMemo(() => {
    const total = Math.max(1, Number(props.total || 0));
    const done = Math.max(0, Math.min(total, Number(props.done || 0)));
    const computed = Math.round((done / total) * 100);
    const fromProp = typeof props.pct === "number" ? Math.round(props.pct) : computed;
    return Math.max(0, Math.min(100, fromProp));
  }, [props.done, props.total, props.pct]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-gray-900">{props.label || "Onboarding"}</p>
        <p className="text-xs font-semibold text-gray-500">
          {props.done}/{props.total} · {pct}%
        </p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}


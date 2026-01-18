"use client";

import { useMemo } from "react";
import type { Plan } from "@/types/billing";

type Props = {
  plan: Plan;
  selected?: boolean;
  current?: boolean;
  onSelect?: () => void;
};

function entInt(ent: unknown, path: string[]): number | null {
  let cur: unknown = ent;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  const n = Number(cur);
  return Number.isFinite(n) ? n : null;
}

export default function PlanCard({ plan, selected, current, onSelect }: Props) {
  const ent = plan.ent || {};
  const apiRpm = entInt(ent, ["api", "rpm"]);
  const apiCalls = entInt(ent, ["api", "calls_per_day"]);
  const maxLists = entInt(ent, ["watchlists", "max_lists"]);
  const maxItems = entInt(ent, ["watchlists", "max_items_per_list"]);
  const maxAlerts = entInt(ent, ["alerts", "max_rules"]);
  const maxHistory = entInt(ent, ["history", "max_days"]);

  const subtitle = useMemo(() => {
    const name = (plan.name || "").trim();
    return name || plan.code.toUpperCase();
  }, [plan.code, plan.name]);

  const border = selected ? "border-primary/40 ring-2 ring-primary/10" : "border-gray-200";
  const badge = current ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border ${border} bg-white p-5 text-left shadow-sm transition hover:border-primary/30`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{plan.code}</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{subtitle}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badge}`}>
          {current ? "Current" : "Selectable"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">API</dt>
          <dd className="mt-1">
            rpm: {apiRpm ?? "-"} · day: {apiCalls ?? "-"}
          </dd>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">Watchlists</dt>
          <dd className="mt-1">
            lists: {maxLists ?? "-"} · items: {maxItems ?? "-"}
          </dd>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">Alerts</dt>
          <dd className="mt-1">max_rules: {maxAlerts ?? "-"}</dd>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">History</dt>
          <dd className="mt-1">max_days: {maxHistory ?? "-"}</dd>
        </div>
      </dl>
    </button>
  );
}


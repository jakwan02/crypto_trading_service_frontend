"use client";

import { useMemo } from "react";
import type { Plan } from "@/types/billing";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  const ent = plan.ent || {};
  const apiRpm = entInt(ent, ["api", "rpm"]);
  const apiCalls = entInt(ent, ["api", "calls_per_day"]);
  const maxLists = entInt(ent, ["watchlists", "max_lists"]);
  const maxItems = entInt(ent, ["watchlists", "max_items_per_list"]);
  const maxAlerts = entInt(ent, ["alerts", "max_rules"]);
  const maxHistory = entInt(ent, ["history", "max_days"]);

  const fmtNum = (n: number | null): string => {
    if (n === null || !Number.isFinite(n)) return "-";
    return new Intl.NumberFormat().format(n);
  };

  const subtitle = useMemo(() => {
    const code = String(plan.code || "").trim().toLowerCase();
    if (code === "free") return t("upgrade.planCard.title.free", { defaultValue: "Free" });
    if (code === "pro") return t("upgrade.planCard.title.pro", { defaultValue: "Pro" });
    const name = (plan.name || "").trim();
    return name || plan.code.toUpperCase();
  }, [plan.code, plan.name, t]);

  const border = selected ? "border-primary/40 ring-2 ring-primary/10" : "border-gray-200";
  const badge = current ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600";
  const codeLabel = useMemo(() => {
    const code = String(plan.code || "").trim().toLowerCase();
    if (code === "free") return t("upgrade.planCard.code.free", { defaultValue: "FREE" });
    if (code === "pro") return t("upgrade.planCard.code.pro", { defaultValue: "PRO" });
    return String(plan.code || "").trim().toUpperCase();
  }, [plan.code, t]);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-3xl border ${border} bg-white p-5 text-left shadow-sm transition hover:border-primary/30`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{codeLabel}</p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{subtitle}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${badge}`}>
          {current
            ? t("upgrade.planCard.badge.current", { defaultValue: "현재 이용 중" })
            : t("upgrade.planCard.badge.selectable", { defaultValue: "선택 가능" })}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">{t("upgrade.planCard.section.api", { defaultValue: "API" })}</dt>
          <dd className="mt-1">
            {t("upgrade.planCard.apiLine", {
              defaultValue: "분당 {{rpm}}회 · 일 {{day}}회",
              rpm: fmtNum(apiRpm),
              day: fmtNum(apiCalls)
            })}
          </dd>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">
            {t("upgrade.planCard.section.watchlists", { defaultValue: "워치리스트" })}
          </dt>
          <dd className="mt-1">
            {t("upgrade.planCard.watchlistsLine", {
              defaultValue: "리스트 {{lists}}개 · 리스트당 {{items}}개",
              lists: fmtNum(maxLists),
              items: fmtNum(maxItems)
            })}
          </dd>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">
            {t("upgrade.planCard.section.alerts", { defaultValue: "알림" })}
          </dt>
          <dd className="mt-1">
            {t("upgrade.planCard.alertsLine", {
              defaultValue: "규칙 {{maxRules}}개",
              maxRules: fmtNum(maxAlerts)
            })}
          </dd>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
          <dt className="font-semibold text-gray-700">
            {t("upgrade.planCard.section.history", { defaultValue: "히스토리" })}
          </dt>
          <dd className="mt-1">
            {t("upgrade.planCard.historyLine", {
              defaultValue: "{{maxDays}}일",
              maxDays: fmtNum(maxHistory)
            })}
          </dd>
        </div>
      </dl>
    </button>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES = [
  { id: "all", labelKey: "ai.categories.all" },
  { id: "momentum", labelKey: "ai.categories.momentum" },
  { id: "onchain", labelKey: "ai.categories.onchain" },
  { id: "derivatives", labelKey: "ai.categories.derivatives" },
  { id: "risk", labelKey: "ai.categories.risk" }
] as const;

type SignalItem = {
  id: string;
  category: (typeof CATEGORIES)[number]["id"];
  titleKey: string;
  summaryKey: string;
  value: string;
  valueKey?: string;
  pro: boolean;
};

const SIGNALS: SignalItem[] = [
  {
    id: "sig-1",
    category: "momentum",
    titleKey: "ai.signals.momentumScore.title",
    summaryKey: "ai.signals.momentumScore.summary",
    value: "72/100",
    pro: true
  },
  {
    id: "sig-2",
    category: "derivatives",
    titleKey: "ai.signals.funding.title",
    summaryKey: "ai.signals.funding.summary",
    value: "+0.018%",
    pro: true
  },
  {
    id: "sig-3",
    category: "onchain",
    titleKey: "ai.signals.whaleFlow.title",
    summaryKey: "ai.signals.whaleFlow.summary",
    value: "↑ 6.2%",
    pro: true
  },
  {
    id: "sig-4",
    category: "risk",
    titleKey: "ai.signals.volatility.title",
    summaryKey: "ai.signals.volatility.summary",
    value: "High",
    valueKey: "ai.values.high",
    pro: false
  },
  {
    id: "sig-5",
    category: "momentum",
    titleKey: "ai.signals.sectorRotation.title",
    summaryKey: "ai.signals.sectorRotation.summary",
    value: "Alt +",
    valueKey: "ai.values.altPlus",
    pro: false
  },
  {
    id: "sig-6",
    category: "derivatives",
    titleKey: "ai.signals.liquidationHeatmap.title",
    summaryKey: "ai.signals.liquidationHeatmap.summary",
    value: "Heat",
    pro: true
  }
];

export default function IndicatorsPage() {
  const { isPro } = useAuth();
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    if (category === "all") return SIGNALS;
    return SIGNALS.filter((item) => item.category === category);
  }, [category]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t("ai.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("ai.desc")}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
            <Sparkles className="h-4 w-4 text-primary" />
            {t("ai.updated")}
          </div>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`rounded-full px-4 py-1 text-xs font-semibold ${
                category === item.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
              }`}
            >
              {t(item.labelKey)}
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
                  {t(`ai.categories.${signal.category}`)}
                </span>
                {signal.pro ? (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {t("common.pro")}
                </span>
              ) : null}
            </div>
            <h3 className="mt-3 text-lg font-semibold text-gray-900">{t(signal.titleKey)}</h3>
            <p className="mt-2 text-sm text-gray-500">{t(signal.summaryKey)}</p>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-500">{t("ai.valueLabel")}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {signal.valueKey ? t(signal.valueKey) : signal.value}
                </span>
              </div>
              <button
                type="button"
                className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary"
              >
                {t("ai.viewDetail")}
              </button>

              {signal.pro && !isPro ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-white/80 text-center text-xs text-gray-500">
                  <p>{t("ai.proLock")}</p>
                  <Link href="/upgrade" className="mt-2 font-semibold text-primary">
                    {t("ai.upgrade")}
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

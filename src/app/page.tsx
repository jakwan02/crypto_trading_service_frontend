"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSymbols } from "@/hooks/useSymbols";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { useAuth } from "@/contexts/AuthContext";
import { formatCompactNumber } from "@/lib/format";

const NEWS_ITEMS = [
  {
    key: "item1",
    source: "CoinDesk",
  },
  {
    key: "item2",
    source: "Cointelegraph",
  },
  {
    key: "item3",
    source: "Bloomberg",
  }
];

export default function HomePage() {
  const market = useSymbolsStore((s) => s.market);
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const { isPro } = useAuth();
  const { data, isLoading } = useSymbols("1d");
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

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
                {t("home.hero.badge")}
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-gray-900 md:text-4xl">
                {t("home.hero.title")}
              </h1>
              <p className="mt-4 text-sm text-gray-600 md:text-base">
                {t("home.hero.description")}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/market"
                  className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                >
                  {t("home.hero.ctaMarket")}
                </Link>
                <Link
                  href="/alerts"
                  className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
                >
                  {t("home.hero.ctaAlerts")}
                </Link>
              </div>
            </div>
            <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("home.focus.title")}</p>
              <div className="mt-4 space-y-3 text-sm text-gray-700">
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span>{t("home.focus.item1")}</span>
                  <span className="text-xs text-secondary">{t("home.focus.item1Meta")}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span>{t("home.focus.item2")}</span>
                  <span className="text-xs text-secondary">{t("home.focus.item2Meta")}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                  <span>{t("home.focus.item3")}</span>
                  <span className="text-xs text-secondary">{t("home.focus.item3Meta")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{t("home.pulse.title")}</h2>
                <p className="mt-1 text-sm text-gray-500">{t("home.pulse.desc")}</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 p-1">
                <button
                  type="button"
                  onClick={() => setMarket("spot")}
                  className={`rounded-full px-4 py-1 text-sm font-medium ${
                    market === "spot" ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
                  }`}
                >
                  {t("common.marketSpot")}
                </button>
                <button
                  type="button"
                  onClick={() => setMarket("um")}
                  className={`rounded-full px-4 py-1 text-sm font-medium ${
                    market === "um" ? "bg-primary text-white" : "text-gray-600 hover:bg-white"
                  }`}
                >
                  {t("common.marketUm")}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">{t("home.pulse.totalSymbols")}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary ? summary.totalSymbols.toLocaleString(locale) : isLoading ? "..." : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t("home.pulse.totalSymbolsMeta")}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">{t("home.pulse.totalQuote")}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary ? formatCompactNumber(summary.totalQuote, locale) : isLoading ? "..." : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t("home.pulse.totalQuoteMeta")}</p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs text-gray-500">{t("home.pulse.avgChange")}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">
                  {summary ? `${summary.avgChange.toFixed(2)}%` : isLoading ? "..." : "-"}
                </p>
                <p className="mt-1 text-xs text-gray-400">{t("home.pulse.avgChangeMeta")}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">{t("home.pulse.gainers")}</h3>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {gainers.length === 0 ? (
                    <li className="rounded-lg bg-gray-50 px-3 py-2 text-gray-400">
                      {t("home.pulse.loading")}
                    </li>
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
                  <h3 className="text-sm font-semibold text-gray-900">{t("home.pulse.losers")}</h3>
                  <TrendingDown className="h-4 w-4 text-red-500" />
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {losers.length === 0 ? (
                    <li className="rounded-lg bg-gray-50 px-3 py-2 text-gray-400">
                      {t("home.pulse.loading")}
                    </li>
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
                <h3 className="text-sm font-semibold text-gray-900">{t("home.volumeSpike.title")}</h3>
                <span className="text-xs text-gray-400">{t("home.volumeSpike.top")}</span>
              </div>
              <ul className="mt-4 space-y-3 text-sm">
                {volumes.length === 0 ? (
                  <li className="text-gray-400">{t("home.pulse.loading")}</li>
                ) : (
                  volumes.map((row) => (
                    <li key={row.symbol} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{row.symbol}</span>
                      <span className="text-gray-600">{formatCompactNumber(row.quoteVolume, locale)}</span>
                    </li>
                  ))
                )}
              </ul>
              <Link
                href="/market"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                {t("home.volumeSpike.goMarket")} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{t("home.aiHighlights.title")}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {t("common.pro")}
                </span>
              </div>
              <div className="mt-4 space-y-3 text-sm">
                {[
                  { title: t("home.aiHighlights.card1Title"), desc: t("home.aiHighlights.card1Desc") },
                  { title: t("home.aiHighlights.card2Title"), desc: t("home.aiHighlights.card2Desc") },
                  { title: t("home.aiHighlights.card3Title"), desc: t("home.aiHighlights.card3Desc") }
                ].map((item) => (
                  <div key={item.title} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
              {!isPro ? (
                <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                  {t("home.aiHighlights.upsell")}
                  <Link href="/upgrade" className="ml-2 font-semibold text-primary">
                    {t("home.aiHighlights.upgrade")}
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t("home.news.title")}</h3>
              <Link href="/news" className="text-xs font-semibold text-primary">
                {t("common.viewAll")}
              </Link>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {NEWS_ITEMS.map((item) => (
                <li key={item.key} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="font-medium text-gray-900">{t(`home.news.items.${item.key}.title`)}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {item.source} · {t(`home.news.items.${item.key}.time`)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t("home.quick.title")}</h3>
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-gray-600">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {t("home.quick.item1")}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {t("home.quick.item2")}
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                {t("home.quick.item3")}
              </div>
            </div>
            <Link
              href="/alerts"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              {t("home.quick.goAlerts")} <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

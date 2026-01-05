// filename: frontend/app/chart/[symbol]/SymbolChartClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ChartContainer from "@/components/ChartContainer";
import { useSymbols, type MetricWindow } from "@/hooks/useSymbols";
import { useAuth } from "@/contexts/AuthContext";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { formatCompactNumber } from "@/lib/format";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
const FLASH_MS = 520;
const BLINK_MS = 320;

type Props = {
  symbol: string;
};

export default function SymbolChartClient({ symbol }: Props) {
  const [tf, setTf] = useState<string>("1d");
  const searchParams = useSearchParams();
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const sym = (symbol || "").toUpperCase();
  const tfWin = tf as MetricWindow;
  const { data: symbols } = useSymbols(tfWin, { tickerSymbols: sym ? [sym] : [] });
  const { isPro } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const info = useMemo(() => symbols?.find((row) => row.symbol === sym), [symbols, sym]);
  const changeValue = info?.change24h ?? NaN;
  const changeIsNumber = Number.isFinite(changeValue);
  const tfLabel = tf;
  const [, setFlashTick] = useState(0);
  const prevRef = useRef<{ price: number; change: number; volume: number; quoteVolume: number } | null>(null);
  const flashRef = useRef<{
    priceDir?: number;
    priceUntil?: number;
    changeDir?: number;
    changeUntil?: number;
    volumeDir?: number;
    volumeUntil?: number;
    quoteDir?: number;
    quoteUntil?: number;
  }>({});
  const flashTimerRef = useRef<number | null>(null);

  const fmtPrice = (x: number) =>
    Number.isFinite(x)
      ? x.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 8 })
      : "-";
  const fmtWithUnit = (value: number, unit?: string) => {
    const base = formatCompactNumber(value, locale);
    if (base === "-") return base;
    const u = (unit || "").trim();
    return u ? `${base} ${u}` : base;
  };

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // 변경 이유: 차트 진입 시 market 파라미터를 store에 반영
    const m = String(searchParams.get("market") || "").trim().toLowerCase();
    if (m === "spot" || m === "um") setMarket(m);
  }, [searchParams, setMarket]);

  useEffect(() => {
    prevRef.current = null;
    flashRef.current = {};
  }, [sym, tf]);

  useEffect(() => {
    if (!info) return;
    const next = {
      price: Number.isFinite(info.price) ? info.price : NaN,
      change: Number.isFinite(info.change24h) ? info.change24h : NaN,
      volume: Number.isFinite(info.volume) ? info.volume : NaN,
      quoteVolume: Number.isFinite(info.quoteVolume) ? info.quoteVolume : NaN
    };
    const prev = prevRef.current;
    const now = Date.now();
    let nextTimerAt = 0;
    let changed = false;

    if (prev) {
      if (Number.isFinite(next.price) && Number.isFinite(prev.price) && next.price !== prev.price) {
        const dir = next.price > prev.price ? 1 : -1;
        flashRef.current = { ...flashRef.current, priceDir: dir, priceUntil: now + FLASH_MS };
        nextTimerAt = Math.max(nextTimerAt, now + FLASH_MS);
        changed = true;
      }
      if (Number.isFinite(next.change) && Number.isFinite(prev.change) && next.change !== prev.change) {
        const dir = next.change > prev.change ? 1 : -1;
        flashRef.current = { ...flashRef.current, changeDir: dir, changeUntil: now + BLINK_MS };
        nextTimerAt = Math.max(nextTimerAt, now + BLINK_MS);
        changed = true;
      }
      if (Number.isFinite(next.volume) && Number.isFinite(prev.volume) && next.volume !== prev.volume) {
        const dir = next.volume > prev.volume ? 1 : -1;
        flashRef.current = { ...flashRef.current, volumeDir: dir, volumeUntil: now + BLINK_MS };
        nextTimerAt = Math.max(nextTimerAt, now + BLINK_MS);
        changed = true;
      }
      if (
        Number.isFinite(next.quoteVolume) &&
        Number.isFinite(prev.quoteVolume) &&
        next.quoteVolume !== prev.quoteVolume
      ) {
        const dir = next.quoteVolume > prev.quoteVolume ? 1 : -1;
        flashRef.current = { ...flashRef.current, quoteDir: dir, quoteUntil: now + BLINK_MS };
        nextTimerAt = Math.max(nextTimerAt, now + BLINK_MS);
        changed = true;
      }
    }

    prevRef.current = next;

    if (changed) setFlashTick((v) => v + 1);
    if (nextTimerAt > 0) {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      const delay = Math.max(0, nextTimerAt - Date.now());
      flashTimerRef.current = window.setTimeout(() => {
        setFlashTick((v) => v + 1);
      }, delay + 20);
    }
  }, [info]);

  const flash = flashRef.current;
  const now = Date.now();
  const priceFlash =
    flash.priceUntil && flash.priceUntil > now
      ? flash.priceDir && flash.priceDir > 0
        ? "flash-price-up"
        : "flash-price-down"
      : "";
  const changeFlash =
    flash.changeUntil && flash.changeUntil > now
      ? `${flash.changeDir && flash.changeDir > 0 ? "flash-price-up" : "flash-price-down"} flash-blink`
      : "";
  const volumeFlash =
    flash.volumeUntil && flash.volumeUntil > now
      ? `${flash.volumeDir && flash.volumeDir > 0 ? "flash-price-up" : "flash-price-down"} flash-blink`
      : "";
  const quoteFlash =
    flash.quoteUntil && flash.quoteUntil > now
      ? `${flash.quoteDir && flash.quoteDir > 0 ? "flash-price-up" : "flash-price-down"} flash-blink`
      : "";

  if (!sym) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-gray-500">
          {t("chart.invalidSymbol")}
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
                {t("common.live")}
              </span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              {t("chart.chartDesc")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/alerts"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700"
            >
              <Bell className="h-4 w-4" /> {t("chart.alertCta")}
            </Link>
            <Link
              href="/indicators"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
            >
              <Sparkles className="h-4 w-4" /> {t("chart.aiCta")}
            </Link>
          </div>
        </header>

        <section className="mb-6 grid gap-4 sm:grid-cols-4">
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t("chart.currentPrice")}</p>
            <p className={`mt-2 text-xl font-semibold text-gray-900 ${priceFlash}`}>
              {Number.isFinite(info?.price) ? fmtPrice(info?.price ?? NaN) : "-"}
            </p>
          </div>
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t("chart.change", { tf: tfLabel })}</p>
            <p
              className={`mt-2 text-xl font-semibold ${
                !changeIsNumber
                  ? "text-gray-400"
                  : changeValue >= 0
                    ? "text-emerald-600"
                    : "text-red-600"
              } ${changeFlash}`}
            >
              {changeIsNumber ? `${changeValue?.toFixed(2)}%` : "-"}
            </p>
          </div>
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t("chart.volume", { tf: tfLabel })}</p>
            <p className={`mt-2 text-xl font-semibold text-gray-900 ${volumeFlash}`}>
              {Number.isFinite(info?.volume)
                ? fmtWithUnit(info?.volume ?? NaN, info?.baseAsset?.toUpperCase())
                : "-"}
            </p>
          </div>
          <div className="fade-up rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{t("chart.quoteVolume", { tf: tfLabel })}</p>
            <p className={`mt-2 text-xl font-semibold text-gray-900 ${quoteFlash}`}>
              {Number.isFinite(info?.quoteVolume)
                ? fmtWithUnit(info?.quoteVolume ?? NaN, (info?.quoteAsset || "USDT").toUpperCase())
                : "-"}
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
                      tf === item
                        ? "bg-primary text-white"
                        : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>
              {!isPro ? (
                <span className="rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs text-gray-400">
                  {t("chart.freeHistory")}
                </span>
              ) : null}
            </div>
            <ChartContainer symbol={sym} timeframe={tf} />
          </div>

          <aside className="flex flex-col gap-4">
            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{t("chart.aiSignal")}</h3>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {t("common.pro")}
                </span>
              </div>
              <div className="mt-3 space-y-3 text-sm text-gray-600">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="font-medium text-gray-900">{t("chart.aiSignals.signal1Title")}</p>
                  <p className="text-xs text-gray-500">{t("chart.aiSignals.signal1Desc")}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <p className="font-medium text-gray-900">{t("chart.aiSignals.signal2Title")}</p>
                  <p className="text-xs text-gray-500">{t("chart.aiSignals.signal2Desc")}</p>
                </div>
              </div>
              {!isPro ? (
                <div className="mt-3 rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-xs text-gray-500">
                  {t("chart.aiUpsell")}
                  <Link href="/upgrade" className="ml-2 font-semibold text-primary">
                    {t("home.aiHighlights.upgrade")}
                  </Link>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900">{t("chart.techIndicators")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>RSI</span>
                  <span className="font-medium text-gray-900">{t("chart.techValues.rsi")}</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>MACD</span>
                  <span className="font-medium text-gray-900">{t("chart.techValues.macd")}</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>{t("chart.techValues.bollingerLabel")}</span>
                  <span className="font-medium text-gray-900">{t("chart.techValues.bollingerValue")}</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">{t("chart.news")}</h3>
                <Link href="/news" className="text-xs font-semibold text-primary">
                  {t("common.more")}
                </Link>
              </div>
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {["item1", "item2", "item3"].map((newsKey) => (
                  <li key={newsKey} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    {t(`chart.newsItems.${newsKey}`)}
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

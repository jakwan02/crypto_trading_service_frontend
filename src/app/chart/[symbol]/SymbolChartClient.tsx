// filename: frontend/app/chart/[symbol]/SymbolChartClient.tsx
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Bell, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import ChartContainer from "@/components/ChartContainer";
import FavoriteStar from "@/components/watchlists/FavoriteStar";
import { useSymbols, type MetricWindow } from "@/hooks/useSymbols";
import type { Candle } from "@/hooks/useChart";
import { useAuth } from "@/contexts/AuthContext";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { formatCompactNumber } from "@/lib/format";
import type { TechIndicators } from "@/lib/indicators";
import type { ChartIndicatorConfigV1 } from "@/lib/chartIndicatorConfig";
import {
  DEFAULT_CHART_INDICATOR_CONFIG,
  readChartIndicatorConfigFromLs,
  sanitizeChartIndicatorConfig,
  writeChartIndicatorConfigToLs
} from "@/lib/chartIndicatorConfig";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
const FLASH_MS = 800;
const BLINK_MS = 300;

type Props = {
  symbol: string;
};

export default function SymbolChartClient({ symbol }: Props) {
  const defaultTf = useSymbolsStore((s) => s.chartTf);
  const searchParams = useSearchParams();
  const setMarket = useSymbolsStore((s) => s.setMarket);
  const touchedRef = useRef(false);
  const tfParam = useMemo(() => {
    const raw = String(searchParams.get("tf") || "").trim();
    if (!raw) return "";
    const v = raw.toLowerCase();
    return TIMEFRAMES.includes(v) ? v : "";
  }, [searchParams]);
  const [tf, setTf] = useState<string>(tfParam || defaultTf || "1d");
  const setTfTouched = useCallback((next: string) => {
    touchedRef.current = true;
    setTf(next);
  }, []);
  const sym = (symbol || "").toUpperCase();
  const marketParam = useMemo(() => {
    const m = String(searchParams.get("market") || "").trim().toLowerCase();
    return m === "spot" || m === "um" ? m : "";
  }, [searchParams]);
  const tfWin = tf as MetricWindow;
  const tickerSymbols = useMemo(() => (sym ? [sym] : []), [sym]);
  const { data: symbols } = useSymbols(tfWin, {
    tickerSymbols,
    marketOverride: marketParam || undefined
  });
  const { isPro } = useAuth();
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const info = useMemo(() => symbols?.find((row) => row.symbol === sym), [symbols, sym]);
  const changeValue = info?.change24h ?? NaN;
  const changeIsNumber = Number.isFinite(changeValue);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [tech, setTech] = useState<TechIndicators | null>(null);
  const [indicatorCfg, setIndicatorCfg] = useState<ChartIndicatorConfigV1>(() => readChartIndicatorConfigFromLs());
  const [indicatorUiOpen, setIndicatorUiOpen] = useState(false);
  const indicatorUiRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    writeChartIndicatorConfigToLs(indicatorCfg);
  }, [indicatorCfg]);

  useEffect(() => {
    if (!indicatorUiOpen) return;
    const onDown = (ev: MouseEvent) => {
      const el = indicatorUiRef.current;
      if (!el) return;
      const target = ev.target as Node | null;
      if (!target) return;
      if (!el.contains(target)) setIndicatorUiOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setIndicatorUiOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [indicatorUiOpen]);

  const handleLastCandle = useCallback((candle: Candle | null) => {
    if (!candle || !Number.isFinite(candle.close)) {
      setLivePrice(null);
      return;
    }
    setLivePrice(candle.close);
  }, []);
  const handleIndicators = useCallback((indicators: TechIndicators | null) => {
    setTech(indicators);
  }, []);

  const applyCfg = useCallback((next: ChartIndicatorConfigV1) => {
    setIndicatorCfg(sanitizeChartIndicatorConfig(next));
  }, []);
  const tfLabel = tf;
  const [flashView, setFlashView] = useState<{
    priceDir?: number;
    priceUntil?: number;
    changeUntil?: number;
    volumeUntil?: number;
    quoteUntil?: number;
  }>({});
  const prevRef = useRef<{
    price: number;
    change: number;
    volume: number;
    quoteVolume: number;
    priceDisplay: string;
    changeDisplay: string;
    volumeDisplay: string;
    quoteDisplay: string;
  } | null>(null);
  const flashRef = useRef<{
    priceDir?: number;
    priceUntil?: number;
    changeUntil?: number;
    volumeUntil?: number;
    quoteUntil?: number;
  }>({});
  const flashTimerRef = useRef<number | null>(null);

  const fmtPrice = (x: number) =>
    Number.isFinite(x)
      ? x.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 8 })
      : "-";
  const fmtNum = (x: number | null | undefined, digits: number) => {
    const n = typeof x === "number" ? x : NaN;
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: digits });
  };
  const fmtWithUnit = (value: number, unit?: string) => {
    const base = formatCompactNumber(value, locale);
    if (base === "-") return base;
    const u = (unit || "").trim();
    return u ? `${base} ${u}` : base;
  };

  // 변경 이유: 표시 문자열 기준으로 갱신된 값만 플래시 처리
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // 변경 이유: 차트 진입 시 market 파라미터를 store에 반영
    if (!marketParam) return;
    if (marketParam === "spot" || marketParam === "um") setMarket(marketParam);
  }, [marketParam, setMarket]);

  useEffect(() => {
    prevRef.current = null;
    flashRef.current = {};
    queueMicrotask(() => setLivePrice(null));
    queueMicrotask(() => setFlashView({}));
  }, [sym, tf]);

  useEffect(() => {
    // 변경 이유: market overview에서 tf 쿼리를 전달하면 해당 TF가 초기값을 우선한다.
    if (!tfParam) return;
    touchedRef.current = false;
    queueMicrotask(() => setTf(tfParam));
  }, [tfParam, sym]);

  useEffect(() => {
    // 변경 이유: settings hydrate로 defaultTf가 늦게 반영될 때, 사용자가 아직 TF를 직접 바꾸지 않았다면 기본값으로 맞춘다.
    if (tfParam) return;
    if (touchedRef.current) return;
    if (!defaultTf) return;
    if (tf === defaultTf) return;
    queueMicrotask(() => setTf(defaultTf));
  }, [defaultTf, tf, tfParam]);

  const priceValue = Number.isFinite(livePrice ?? NaN) ? Number(livePrice) : info?.price ?? NaN;
  const favMarket = marketParam || info?.market || "spot";

  useEffect(() => {
    if (!info) return;
    const priceDisplay = Number.isFinite(priceValue) ? fmtPrice(priceValue) : "-";
    const changeDisplay = changeIsNumber ? `${changeValue.toFixed(2)}%` : "-";
    const volumeDisplay = Number.isFinite(info.volume)
      ? fmtWithUnit(info.volume ?? NaN, info.baseAsset?.toUpperCase())
      : "-";
    const quoteDisplay = Number.isFinite(info.quoteVolume)
      ? fmtWithUnit(info.quoteVolume ?? NaN, (info.quoteAsset || "USDT").toUpperCase())
      : "-";
    const next = {
      price: Number.isFinite(priceValue) ? priceValue : NaN,
      change: Number.isFinite(info.change24h) ? info.change24h : NaN,
      volume: Number.isFinite(info.volume) ? info.volume : NaN,
      quoteVolume: Number.isFinite(info.quoteVolume) ? info.quoteVolume : NaN,
      priceDisplay,
      changeDisplay,
      volumeDisplay,
      quoteDisplay
    };
    const prev = prevRef.current;
    const now = Date.now();
    let nextTimerAt = 0;
    let changed = false;

    if (prev) {
      const nextFlash = { ...flashRef.current };
      if (
        next.priceDisplay !== "-" &&
        prev.priceDisplay !== "-" &&
        next.priceDisplay !== prev.priceDisplay &&
        Number.isFinite(next.price) &&
        Number.isFinite(prev.price)
      ) {
        const dir = next.price > prev.price ? 1 : -1;
        nextFlash.priceDir = dir;
        nextFlash.priceUntil = Math.max(nextFlash.priceUntil ?? 0, now + FLASH_MS);
        nextTimerAt = Math.max(nextTimerAt, nextFlash.priceUntil);
        changed = true;
      }
      if (
        next.changeDisplay !== "-" &&
        prev.changeDisplay !== "-" &&
        next.changeDisplay !== prev.changeDisplay
      ) {
        nextFlash.changeUntil = Math.max(nextFlash.changeUntil ?? 0, now + BLINK_MS);
        nextTimerAt = Math.max(nextTimerAt, nextFlash.changeUntil);
        changed = true;
      }
      if (
        next.volumeDisplay !== "-" &&
        prev.volumeDisplay !== "-" &&
        next.volumeDisplay !== prev.volumeDisplay
      ) {
        nextFlash.volumeUntil = Math.max(nextFlash.volumeUntil ?? 0, now + BLINK_MS);
        nextTimerAt = Math.max(nextTimerAt, nextFlash.volumeUntil);
        changed = true;
      }
      if (
        next.quoteDisplay !== "-" &&
        prev.quoteDisplay !== "-" &&
        next.quoteDisplay !== prev.quoteDisplay
      ) {
        nextFlash.quoteUntil = Math.max(nextFlash.quoteUntil ?? 0, now + BLINK_MS);
        nextTimerAt = Math.max(nextTimerAt, nextFlash.quoteUntil);
        changed = true;
      }
      flashRef.current = nextFlash;
    }

    prevRef.current = next;

    if (changed) queueMicrotask(() => setFlashView({ ...flashRef.current }));
    if (nextTimerAt > 0) {
      if (flashTimerRef.current) window.clearTimeout(flashTimerRef.current);
      const delay = Math.max(0, nextTimerAt - Date.now());
      flashTimerRef.current = window.setTimeout(() => {
        const now = Date.now();
        const next = { ...flashRef.current };
        let pruned = false;
        if (next.priceUntil && next.priceUntil <= now) {
          delete next.priceUntil;
          delete next.priceDir;
          pruned = true;
        }
        if (next.changeUntil && next.changeUntil <= now) {
          delete next.changeUntil;
          pruned = true;
        }
        if (next.volumeUntil && next.volumeUntil <= now) {
          delete next.volumeUntil;
          pruned = true;
        }
        if (next.quoteUntil && next.quoteUntil <= now) {
          delete next.quoteUntil;
          pruned = true;
        }
        if (pruned) flashRef.current = next;
        setFlashView({ ...flashRef.current });
      }, delay + 20);
    }
  }, [info, priceValue]);

  const flash = flashView;
  const priceFlash =
    flash.priceUntil
      ? flash.priceDir && flash.priceDir > 0
        ? "flash-price-up"
        : "flash-price-down"
      : "";
  const changeFlash = flash.changeUntil ? "flash-blink" : "";
  const volumeFlash = flash.volumeUntil ? "flash-blink" : "";
  const quoteFlash = flash.quoteUntil ? "flash-blink" : "";

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
              <FavoriteStar market={favMarket} symbol={sym} />
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
              {Number.isFinite(priceValue) ? fmtPrice(priceValue) : "-"}
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
                    onClick={() => setTfTouched(item)}
                    className={`rounded-full px-3 py-1 text-xs font-medium sm:text-sm ${
                      tf === item
                        ? "bg-primary text-ink"
                        : "text-gray-600 hover:bg-primary/5 hover:text-primary"
                    }`}
                  >
                    {item.toUpperCase()}
                  </button>
                ))}
              </div>
              <div ref={indicatorUiRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIndicatorUiOpen((v) => !v)}
                  className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t("chart.indicatorsButton")}
                </button>
                {indicatorUiOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-[320px] rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-900">{t("chart.indicatorSettingsTitle")}</div>
                      <button
                        type="button"
                        onClick={() => applyCfg(DEFAULT_CHART_INDICATOR_CONFIG)}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        {t("chart.indicatorReset")}
                      </button>
                    </div>

                    <div className="space-y-3 text-xs text-gray-700">
                      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={indicatorCfg.overlays.bb.enabled}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                overlays: { ...indicatorCfg.overlays, bb: { ...indicatorCfg.overlays.bb, enabled: e.target.checked } }
                              })
                            }
                          />
                          <span>{t("chart.indicatorBbOverlay")}</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                            value={indicatorCfg.overlays.bb.n}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                overlays: { ...indicatorCfg.overlays, bb: { ...indicatorCfg.overlays.bb, n: Number(e.target.value) } }
                              })
                            }
                          />
                          <input
                            type="number"
                            step="0.1"
                            className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                            value={indicatorCfg.overlays.bb.k}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                overlays: { ...indicatorCfg.overlays, bb: { ...indicatorCfg.overlays.bb, k: Number(e.target.value) } }
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={indicatorCfg.panes.volume.enabled}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                panes: { ...indicatorCfg.panes, volume: { enabled: e.target.checked } }
                              })
                            }
                          />
                          <span>{t("chart.indicatorVolumePane")}</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={indicatorCfg.panes.rsi.enabled}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                panes: { ...indicatorCfg.panes, rsi: { ...indicatorCfg.panes.rsi, enabled: e.target.checked } }
                              })
                            }
                          />
                          <span>{t("chart.indicatorRsiPane")}</span>
                        </label>
                        <input
                          type="number"
                          className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                          value={indicatorCfg.panes.rsi.n}
                          onChange={(e) =>
                            applyCfg({
                              ...indicatorCfg,
                              panes: { ...indicatorCfg.panes, rsi: { ...indicatorCfg.panes.rsi, n: Number(e.target.value) } }
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2 rounded-xl bg-gray-50 px-3 py-2">
                        <label className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={indicatorCfg.panes.macd.enabled}
                              onChange={(e) =>
                                applyCfg({
                                  ...indicatorCfg,
                                  panes: {
                                    ...indicatorCfg.panes,
                                    macd: { ...indicatorCfg.panes.macd, enabled: e.target.checked }
                                  }
                                })
                              }
                            />
                            {t("chart.indicatorMacdPane")}
                          </span>
                        </label>
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="number"
                            className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                            value={indicatorCfg.panes.macd.fast}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                panes: {
                                  ...indicatorCfg.panes,
                                  macd: { ...indicatorCfg.panes.macd, fast: Number(e.target.value) }
                                }
                              })
                            }
                          />
                          <input
                            type="number"
                            className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                            value={indicatorCfg.panes.macd.slow}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                panes: {
                                  ...indicatorCfg.panes,
                                  macd: { ...indicatorCfg.panes.macd, slow: Number(e.target.value) }
                                }
                              })
                            }
                          />
                          <input
                            type="number"
                            className="w-16 rounded border border-gray-200 bg-white px-2 py-1"
                            value={indicatorCfg.panes.macd.signal}
                            onChange={(e) =>
                              applyCfg({
                                ...indicatorCfg,
                                panes: {
                                  ...indicatorCfg.panes,
                                  macd: { ...indicatorCfg.panes.macd, signal: Number(e.target.value) }
                                }
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              {!isPro ? (
                <span className="rounded-full border border-dashed border-gray-200 px-3 py-1 text-xs text-gray-400">
                  {t("chart.freeHistory")}
                </span>
              ) : null}
            </div>
            <ChartContainer
              symbol={sym}
              timeframe={tf}
              market={marketParam || undefined}
              onLastCandle={handleLastCandle}
              onIndicators={handleIndicators}
              indicatorConfig={indicatorCfg}
            />
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
                  <span>{`RSI(${indicatorCfg.panes.rsi.n})`}</span>
                  <span className="font-medium text-gray-900">{fmtNum(tech?.rsi14, 2)}</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>{`MACD(${indicatorCfg.panes.macd.fast},${indicatorCfg.panes.macd.slow},${indicatorCfg.panes.macd.signal})`}</span>
                  <span className="font-medium text-gray-900">{fmtNum(tech?.macd_hist, 6)}</span>
                </li>
                <li className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span>{`BB(${indicatorCfg.overlays.bb.n},${indicatorCfg.overlays.bb.k})`}</span>
                  <span className="font-medium text-gray-900">
                    {fmtNum(tech?.bb_lower, 8)} / {fmtNum(tech?.bb_mid, 8)} / {fmtNum(tech?.bb_upper, 8)}
                  </span>
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

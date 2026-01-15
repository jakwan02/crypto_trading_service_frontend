"use client";

import { create } from "zustand";

export type Market = "spot" | "um";
export type SortKey = "symbol" | "price" | "volume" | "quoteVolume" | "change24h" | "time";

type SortOrder = "asc" | "desc";

export type MetricWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M" | "1Y";
export type ChartTf = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
export type Currency = "KRW" | "USD" | "JPY" | "EUR";
export type Lang = "ko" | "en" | "ja" | "de";
export type Theme = "light" | "dark";

type AccountPrefsInput = Partial<{
  market_default: string;
  sort_default: string;
  tf_default: string;
  ccy_default: string;
  lang: string;
  theme: string;
  tz: string;
}>;

type SymbolsStoreState = {
  market: Market;
  sortKey: SortKey;
  sortOrder: SortOrder;
  metricWindow: MetricWindow;
  chartTf: ChartTf;
  ccyDefault: Currency;
  lang: Lang;
  theme: Theme;
  tz: string;
  setMarket: (market: Market) => void;
  setSortKey: (key: SortKey) => void;
  setSortOrder: (order: SortOrder) => void;
  toggleSortOrder: () => void;
  setMetricWindow: (win: MetricWindow) => void;
  setChartTf: (tf: ChartTf) => void;
  setCcyDefault: (ccy: Currency) => void;
  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  setTz: (tz: string) => void;
  applyAccountPrefs: (prefs: AccountPrefsInput) => void;
};

function mapSortDefault(value: string): SortKey | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "qv") return "quoteVolume";
  if (v === "volume") return "volume";
  if (v === "price") return "price";
  if (v === "pct") return "change24h";
  if (v === "symbol") return "symbol";
  if (v === "time") return "time";
  return null;
}

function mapMarketDefault(value: string): Market | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "spot" || v === "um") return v;
  return null;
}

function mapMetricWindow(value: string): MetricWindow | null {
  const v = String(value || "").trim();
  const allowed: Set<string> = new Set(["1m", "5m", "15m", "1h", "4h", "1d", "1w", "1M", "1Y"]);
  return allowed.has(v) ? (v as MetricWindow) : null;
}

function mapChartTf(value: string): ChartTf | null {
  const v = String(value || "").trim();
  const allowed: Set<string> = new Set(["1m", "5m", "15m", "1h", "4h", "1d", "1w"]);
  return allowed.has(v) ? (v as ChartTf) : null;
}

function mapCurrency(value: string): Currency | null {
  const v = String(value || "").trim().toUpperCase();
  if (v === "KRW" || v === "USD" || v === "JPY" || v === "EUR") return v;
  return null;
}

function mapLang(value: string): Lang | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "ko" || v === "en" || v === "ja" || v === "de") return v;
  return null;
}

function mapTheme(value: string): Theme | null {
  const v = String(value || "").trim().toLowerCase();
  if (v === "light" || v === "dark") return v;
  return null;
}

const LS_METRICS_WINDOW_KEY = "market.metrics_window";

// 변경 이유: F5 새로고침 시 metricWindow가 2번 바뀌며(기본값→URL/LS) 캐시→스켈레톤→서버 플리커가 발생하므로, 첫 렌더 전에 window를 선결정한다.
function getInitialMetricWindow(): MetricWindow {
  const fallback: MetricWindow = "1d";
  if (typeof window === "undefined") return fallback;
  try {
    const fromUrl = mapMetricWindow(new URLSearchParams(window.location.search).get("window") || "");
    if (fromUrl) return fromUrl;
  } catch {
    // ignore
  }
  try {
    const fromLs = mapMetricWindow(window.localStorage.getItem(LS_METRICS_WINDOW_KEY) || "");
    if (fromLs) return fromLs;
  } catch {
    // ignore
  }
  return fallback;
}

export const useSymbolsStore = create<SymbolsStoreState>((set) => ({
  market: "spot",
  // 기본: qv(거래대금) 내림차순
  sortKey: "quoteVolume",
  sortOrder: "desc",
  metricWindow: getInitialMetricWindow(),
  chartTf: "1d",
  ccyDefault: "KRW",
  lang: "ko",
  theme: "light",
  tz: "UTC",
  setMarket: (market) => set({ market }),
  setSortKey: (sortKey) => set({ sortKey }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === "asc" ? "desc" : "asc"
    })),
  setMetricWindow: (metricWindow) => set({ metricWindow }),
  setChartTf: (chartTf) => set({ chartTf }),
  setCcyDefault: (ccyDefault) => set({ ccyDefault }),
  setLang: (lang) => set({ lang }),
  setTheme: (theme) => set({ theme }),
  setTz: (tz) => set({ tz }),
  applyAccountPrefs: (prefs) =>
    set((state) => {
      const next: Partial<SymbolsStoreState> = {};
      const m = mapMarketDefault(String(prefs.market_default ?? ""));
      if (m) next.market = m;
      const sk = mapSortDefault(String(prefs.sort_default ?? ""));
      if (sk) next.sortKey = sk;
      const tf = mapChartTf(String(prefs.tf_default ?? ""));
      if (tf) next.chartTf = tf;
      const ccy = mapCurrency(String(prefs.ccy_default ?? ""));
      if (ccy) next.ccyDefault = ccy;
      const lang = mapLang(String(prefs.lang ?? ""));
      if (lang) next.lang = lang;
      const theme = mapTheme(String(prefs.theme ?? ""));
      if (theme) next.theme = theme;
      const tz = String(prefs.tz ?? "").trim();
      if (tz) next.tz = tz;
      if (!Object.keys(next).length) return state;
      return { ...state, ...next };
    })
}));

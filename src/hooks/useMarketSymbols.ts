// filename: frontend/src/hooks/useMarketSymbols.ts
// 변경 이유: market 페이지 부트스트랩/가시영역 WS 구독/무중단 스왑을 전용 훅으로 제공
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nextBackoff } from "@/lib/backoff";
import { MetricItemSchema, SymbolItemSchema } from "@/lib/schemas";
import { useSymbolsStore } from "@/store/useSymbolStore";

type MetricWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M" | "1Y";

export type MarketRow = {
  market: string;
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  onboardDate: number | null;
  price: number | null;
  volume: number | null;
  quoteVolume: number | null;
  change24h: number | null;
  time: number | null;
};

type MetricLite = {
  price: number | null;
  volume: number | null;
  quoteVolume: number | null;
  pctChange: number | null;
  time: number | null;
};

type MarketPayload = {
  order: string[];
  symbols: unknown[];
  tickers: unknown[];
  metrics: unknown[];
  cursor_next: number | null;
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";
const DEFAULT_WS_BASE_URL = "ws://localhost:8002";
const METRICS_FLUSH_MS = 200;
const SWAP_DEBOUNCE_MS = 200;

function stripSlash(u: string) {
  return String(u || "").trim().replace(/\/+$/, "");
}

function stripApiSuffix(u: string) {
  const x = stripSlash(u);
  return x.replace(/\/api$/i, "");
}

function toApiBase(): string {
  const env = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
  const root = stripApiSuffix(env);
  return root.endsWith("/api") ? root : `${root}/api`;
}

function toWsBase(): string {
  const wsEnvRaw = String(process.env.NEXT_PUBLIC_WS_BASE_URL || "").trim();
  const wsEnv = wsEnvRaw || DEFAULT_WS_BASE_URL;
  const apiEnv = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
  const wsPort = String(process.env.NEXT_PUBLIC_WS_PORT || "").trim();

  const apiBase = stripApiSuffix(apiEnv);
  let base = stripApiSuffix(wsEnv || apiEnv);

  if (base.startsWith("https://")) base = "wss://" + base.slice("https://".length);
  if (base.startsWith("http://")) base = "ws://" + base.slice("http://".length);

  if (!base.startsWith("ws://") && !base.startsWith("wss://")) return base;

  try {
    const url = new URL(base);
    if (wsPort) {
      url.port = wsPort;
    } else if (wsEnvRaw && stripApiSuffix(wsEnvRaw) === apiBase && url.port == "8001") {
      url.port = "8002";
    }
    base = url.toString();
  } catch {
    return base;
  }

  return stripSlash(base);
}

function getApiToken(): string {
  return String(process.env.NEXT_PUBLIC_API_TOKEN || "").trim();
}

function getWsToken(): string {
  return String(process.env.NEXT_PUBLIC_WS_TOKEN || "").trim();
}

function withApiToken(headers?: HeadersInit): HeadersInit | undefined {
  const token = getApiToken();
  if (!token) return headers;
  return { ...(headers || {}), "X-API-Token": token };
}

function getWsProtocols(): string[] | undefined {
  const token = getWsToken() || getApiToken();
  if (!token) return undefined;
  return [`token.${token}`];
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function toMs(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  if (Number.isFinite(n)) return n;
  const t = new Date(String(v)).getTime();
  return Number.isFinite(t) ? t : null;
}

function calcQuoteVolume(q: number | null, volume: number | null, price: number | null): number | null {
  if (q !== null && Number.isFinite(q)) return q;
  if (volume !== null && price !== null && volume > 0 && price > 0) return volume * price;
  return null;
}

function metricFromItem(item: Record<string, unknown>): MetricLite {
  const price = numOrNull(item.price ?? item.close);
  const volume = numOrNull(item.volume ?? item.volume_sum);
  const quoteVolume = numOrNull(item.quote_volume ?? item.quoteVolume);
  const pctChange = numOrNull(item.pct_change ?? item.pctChange);
  const time = toMs(item.time ?? item.t);
  return { price, volume, quoteVolume, pctChange, time };
}

function normalizeSymbol(item: Record<string, unknown>, fallbackMarket: string): MarketRow | null {
  const symbol = String(item.symbol || "").trim().toUpperCase();
  if (!symbol) return null;
  const market = String(item.market || fallbackMarket).trim().toLowerCase();
  const onboardRaw = item.onboard_date ?? item.onboardDate ?? item.onboard_date_ms ?? 0;
  const onboardDate = toMs(onboardRaw);
  return {
    market,
    symbol,
    status: String(item.status || ""),
    baseAsset: String(item.base_asset || item.baseAsset || ""),
    quoteAsset: String(item.quote_asset || item.quoteAsset || ""),
    onboardDate,
    price: null,
    volume: null,
    quoteVolume: null,
    change24h: null,
    time: null
  };
}

function buildWsUrl(base: string, market: string, window: string, symbols: string[]): string {
  const m = encodeURIComponent(market);
  const w = encodeURIComponent(window);
  let url = `${base}/ws_metrics?market=${m}&window=${w}`;
  if (symbols.length) {
    url += `&symbols=${encodeURIComponent(symbols.join(","))}`;
  }
  return url;
}

async function fetchMarketPayload(
  endpoint: "bootstrap" | "page",
  market: string,
  window: MetricWindow,
  limit: number,
  cursor?: number
): Promise<MarketPayload> {
  const api = toApiBase();
  const params = new URLSearchParams({
    market,
    sort: "qv",
    window,
    limit: String(limit)
  });
  if (endpoint === "page") params.set("cursor", String(cursor || 0));
  const url = `${api}/market/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: withApiToken() });
  if (!res.ok) throw new Error(`market_${endpoint}_${res.status}`);
  return (await res.json()) as MarketPayload;
}

export function useMarketSymbols(metricWindow: MetricWindow = "1d") {
  const market = useSymbolsStore((s) => s.market);
  const [order, setOrder] = useState<string[]>([]);
  const [rowMap, setRowMap] = useState<Record<string, MarketRow>>({});
  const [cursorNext, setCursorNext] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const orderRef = useRef<string[]>([]);
  const rowMapRef = useRef<Record<string, MarketRow>>({});
  const flushTimerRef = useRef<number | null>(null);
  const lastMarketRef = useRef<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const wsKeyRef = useRef<string>("");
  const desiredSymbolsRef = useRef<string[]>([]);
  const desiredKeyRef = useRef<string>("");
  const swapTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);

  const flushRows = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      setRowMap({ ...rowMapRef.current });
    }, METRICS_FLUSH_MS);
  }, []);

  const applyMetricItems = useCallback(
    (items: Record<string, unknown>[]) => {
      if (!items.length) return;
      let changed = false;
      for (const it of items) {
        const sym = String(it.symbol || "").trim().toUpperCase();
        if (!sym) continue;
        const base = rowMapRef.current[sym];
        if (!base) continue;
        const metric = metricFromItem(it);
        const price = metric.price !== null ? metric.price : base.price;
        const volume = metric.volume !== null ? metric.volume : base.volume;
        const quoteRaw = metric.quoteVolume !== null ? metric.quoteVolume : base.quoteVolume;
        const quoteVolume = calcQuoteVolume(quoteRaw, volume, price);
        const change24h = metric.pctChange !== null ? metric.pctChange : base.change24h;
        const time = metric.time !== null ? metric.time : base.time;
        rowMapRef.current[sym] = {
          ...base,
          price,
          volume,
          quoteVolume,
          change24h,
          time
        };
        changed = true;
      }
      if (changed) flushRows();
    },
    [flushRows]
  );

  const closeActiveWs = useCallback((reason: string) => {
    const active = wsRef.current;
    if (!active) return;
    try {
      active.close(1000, reason);
    } catch {}
    wsRef.current = null;
    wsKeyRef.current = "";
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
    const delay = nextBackoff(retryRef.current, { maxMs: 3000 });
    retryRef.current += 1;
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      const symbols = desiredSymbolsRef.current;
      if (symbols.length === 0) return;
      const key = desiredKeyRef.current;
      const wsBase = toWsBase();
      const url = buildWsUrl(wsBase, market, metricWindow, symbols);
      const next = new WebSocket(url, getWsProtocols());
      next.onopen = () => {
        retryRef.current = 0;
        wsRef.current = next;
        wsKeyRef.current = key;
      };
      next.onmessage = (ev) => {
        let msg: unknown;
        try {
          msg = JSON.parse(ev.data as string) as unknown;
        } catch {
          return;
        }
        const items =
          msg && typeof msg === "object" && Array.isArray((msg as { items?: unknown[] }).items)
            ? (msg as { items?: unknown[] }).items ?? []
            : [];
        const parsed = MetricItemSchema.array().safeParse(items);
        const safeItems = parsed.success ? parsed.data : [];
        if (safeItems.length) applyMetricItems(safeItems as Record<string, unknown>[]);
      };
      next.onerror = () => {
        try {
          next.close();
        } catch {}
      };
      next.onclose = () => {
        if (wsRef.current !== next) return;
        scheduleReconnect();
      };
    }, delay);
  }, [applyMetricItems, market, metricWindow]);

  const swapWs = useCallback(
    (symbols: string[], key: string) => {
      if (closedRef.current) return;
      if (!symbols.length) {
        closeActiveWs("no_symbols");
        return;
      }
      if (key === wsKeyRef.current && wsRef.current) return;
      const wsBase = toWsBase();
      const url = buildWsUrl(wsBase, market, metricWindow, symbols);
      const next = new WebSocket(url, getWsProtocols());
      let opened = false;
      next.onopen = () => {
        opened = true;
        retryRef.current = 0;
        const old = wsRef.current;
        wsRef.current = next;
        wsKeyRef.current = key;
        if (old && old.readyState <= 1) {
          try {
            old.close(1000, "swap");
          } catch {}
        }
      };
      next.onmessage = (ev) => {
        let msg: unknown;
        try {
          msg = JSON.parse(ev.data as string) as unknown;
        } catch {
          return;
        }
        const items =
          msg && typeof msg === "object" && Array.isArray((msg as { items?: unknown[] }).items)
            ? (msg as { items?: unknown[] }).items ?? []
            : [];
        const parsed = MetricItemSchema.array().safeParse(items);
        const safeItems = parsed.success ? parsed.data : [];
        if (safeItems.length) applyMetricItems(safeItems as Record<string, unknown>[]);
      };
      next.onerror = () => {
        try {
          next.close();
        } catch {}
      };
      next.onclose = () => {
        if (!opened) return;
        if (wsRef.current !== next) return;
        scheduleReconnect();
      };
    },
    [applyMetricItems, closeActiveWs, market, metricWindow, scheduleReconnect]
  );

  const setVisibleSymbols = useCallback(
    (symbols: string[]) => {
      const uniq = Array.from(
        new Set(symbols.map((s) => String(s || "").trim().toUpperCase()).filter(Boolean))
      );
      uniq.sort();
      const key = `${metricWindow}:${uniq.join(",")}`;
      if (key === desiredKeyRef.current) return;
      desiredKeyRef.current = key;
      desiredSymbolsRef.current = uniq;
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      swapTimerRef.current = window.setTimeout(() => {
        swapTimerRef.current = null;
        swapWs(uniq, key);
      }, SWAP_DEBOUNCE_MS);
    },
    [metricWindow, swapWs]
  );

  const mergePayload = useCallback(
    (payload: MarketPayload, append: boolean) => {
      const orderRaw = Array.isArray(payload.order) ? payload.order : [];
      const symParsed = SymbolItemSchema.array().safeParse(payload.symbols ?? []);
      const symbols = symParsed.success ? symParsed.data : [];

      const metaMap: Record<string, MarketRow> = {};
      for (const row of symbols) {
        const meta = normalizeSymbol(row as Record<string, unknown>, market);
        if (!meta) continue;
        metaMap[meta.symbol] = meta;
      }

      const metricParsed = MetricItemSchema.array().safeParse(payload.metrics ?? []);
      const metrics = metricParsed.success ? metricParsed.data : [];
      const metricsMap: Record<string, MetricLite> = {};
      for (const it of metrics) {
        const sym = String(it.symbol || "").trim().toUpperCase();
        if (!sym) continue;
        metricsMap[sym] = metricFromItem(it as Record<string, unknown>);
      }

      const tickerParsed = MetricItemSchema.array().safeParse(payload.tickers ?? []);
      const tickers = tickerParsed.success ? tickerParsed.data : [];
      const tickerMap: Record<string, MetricLite> = {};
      for (const it of tickers) {
        const sym = String(it.symbol || "").trim().toUpperCase();
        if (!sym) continue;
        tickerMap[sym] = metricFromItem(it as Record<string, unknown>);
      }

      const nextOrder = append ? [...orderRef.current] : [];
      const existing = new Set(nextOrder);
      for (const symRaw of orderRaw) {
        const sym = String(symRaw || "").trim().toUpperCase();
        if (!sym || existing.has(sym)) continue;
        const meta = metaMap[sym];
        if (!meta) continue;
        const metric = metricsMap[sym];
        const ticker = tickerMap[sym];
        const price = metric?.price ?? ticker?.price ?? null;
        const volume = metric?.volume ?? ticker?.volume ?? null;
        const quoteRaw = metric?.quoteVolume ?? ticker?.quoteVolume ?? null;
        const quoteVolume = calcQuoteVolume(quoteRaw, volume, price);
        const change24h = metric?.pctChange ?? ticker?.pctChange ?? null;
        const time = metric?.time ?? ticker?.time ?? null;

        rowMapRef.current[sym] = {
          ...meta,
          price,
          volume,
          quoteVolume,
          change24h,
          time
        };
        nextOrder.push(sym);
        existing.add(sym);
      }

      orderRef.current = nextOrder;
      setOrder(nextOrder);
      setRowMap({ ...rowMapRef.current });
      setCursorNext(payload.cursor_next ?? null);
    },
    [market]
  );

  const loadBootstrap = useCallback(
    async (win: MetricWindow) => {
      setIsLoading(true);
      setIsError(false);
      try {
        const payload = await fetchMarketPayload("bootstrap", market, win, 30);
        rowMapRef.current = {};
        mergePayload(payload, false);
      } catch {
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    },
    [market, mergePayload]
  );

  const loadMore = useCallback(async () => {
    if (cursorNext === null || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const payload = await fetchMarketPayload("page", market, metricWindow, 80, cursorNext);
      mergePayload(payload, true);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }, [cursorNext, isLoadingMore, market, metricWindow, mergePayload]);

  useEffect(() => {
    const m = String(market || "spot").trim().toLowerCase();
    if (lastMarketRef.current === m) return;
    lastMarketRef.current = m;
    rowMapRef.current = {};
    orderRef.current = [];
    setOrder([]);
    setRowMap({});
    setCursorNext(null);
    closeActiveWs("market_change");
    loadBootstrap(metricWindow);
  }, [closeActiveWs, loadBootstrap, market, metricWindow]);

  useEffect(() => {
    return () => {
      closedRef.current = true;
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      closeActiveWs("cleanup");
    };
  }, [closeActiveWs]);

  const rows = useMemo(() => {
    return order.map((sym) => rowMap[sym]).filter(Boolean);
  }, [order, rowMap]);

  return {
    rows,
    order,
    rowMap,
    isLoading,
    isError,
    isLoadingMore,
    hasMore: cursorNext !== null,
    loadMore,
    setVisibleSymbols
  };
}

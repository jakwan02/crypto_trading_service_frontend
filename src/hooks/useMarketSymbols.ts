// filename: frontend/src/hooks/useMarketSymbols.ts
// 변경 이유: market 페이지 부트스트랩/가시영역 WS 구독/무중단 스왑 + WS URL/토큰 정합화
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nextBackoff } from "@/lib/backoff";
import {
  getIdbMarketCache,
  getMemoryMarketCache,
  putIdbMarketCache,
  setMemoryMarketCache,
  type MarketCacheEntry
} from "@/lib/marketCache";
import { MetricItemSchema, SymbolItemSchema } from "@/lib/schemas";
import { useSymbolsStore, type SortKey } from "@/store/useSymbolStore";

type MetricWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M" | "1Y";
type MarketScope = "managed" | "all";

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
  server_time_ms?: number;
  order_dir?: string;
  scope?: string;
  sort?: string;
  q?: string | null;
};

type UseMarketSymbolsOptions = {
  sortKey?: SortKey;
  sortOrder?: "asc" | "desc";
  query?: string;
  scope?: MarketScope;
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";
const DEFAULT_WS_BASE_URL = "ws://localhost:8002";
const METRICS_FLUSH_MS = Number(process.env.NEXT_PUBLIC_OVERVIEW_FLUSH_MS || 1200);
const SWAP_DEBOUNCE_MS = Number(process.env.NEXT_PUBLIC_OVERVIEW_REPLACE_DEBOUNCE_MS || 200);
const BOOTSTRAP_LIMIT = 30;
const PAGE_LIMIT = 80;
const PREFETCH_PAGES = 3;

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
  const raw = String(process.env.NEXT_PUBLIC_WS_BASE_URL || DEFAULT_WS_BASE_URL).trim();
  let base = stripSlash(raw);
  if (base.startsWith("https://")) base = "wss://" + base.slice("https://".length);
  if (base.startsWith("http://")) base = "ws://" + base.slice("http://".length);
  return base;
}

function getApiToken(): string {
  return String(process.env.NEXT_PUBLIC_API_TOKEN || "").trim();
}

function getWsToken(): string {
  return String(process.env.NEXT_PUBLIC_WS_TOKEN || "").trim();
}

function getWsAuthToken(): string {
  return getWsToken() || getApiToken();
}

function withApiToken(headers?: HeadersInit): HeadersInit | undefined {
  const token = getApiToken();
  if (!token) return headers;
  return { ...(headers || {}), "X-API-Token": token };
}

function getWsProtocols(): string[] | undefined {
  // 변경 이유: 기본은 subprotocol 미사용(프록시/서버 호환성)
  if (process.env.NEXT_PUBLIC_WS_SUBPROTO !== "1") return undefined;
  const token = getWsAuthToken();
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

function buildWsUrl(
  base: string,
  market: string,
  window: string,
  scope: MarketScope,
  symbols: string[]
): string {
  const m = encodeURIComponent(market);
  const w = encodeURIComponent(window);
  const sc = encodeURIComponent(scope);
  let url = `${base}/ws_rt?market=${m}&window=${w}&scope=${sc}`;
  const token = getWsAuthToken();
  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }
  if (symbols.length) {
    url += `&symbols=${encodeURIComponent(symbols.join(","))}`;
  } else {
    url += "&symbols=";
  }
  return url;
}

function toSortParam(key: SortKey): string {
  if (key === "symbol") return "symbol";
  if (key === "price") return "price";
  if (key === "volume") return "volume";
  if (key === "quoteVolume") return "qv";
  if (key === "change24h") return "pct";
  return "time";
}

async function fetchMarketPayload(
  endpoint: "bootstrap" | "page",
  market: string,
  window: MetricWindow,
  scope: MarketScope,
  sortKey: SortKey,
  sortOrder: "asc" | "desc",
  query: string,
  limit: number,
  cursor?: number
): Promise<MarketPayload> {
  const api = toApiBase();
  const params = new URLSearchParams({
    market,
    scope,
    sort: toSortParam(sortKey),
    order: sortOrder,
    window,
    limit: String(limit)
  });
  if (endpoint === "page") params.set("cursor", String(cursor || 0));
  if (query) params.set("q", query);
  const url = `${api}/market/${endpoint}?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: withApiToken() });
  if (!res.ok) throw new Error(`market_${endpoint}_${res.status}`);
  return (await res.json()) as MarketPayload;
}

export function useMarketSymbols(
  metricWindow: MetricWindow = "1d",
  options: UseMarketSymbolsOptions = {}
) {
  const market = useSymbolsStore((s) => s.market);
  const sortKey = options.sortKey ?? "quoteVolume";
  const sortOrder = options.sortOrder ?? "desc";
  const scope = options.scope ?? "managed";
  const query = String(options.query || "").trim();
  const [order, setOrder] = useState<string[]>([]);
  const [rowMap, setRowMap] = useState<Record<string, MarketRow>>({});
  const [cursorNext, setCursorNext] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const orderRef = useRef<string[]>([]);
  const rowMapRef = useRef<Record<string, MarketRow>>({});
  const flushTimerRef = useRef<number | null>(null);
  const lastQueryKeyRef = useRef<string>("");
  const cacheKeyRef = useRef<string>("");
  const cacheEntryRef = useRef<MarketCacheEntry | null>(null);
  const cacheWriteTimerRef = useRef<number | null>(null);
  const prefetchRef = useRef<{ key: string; inFlight: boolean }>({ key: "", inFlight: false });

  const wsRef = useRef<WebSocket | null>(null);
  const desiredSymbolsRef = useRef<string[]>([]);
  const desiredKeyRef = useRef<string>("");
  const lastNonEmptySymbolsRef = useRef<string[]>([]);
  const swapTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);
  const pendingReplaceRef = useRef<{
    market: string;
    window: MetricWindow;
    scope: MarketScope;
    symbols: string[];
  } | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const paramsRef = useRef<{ market: string; window: MetricWindow; scope: MarketScope }>({
    market: String(market || "spot").trim().toLowerCase(),
    window: metricWindow,
    scope
  });
  const lastMarketRef = useRef<string>(String(market || "spot").trim().toLowerCase());

  const flushRows = useCallback(() => {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      setRowMap({ ...rowMapRef.current });
    }, METRICS_FLUSH_MS);
  }, []);

  const persistCache = useCallback((entry: MarketCacheEntry) => {
    cacheEntryRef.current = entry;
    const key = cacheKeyRef.current;
    setMemoryMarketCache(key, entry);
    if (cacheWriteTimerRef.current) window.clearTimeout(cacheWriteTimerRef.current);
    cacheWriteTimerRef.current = window.setTimeout(() => {
      cacheWriteTimerRef.current = null;
      void putIdbMarketCache(key, entry);
    }, 200);
  }, []);

  const applyCacheEntry = useCallback((entry: MarketCacheEntry, key: string) => {
    cacheEntryRef.current = entry;
    setMemoryMarketCache(key, entry);
    rowMapRef.current = { ...entry.rowMap };
    orderRef.current = [...entry.order];
    setOrder(orderRef.current);
    setRowMap({ ...rowMapRef.current });
    setCursorNext(entry.cursorNext ?? null);
    setIsError(false);
    setIsLoading(false);
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

  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    if (reconnectTimerRef.current) return;
    const delay = nextBackoff(retryRef.current, { maxMs: 3000 });
    retryRef.current += 1;
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current();
    }, delay);
  }, []);

  const sendReplace = useCallback(
    (payload?: { market: string; window: MetricWindow; scope: MarketScope; symbols: string[] }) => {
      const ws = wsRef.current;
      const next = payload || pendingReplaceRef.current;
      if (!next) return;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        pendingReplaceRef.current = next;
        return;
      }
      try {
        ws.send(
          JSON.stringify({
            op: "replace",
            kind: "rt",
            market: next.market,
            window: next.window,
            scope: next.scope,
            symbols: next.symbols
          })
        );
        pendingReplaceRef.current = null;
      } catch {}
    },
    []
  );

  const queueReplace = useCallback(
    (payload: { market: string; window: MetricWindow; scope: MarketScope; symbols: string[] }) => {
      pendingReplaceRef.current = payload;
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      swapTimerRef.current = window.setTimeout(() => {
        swapTimerRef.current = null;
        sendReplace();
      }, SWAP_DEBOUNCE_MS);
    },
    [sendReplace]
  );

  const connect = useCallback(() => {
    if (closedRef.current) return;
    const { market: m, window: w, scope: sc } = paramsRef.current;
    const symbols = desiredSymbolsRef.current.length
      ? desiredSymbolsRef.current
      : lastNonEmptySymbolsRef.current;
    if (!symbols.length) {
      // 변경 이유: symbols= 빈 상태에서는 WS 연결을 열지 않음
      return;
    }
    const wsBase = toWsBase();
    const url = buildWsUrl(wsBase, m, w, sc, symbols);
    let next: WebSocket;
    try {
      next = new WebSocket(url, getWsProtocols());
    } catch {
      scheduleReconnect();
      return;
    }
    wsRef.current = next;
    next.onopen = () => {
      retryRef.current = 0;
      sendReplace({ market: m, window: w, scope: sc, symbols });
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
  }, [applyMetricItems, scheduleReconnect, sendReplace]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const setVisibleSymbols = useCallback(
    (symbols: string[]) => {
      const uniq = Array.from(
        new Set(symbols.map((s) => String(s || "").trim().toUpperCase()).filter(Boolean))
      );
      uniq.sort();
      if (!uniq.length) {
        // 변경 이유: 심볼이 비어있을 때는 WS 연결을 닫고 상태를 초기화
        desiredKeyRef.current = "";
        desiredSymbolsRef.current = [];
        lastNonEmptySymbolsRef.current = [];
        pendingReplaceRef.current = null;
        try {
          wsRef.current?.close(1000, "no_symbols");
        } catch {}
        wsRef.current = null;
        return;
      }
      const key = `${market}:${metricWindow}:${scope}:${uniq.join(",")}`;
      if (key === desiredKeyRef.current) return;
      desiredKeyRef.current = key;
      desiredSymbolsRef.current = uniq;
      lastNonEmptySymbolsRef.current = uniq;
      queueReplace({
        market: paramsRef.current.market,
        window: paramsRef.current.window,
        scope: paramsRef.current.scope,
        symbols: uniq
      });
      if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
        connectRef.current();
      }
    },
    [market, metricWindow, queueReplace, scope]
  );

  const mergePayload = useCallback(
    (
      payload: MarketPayload,
      append: boolean,
      opts?: { applyState?: boolean; baseOrder?: string[]; baseRowMap?: Record<string, MarketRow> }
    ): { order: string[]; rowMap: Record<string, MarketRow>; cursorNext: number | null } => {
      const applyState = opts?.applyState !== false;
      const baseOrder = append ? opts?.baseOrder ?? orderRef.current : [];
      const baseRowMap = append ? opts?.baseRowMap ?? rowMapRef.current : {};
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

      const nextOrder = append ? [...baseOrder] : [];
      const existing = new Set(nextOrder);
      const nextRowMap: Record<string, MarketRow> = { ...baseRowMap };
      for (const symRaw of orderRaw) {
        const sym = String(symRaw || "").trim().toUpperCase();
        if (!sym) continue;
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

        nextRowMap[sym] = {
          ...meta,
          price,
          volume,
          quoteVolume,
          change24h,
          time
        };
        if (!existing.has(sym)) {
          nextOrder.push(sym);
          existing.add(sym);
        }
      }

      const cursor = payload.cursor_next ?? null;
      if (applyState) {
        rowMapRef.current = nextRowMap;
        orderRef.current = nextOrder;
        setOrder(nextOrder);
        setRowMap({ ...nextRowMap });
        setCursorNext(cursor);
      }
      return { order: nextOrder, rowMap: nextRowMap, cursorNext: cursor };
    },
    [market]
  );

  const prefetchPages = useCallback(
    async (startCursor: number | null, expectedKey: string) => {
      if (startCursor === null) return;
      if (prefetchRef.current.inFlight && prefetchRef.current.key === expectedKey) return;
      prefetchRef.current = { key: expectedKey, inFlight: true };

      let cursor: number | null = startCursor;
      let remaining = PREFETCH_PAGES;
      while (remaining > 0 && cursor !== null) {
        if (lastQueryKeyRef.current !== expectedKey) break;
        try {
          const payload = await fetchMarketPayload(
            "page",
            market,
            metricWindow,
            scope,
            sortKey,
            sortOrder,
            query,
            PAGE_LIMIT,
            cursor
          );
          if (lastQueryKeyRef.current !== expectedKey) break;
          const base = cacheEntryRef.current || {
            savedAt: Date.now(),
            order: orderRef.current,
            rowMap: rowMapRef.current,
            cursorNext,
            loadedCount: orderRef.current.length
          };
          const merged = mergePayload(payload, true, {
            applyState: false,
            baseOrder: base.order,
            baseRowMap: base.rowMap
          });
          const savedAt = Number(payload.server_time_ms || 0) || Date.now();
          const entry: MarketCacheEntry = {
            savedAt,
            order: merged.order,
            rowMap: merged.rowMap,
            cursorNext: merged.cursorNext,
            loadedCount: merged.order.length
          };
          persistCache(entry);
          cursor = merged.cursorNext;
          remaining -= 1;
        } catch {
          break;
        }
      }

      prefetchRef.current.inFlight = false;
    },
    [cursorNext, market, mergePayload, metricWindow, persistCache, query, scope, sortKey, sortOrder]
  );

  const loadBootstrap = useCallback(async () => {
    if (orderRef.current.length === 0) setIsLoading(true);
    setIsError(false);
    const expectedKey = `${market}:${metricWindow}:${scope}:${sortKey}:${sortOrder}:${query}:${BOOTSTRAP_LIMIT}`;
    try {
      const payload = await fetchMarketPayload(
        "bootstrap",
        market,
        metricWindow,
        scope,
        sortKey,
        sortOrder,
        query,
        BOOTSTRAP_LIMIT
      );
      if (lastQueryKeyRef.current !== expectedKey) return;
      rowMapRef.current = {};
      orderRef.current = [];
      const merged = mergePayload(payload, false);
      const savedAt = Number(payload.server_time_ms || 0) || Date.now();
      const entry: MarketCacheEntry = {
        savedAt,
        order: merged.order,
        rowMap: merged.rowMap,
        cursorNext: merged.cursorNext,
        loadedCount: merged.order.length
      };
      persistCache(entry);
      if (merged.cursorNext !== null) {
        void prefetchPages(merged.cursorNext, expectedKey);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [market, mergePayload, metricWindow, persistCache, prefetchPages, query, scope, sortKey, sortOrder]);

  const loadMore = useCallback(async () => {
    if (cursorNext === null || isLoadingMore) return;
    const cacheKey = cacheKeyRef.current;
    const cached = cacheEntryRef.current || getMemoryMarketCache(cacheKey);
    if (cached && cached.order.length > orderRef.current.length) {
      const nextLen = Math.min(cached.order.length, orderRef.current.length + PAGE_LIMIT);
      const nextOrder = cached.order.slice(0, nextLen);
      rowMapRef.current = { ...cached.rowMap };
      orderRef.current = nextOrder;
      setOrder(nextOrder);
      setRowMap({ ...rowMapRef.current });
      setCursorNext(cached.cursorNext ?? null);
      return;
    }
    setIsLoadingMore(true);
    const expectedKey = `${market}:${metricWindow}:${scope}:${sortKey}:${sortOrder}:${query}:${BOOTSTRAP_LIMIT}`;
    try {
      const payload = await fetchMarketPayload(
        "page",
        market,
        metricWindow,
        scope,
        sortKey,
        sortOrder,
        query,
        PAGE_LIMIT,
        cursorNext
      );
      if (lastQueryKeyRef.current !== expectedKey) return;
      const merged = mergePayload(payload, true);
      const savedAt = Number(payload.server_time_ms || 0) || Date.now();
      const entry: MarketCacheEntry = {
        savedAt,
        order: merged.order,
        rowMap: merged.rowMap,
        cursorNext: merged.cursorNext,
        loadedCount: merged.order.length
      };
      persistCache(entry);
    } catch {
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    cursorNext,
    isLoadingMore,
    market,
    mergePayload,
    metricWindow,
    persistCache,
    query,
    scope,
    sortKey,
    sortOrder
  ]);

  const queryKey = useMemo(
    () => `${market}:${metricWindow}:${scope}:${sortKey}:${sortOrder}:${query}:${BOOTSTRAP_LIMIT}`,
    [market, metricWindow, query, scope, sortKey, sortOrder]
  );

  useEffect(() => {
    if (lastQueryKeyRef.current === queryKey) return;
    lastQueryKeyRef.current = queryKey;
    cacheKeyRef.current = queryKey;
    prefetchRef.current = { key: queryKey, inFlight: false };
    cacheEntryRef.current = null;
    rowMapRef.current = {};
    orderRef.current = [];
    setOrder([]);
    setRowMap({});
    setCursorNext(null);
    setIsError(false);
    setIsLoading(true);

    let cancelled = false;
    const mem = getMemoryMarketCache(queryKey);
    if (mem) {
      applyCacheEntry(mem, queryKey);
    } else {
      void (async () => {
        const cached = await getIdbMarketCache(queryKey);
        if (cancelled || !cached) return;
        if (lastQueryKeyRef.current !== queryKey) return;
        applyCacheEntry(cached, queryKey);
      })();
    }

    loadBootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyCacheEntry, loadBootstrap, queryKey]);

  useEffect(() => {
    const m = String(market || "spot").trim().toLowerCase();
    const marketChanged = lastMarketRef.current !== m;
    if (marketChanged) {
      // 변경 이유: 시장 전환 시 이전 구독 상태를 분리
      desiredKeyRef.current = "";
      desiredSymbolsRef.current = [];
      lastNonEmptySymbolsRef.current = [];
      try {
        wsRef.current?.close(1000, "market_change");
      } catch {}
      wsRef.current = null;
    }
    // 변경 이유: SPA 이동 후 reconnect 차단 플래그 해제
    closedRef.current = false;
    retryRef.current = 0;
    paramsRef.current = { market: m, window: metricWindow, scope };
    if (lastNonEmptySymbolsRef.current.length) {
      queueReplace({
        market: m,
        window: metricWindow,
        scope,
        symbols: lastNonEmptySymbolsRef.current
      });
    }
    lastMarketRef.current = m;
  }, [market, metricWindow, queueReplace, scope]);

  useEffect(() => {
    // 변경 이유: 라우팅 복귀 시 reconnect 차단 해제
    closedRef.current = false;
    connectRef.current();
    return () => {
      closedRef.current = true;
      if (flushTimerRef.current) window.clearTimeout(flushTimerRef.current);
      if (swapTimerRef.current) window.clearTimeout(swapTimerRef.current);
      if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
      try {
        wsRef.current?.close(1000, "cleanup");
      } catch {}
      wsRef.current = null;
    };
  }, []);

  const rows = useMemo(() => {
    return order.map((sym) => rowMap[sym]).filter(Boolean);
  }, [order, rowMap]);

  return {
    rows,
    order,
    rowMap,
    // 변경 이유: 증분 로딩 재시도 판단용 cursor 노출
    cursorNext,
    isLoading,
    isError,
    isLoadingMore,
    hasMore: cursorNext !== null,
    loadMore,
    setVisibleSymbols
  };
}

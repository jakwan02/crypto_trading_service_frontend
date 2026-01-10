// filename: frontend/hooks/useSymbols.ts
// 변경 이유: ws_rt 초기 연결 보장 + 차트 과다 fetch 제거 + WS URL/토큰 정합화
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { nextBackoff } from "@/lib/backoff";
import { MetricItemSchema, SymbolItemSchema } from "@/lib/schemas";

export type MetricWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M" | "1Y";
type SortKey = "symbol" | "price" | "volume" | "quoteVolume" | "change24h" | "time";

export type SymbolRow = {
  market: string;
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  onboardDate: number; // ms

  price: number;
  volume: number;
  quoteVolume: number;
  change24h: number;
  time: number; // ms
};

type MetricMap = Record<
  string,
  {
    price: number;
    volume: number;
    quoteVolume: number;
    pctChange: number;
    time: number;
  }
>;

type SymbolCache = {
  ts: number;
  data: SymbolRow[];
};

type UseSymbolsOptions = {
  tickerSymbols?: string[];
  marketOverride?: string;
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";
const DEFAULT_WS_BASE_URL = "ws://localhost:8002";
const SYMBOLS_CACHE_TTL_MS = 15_000;
const METRICS_CACHE_TTL_MS = 15_000;
const METRICS_FLUSH_MS = Number(process.env.NEXT_PUBLIC_SYMBOLS_FLUSH_MS || 800);
const symbolsCache: Record<string, SymbolCache> = {};
const metricsCache: Record<string, { ts: number; data: MetricMap }> = {};

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

function buildRtWsUrl(
  base: string,
  market: string,
  window: string,
  symbols?: string[] | null
): string {
  const m = encodeURIComponent(market);
  const w = encodeURIComponent(window);
  let url = `${base}/ws_rt?market=${m}&window=${w}&scope=managed`;
  const token = getWsAuthToken();
  if (token) {
    url += `&token=${encodeURIComponent(token)}`;
  }
  if (symbols === null || symbols === undefined) {
    return url;
  }
  if (symbols.length) {
    url += `&symbols=${encodeURIComponent(symbols.join(","))}`;
  } else {
    url += "&symbols=";
  }
  return url;
}

function num(x: unknown, d = 0): number {
  const v = Number(x);
  return Number.isFinite(v) ? v : d;
}

function safeQuoteVolume(q: number, volume: number, price: number): number {
  if (Number.isFinite(q) && q > 0) return q;
  if (Number.isFinite(volume) && volume > 0 && Number.isFinite(price) && price > 0) {
    return volume * price;
  }
  return Number.isFinite(q) ? q : 0;
}

function toMs(x: unknown): number {
  if (!x) return 0;
  if (typeof x === "number") return x;
  const t = new Date(String(x)).getTime();
  return Number.isFinite(t) ? t : 0;
}

function normMarket(value: string): string {
  const m = String(value || "").trim().toLowerCase();
  if (m === "spot" || m === "um" || m === "cm") return m;
  return "spot";
}

function sortSymbols(rows: SymbolRow[], sortKey: SortKey, sortOrder: "asc" | "desc"): SymbolRow[] {
  const out = [...rows];
  const dir = sortOrder === "asc" ? 1 : -1;

  out.sort((a, b) => {
    if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol) * dir;
    if (sortKey === "price") return (a.price - b.price) * dir;
    if (sortKey === "volume") return (a.volume - b.volume) * dir;
    if (sortKey === "quoteVolume") return (a.quoteVolume - b.quoteVolume) * dir;
    if (sortKey === "change24h") return (a.change24h - b.change24h) * dir;
    return (a.onboardDate - b.onboardDate) * dir;
  });

  return out;
}

async function fetchSymbols(market: string, symbols?: string[]): Promise<SymbolRow[]> {
  const api = toApiBase();
  const m = String(market || "spot").trim().toLowerCase();

  // 실제 확인된 엔드포인트: /api/symbols?market=spot (응답에 items 포함)
  const params = new URLSearchParams({ market: m });
  if (symbols && symbols.length) {
    params.set("symbols", symbols.join(","));
  }
  const url = `${api}/symbols?${params.toString()}`;
  const res = await fetch(url, { cache: "no-store", headers: withApiToken() });
  if (!res.ok) throw new Error(`symbols_http_${res.status}`);

  const js = (await res.json()) as { items?: unknown[]; data?: unknown[] } | unknown[];
  const items: unknown[] =
    Array.isArray((js as { items?: unknown[] }).items)
      ? (js as { items?: unknown[] }).items ?? []
      : Array.isArray(js)
        ? js
        : Array.isArray((js as { data?: unknown[] }).data)
          ? (js as { data?: unknown[] }).data ?? []
          : [];
  const parsed = SymbolItemSchema.array().safeParse(items);
  const safeItems = parsed.success ? parsed.data : [];

  return safeItems.map((r) => {
    const onboard = toMs(r.onboard_date ?? r.onboardDate ?? r.onboard_date_ms ?? 0);

    return {
      market: String(r.market || m).toLowerCase(),
      symbol: String(r.symbol || "").toUpperCase(),
      status: String(r.status || ""),
      baseAsset: String(r.base_asset || r.baseAsset || ""),
      quoteAsset: String(r.quote_asset || r.quoteAsset || ""),
      onboardDate: onboard,

      price: 0,
      volume: 0,
      quoteVolume: 0,
      change24h: 0,
      time: onboard,
    };
  });
}

export function useSymbols(metricWindow: MetricWindow = "1d", options: UseSymbolsOptions = {}) {
  // 변경 이유: 차트 경로 market 파라미터 우선 반영
  const storeMarket = useSymbolsStore((s) => s.market);
  const market = normMarket(options.marketOverride || storeMarket);
  const sortKey = useSymbolsStore((s) => s.sortKey);
  const sortOrder = useSymbolsStore((s) => s.sortOrder);
  const tickerOverride = options.tickerSymbols;
  const tickerList = useMemo(() => {
    if (!tickerOverride || tickerOverride.length === 0) return [];
    const uniq = Array.from(
      new Set(tickerOverride.map((s) => String(s || "").trim().toUpperCase()).filter(Boolean))
    );
    uniq.sort();
    return uniq;
  }, [tickerOverride]);
  const tickerKey = useMemo(() => tickerList.join(","), [tickerList]);
  const useAllTickers = tickerOverride === undefined;
  const enableTicker = useAllTickers || tickerList.length > 0;

  const cacheKey = String(market || "spot").trim().toLowerCase();
  const cached = useAllTickers ? symbolsCache[cacheKey] : undefined;
  const cachedData =
    cached && Date.now() - cached.ts <= SYMBOLS_CACHE_TTL_MS ? cached.data : undefined;

  const metricsKey = `${cacheKey}:${metricWindow}`;
  const metricsCached = metricsCache[metricsKey];

  useEffect(() => {
    metricsKeyRef.current = metricsKey;
  }, [metricsKey]);

  // 1) 심볼 목록(REST)
  const symbolsEnabled = useAllTickers || tickerList.length > 0;
  const query = useQuery<SymbolRow[]>({
    queryKey: ["symbols", market, tickerKey],
    queryFn: () => fetchSymbols(market, useAllTickers ? undefined : tickerList),
    enabled: symbolsEnabled,
    initialData: cachedData,
    initialDataUpdatedAt: cached?.ts,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });

  useEffect(() => {
    if (!query.data || !useAllTickers) return;
    symbolsCache[cacheKey] = { ts: Date.now(), data: query.data };
  }, [cacheKey, query.data, useAllTickers]);

  // 2) window 메트릭(실시간 스냅샷) - REST
  const metricsRef = useRef<MetricMap>({});
  const [metricsVer, setMetricsVer] = useState(0);
  const metricsFlushRef = useRef<number | null>(null);
  const metricsKeyRef = useRef<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const retryRef = useRef(0);
  const closedRef = useRef(false);
  const pendingReplaceRef = useRef<{
    market: string;
    window: string;
    symbols?: string[] | null;
  } | null>(null);
  const connectRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (metricsCached && Date.now() - metricsCached.ts <= METRICS_CACHE_TTL_MS) {
      metricsRef.current = metricsCached.data;
      setMetricsVer((v) => v + 1);
      return;
    }
    metricsRef.current = {};
    setMetricsVer((v) => v + 1);
  }, [metricsKey, metricsCached]);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      try {
        const api = toApiBase();
        const m = String(market || "spot").trim().toLowerCase();

        if (!enableTicker) return;
        const params = new URLSearchParams({
          market: m,
          tf: "1m",
          window: String(metricWindow || "1d")
        });
        if (!useAllTickers && tickerKey) {
          params.set("symbols", tickerKey);
        }
        const url = `${api}/symbols/metrics?${params.toString()}`;

        const res = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
          headers: withApiToken(),
        });
        if (!res.ok) throw new Error(`metrics_http_${res.status}`);

        const js = (await res.json()) as { items?: unknown[] } | unknown[];
        const items = Array.isArray((js as { items?: unknown[] }).items)
          ? (js as { items?: unknown[] }).items ?? []
          : [];
        const parsed = MetricItemSchema.array().safeParse(items);
        const safeItems = parsed.success ? parsed.data : [];

        const map: MetricMap = {};
        for (const it of safeItems) {
          const sym = String(it.symbol || "").toUpperCase();
          if (!sym) continue;

          const price = num(it.price ?? it.close ?? 0);
          map[sym] = {
            price,
            volume: num(it.volume ?? it.volume_sum ?? 0),
            quoteVolume: num(it.quote_volume ?? it.quoteVolume ?? 0),
            pctChange: num(it.pct_change ?? it.pctChange ?? 0),
            time: num(it.time ?? it.t ?? 0)
          };
        }

        if (!cancelled) {
          metricsRef.current = map;
          metricsCache[metricsKey] = { ts: Date.now(), data: map };
          setMetricsVer((v) => v + 1);
        }
      } catch {
        if (!cancelled) {
          metricsRef.current = {};
          setMetricsVer((v) => v + 1);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [market, metricWindow, metricsKey, tickerKey, useAllTickers, enableTicker]);

  const applyMetricsItems = useCallback((items: unknown[]) => {
    const parsed = MetricItemSchema.array().safeParse(items);
    const safeItems = parsed.success ? parsed.data : [];
    if (!safeItems.length) return;

    const next = { ...metricsRef.current };
    for (const it of safeItems) {
      const sym = String(it.symbol || "").toUpperCase();
      if (!sym) continue;
      const price = num(it.price ?? it.close ?? 0);
      next[sym] = {
        price,
        volume: num(it.volume ?? it.volume_sum ?? 0),
        quoteVolume: num(it.quote_volume ?? it.quoteVolume ?? 0),
        pctChange: num(it.pct_change ?? it.pctChange ?? 0),
        time: num(it.time ?? it.t ?? 0)
      };
    }
    metricsRef.current = next;

    if (!metricsFlushRef.current) {
      metricsFlushRef.current = window.setTimeout(() => {
        metricsFlushRef.current = null;
        metricsCache[metricsKeyRef.current] = { ts: Date.now(), data: metricsRef.current };
        setMetricsVer((v) => v + 1);
      }, METRICS_FLUSH_MS);
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (closedRef.current) return;
    if (reconnectTimerRef.current) return;
    const delay = nextBackoff(retryRef.current);
    retryRef.current += 1;
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null;
      connectRef.current();
    }, delay);
  }, []);

  const sendReplace = useCallback(
    (payload?: { market: string; window: string; symbols?: string[] | null }) => {
      const ws = wsRef.current;
      const next = payload || pendingReplaceRef.current;
      if (!next) return;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        pendingReplaceRef.current = next;
        return;
      }
      try {
        const msg: Record<string, unknown> = {
          op: "replace",
          kind: "rt",
          market: next.market,
          window: next.window
        };
        if (next.symbols !== undefined && next.symbols !== null) {
          msg.symbols = next.symbols;
        }
        ws.send(JSON.stringify(msg));
        pendingReplaceRef.current = null;
      } catch {}
    },
    []
  );

  const connect = useCallback(() => {
    if (closedRef.current) return;
    const nextParams =
      pendingReplaceRef.current || {
        market: String(market || "spot").trim().toLowerCase(),
        window: String(metricWindow || "1d").trim(),
        symbols: useAllTickers ? null : tickerList
      };
    if (Array.isArray(nextParams.symbols) && nextParams.symbols.length === 0) {
      // 변경 이유: symbols= 빈 상태에서는 WS 연결을 열지 않음
      return;
    }

    // 변경 이유: React StrictMode(dev)에서 mount/unmount가 즉시 발생할 때 CONNECTING 상태에서 close()되어
    // "WebSocket is closed before the connection is established" 경고가 발생하므로, 실제 WS 생성은 다음 틱으로 지연합니다.
    if (connectTimerRef.current) {
      window.clearTimeout(connectTimerRef.current);
      connectTimerRef.current = null;
    }
    connectTimerRef.current = window.setTimeout(() => {
      connectTimerRef.current = null;
      if (closedRef.current) return;

      const wsBase = toWsBase();
      const url = buildRtWsUrl(wsBase, nextParams.market, nextParams.window, nextParams.symbols);
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
        sendReplace(nextParams);
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
        if (items.length) applyMetricsItems(items);
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
    }, 0);
  }, [applyMetricsItems, market, metricWindow, scheduleReconnect, sendReplace, tickerList, useAllTickers]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // 3-1) window 메트릭 실시간(ws_rt)
  useEffect(() => {
    if (!enableTicker) {
      pendingReplaceRef.current = null;
      if (connectTimerRef.current) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      try {
        wsRef.current?.close(1000, "no_symbols");
      } catch {}
      wsRef.current = null;
      return;
    }
    // 변경 이유: SPA 이동 후 reconnect 차단 플래그 해제
    closedRef.current = false;
    retryRef.current = 0;
    const m = String(market || "spot").trim().toLowerCase();
    const w = String(metricWindow || "1d").trim();
    const symbols = useAllTickers ? null : tickerList;
    pendingReplaceRef.current = { market: m, window: w, symbols };
    sendReplace();
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connectRef.current();
    }
  }, [market, metricWindow, tickerKey, useAllTickers, enableTicker, sendReplace, tickerList]);

  useEffect(() => {
    // 변경 이유: 라우팅 후 재마운트 시 reconnect 차단 해제
    closedRef.current = false;
    return () => {
      closedRef.current = true;
      if (connectTimerRef.current) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      if (metricsFlushRef.current) {
        window.clearTimeout(metricsFlushRef.current);
        metricsFlushRef.current = null;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      try {
        wsRef.current?.close(1000, "cleanup");
      } catch {}
      wsRef.current = null;
    };
  }, []);

  // 4) 병합 + 정렬
  const merged = useMemo(() => {
    void metricsVer;
    const base = query.data ?? [];
    const met = metricsRef.current;

    return base.map((row) => {
      const sym = row.symbol;
      const m = met[sym];

      const price = m ? m.price : row.price;
      const time = m ? m.time : row.time;

      const volume = m ? m.volume : row.volume;
      const quoteRaw = m ? m.quoteVolume : row.quoteVolume;
      const quoteVolume = safeQuoteVolume(quoteRaw, volume, price);
      const change24h = m ? m.pctChange : row.change24h;

      return { ...row, price, time, volume, quoteVolume, change24h };
    });
  }, [query.data, metricsVer]);

  const sorted = useMemo(() => sortSymbols(merged, sortKey, sortOrder), [merged, sortKey, sortOrder]);

  return { ...query, data: sorted };
}

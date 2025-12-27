// filename: frontend/hooks/useSymbols.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { nextBackoff } from "@/lib/backoff";
import { MetricItemSchema, SymbolItemSchema } from "@/lib/schemas";

export type MetricWindow = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w" | "1M" | "1Y";
type SortKey = "symbol" | "price" | "volume" | "change24h" | "time";

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

type TickerItem = {
  market?: string;
  symbol?: string;
  s?: string;
  price?: number;
  p?: number;
  volume?: number;
  v?: number;
  quote_volume?: number;
  quoteVolume?: number;
  q?: number;
  time?: number;
  t?: number;
  final?: boolean;
};

type MetricMap = Record<string, { volume: number; quoteVolume: number; pctChange: number }>;

type SymbolCache = {
  ts: number;
  data: SymbolRow[];
};

type UseSymbolsOptions = {
  tickerSymbols?: string[];
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";
const DEFAULT_WS_BASE_URL = "ws://localhost:8002";
const SYMBOLS_CACHE_TTL_MS = 15_000;
const METRICS_CACHE_TTL_MS = 15_000;
const TICK_FLUSH_MS = 500;
const METRICS_FLUSH_MS = 800;
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
  const wsEnv = String(process.env.NEXT_PUBLIC_WS_BASE_URL || DEFAULT_WS_BASE_URL).trim();
  const apiEnv = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).trim();

  const base = stripApiSuffix(wsEnv || apiEnv);

  if (base.startsWith("ws://") || base.startsWith("wss://")) return base;
  if (base.startsWith("https://")) return "wss://" + base.slice("https://".length);
  if (base.startsWith("http://")) return "ws://" + base.slice("http://".length);
  return base;
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

function sortSymbols(rows: SymbolRow[], sortKey: SortKey, sortOrder: "asc" | "desc"): SymbolRow[] {
  const out = [...rows];
  const dir = sortOrder === "asc" ? 1 : -1;

  out.sort((a, b) => {
    if (sortKey === "symbol") return a.symbol.localeCompare(b.symbol) * dir;
    if (sortKey === "price") return (a.price - b.price) * dir;
    if (sortKey === "volume") return (a.volume - b.volume) * dir;
    if (sortKey === "change24h") return (a.change24h - b.change24h) * dir;
    return (a.onboardDate - b.onboardDate) * dir;
  });

  return out;
}

async function fetchSymbols(market: string): Promise<SymbolRow[]> {
  const api = toApiBase();
  const m = String(market || "spot").trim().toLowerCase();

  // 실제 확인된 엔드포인트: /api/symbols?market=spot (응답에 items 포함)
  const url = `${api}/symbols?market=${encodeURIComponent(m)}`;
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
  const market = useSymbolsStore((s) => s.market);
  const sortKey = useSymbolsStore((s) => s.sortKey);
  const sortOrder = useSymbolsStore((s) => s.sortOrder);
  const tickerOverride = options.tickerSymbols;
  const tickerKey = useMemo(() => {
    if (!tickerOverride || tickerOverride.length === 0) return "";
    const uniq = Array.from(
      new Set(tickerOverride.map((s) => String(s || "").trim().toUpperCase()).filter(Boolean))
    );
    uniq.sort();
    return uniq.join(",");
  }, [tickerOverride]);
  const useAllTickers = tickerOverride === undefined;
  const enableTicker = useAllTickers || tickerKey.length > 0;

  const cacheKey = String(market || "spot").trim().toLowerCase();
  const cached = symbolsCache[cacheKey];
  const cachedData =
    cached && Date.now() - cached.ts <= SYMBOLS_CACHE_TTL_MS ? cached.data : undefined;

  const metricsKey = `${cacheKey}:${metricWindow}`;
  const metricsCached = metricsCache[metricsKey];

  // 1) 심볼 목록(REST)
  const query = useQuery<SymbolRow[]>({
    queryKey: ["symbols", market],
    queryFn: () => fetchSymbols(market),
    initialData: cachedData,
    initialDataUpdatedAt: cached?.ts,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });

  useEffect(() => {
    if (!query.data) return;
    symbolsCache[cacheKey] = { ts: Date.now(), data: query.data };
  }, [cacheKey, query.data]);

  // 2) 실시간 티커(ws_ticker)
  const tickRef = useRef<
    Record<string, { price: number; volume: number; quoteVolume: number; time: number }>
  >({});
  const [tickVer, setTickVer] = useState(0);
  const skipTickerWsRef = useRef(true);
  const skipMetricsWsRef = useRef(true);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && skipTickerWsRef.current) {
      skipTickerWsRef.current = false;
      return;
    }
    tickRef.current = {};
    setTickVer((v) => v + 1);

    if (!enableTicker) return;

    const m = String(market || "spot").trim().toLowerCase();
    const wsBase = toWsBase();
    const symbolsParam = useAllTickers ? "" : `&symbols=${encodeURIComponent(tickerKey)}`;
    const url = `${wsBase}/ws_ticker?market=${encodeURIComponent(m)}${symbolsParam}`;

    let ws: WebSocket | null = null;
    let closed = false;
    let lastFlush = 0;
    let flushTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let retry = 0;

    // 배치/단일 모두 반영
    const applyOne = (raw: unknown) => {
      const it = (raw && typeof raw === "object" ? (raw as TickerItem) : {}) as TickerItem;
      const sym = String(it.symbol || it.s || "").toUpperCase();
      if (!sym) return;

      const price = num(it.price ?? it.p, NaN);
      const volume = num(it.volume ?? it.v, NaN);
      const quoteVolume = num(it.quoteVolume ?? it.quote_volume ?? it.q, NaN);
      const time = num(it.time ?? it.t, 0);

      const prev = tickRef.current[sym] || { price: NaN, volume: NaN, quoteVolume: NaN, time: 0 };
      tickRef.current[sym] = {
        price: Number.isFinite(price) ? price : prev.price,
        volume: Number.isFinite(volume) ? volume : prev.volume,
        quoteVolume: Number.isFinite(quoteVolume) ? quoteVolume : prev.quoteVolume,
        time: time > 0 ? time : prev.time,
      };
    };

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(url, getWsProtocols());
      } catch {
        return;
      }

      ws.onopen = () => {
        retry = 0;
      };

      ws.onmessage = (ev) => {
        if (closed) return;

        let msg: unknown;
        try {
          msg = JSON.parse(ev.data as string) as unknown;
        } catch {
          return;
        }

        // 1) { items:[...] }
        if (msg && typeof msg === "object" && Array.isArray((msg as { items?: unknown[] }).items)) {
          for (const it of (msg as { items?: unknown[] }).items ?? []) applyOne(it);
        }
        // 2) [...]
        else if (Array.isArray(msg)) {
          for (const it of msg) applyOne(it);
        }
        // 3) 단일 객체
        else if (msg && typeof msg === "object") {
          applyOne(msg);
        } else {
          return;
        }

        const now = Date.now();
        const elapsed = now - lastFlush;
        if (elapsed >= TICK_FLUSH_MS) {
          lastFlush = now;
          setTickVer((v) => v + 1);
          return;
        }

        if (!flushTimer) {
          flushTimer = window.setTimeout(() => {
            lastFlush = Date.now();
            flushTimer = null;
            setTickVer((v) => v + 1);
          }, TICK_FLUSH_MS - elapsed);
        }
      };

      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };

      ws.onclose = () => {
        if (closed) return;
        const delay = nextBackoff(retry);
        retry += 1;
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (flushTimer) window.clearTimeout(flushTimer);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      try {
        ws?.close(1000, "cleanup");
      } catch {}
      ws = null;
    };
  }, [market, tickerKey, useAllTickers, enableTicker]);

  // 3) window 메트릭(거래량/변동률) - REST
  const metricsRef = useRef<MetricMap>({});
  const [metricsVer, setMetricsVer] = useState(0);
  const metricsFlushRef = useRef<number | null>(null);

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

        const url =
          `${api}/symbols/metrics` +
          `?market=${encodeURIComponent(m)}` +
          `&tf=1m` +
          `&window=${encodeURIComponent(metricWindow)}`;

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

          map[sym] = {
            volume: num(it.volume ?? it.volume_sum ?? 0),
            quoteVolume: num(it.quote_volume ?? it.quoteVolume ?? 0),
            pctChange: num(it.pct_change ?? it.pctChange ?? 0),
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
  }, [market, metricWindow, metricsKey]);

  // 3-1) window 메트릭 실시간(ws_metrics)
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && skipMetricsWsRef.current) {
      skipMetricsWsRef.current = false;
      return;
    }
    const m = String(market || "spot").trim().toLowerCase();
    const w = String(metricWindow || "1d").trim();
    const wsBase = toWsBase();
    const url =
      `${wsBase}/ws_metrics` +
      `?market=${encodeURIComponent(m)}` +
      `&window=${encodeURIComponent(w)}`;

    let ws: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: number | null = null;
    let retry = 0;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(url, getWsProtocols());
      } catch {
        return;
      }

      ws.onopen = () => {
        retry = 0;
      };

      ws.onmessage = (ev) => {
        if (closed) return;
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
        if (!safeItems.length) return;

        const next = { ...metricsRef.current };
        for (const it of safeItems) {
          const sym = String(it.symbol || "").toUpperCase();
          if (!sym) continue;
          next[sym] = {
            volume: num(it.volume ?? it.volume_sum ?? 0),
            quoteVolume: num(it.quote_volume ?? it.quoteVolume ?? 0),
            pctChange: num(it.pct_change ?? it.pctChange ?? 0),
          };
        }
        metricsRef.current = next;

        if (!metricsFlushRef.current) {
          metricsFlushRef.current = window.setTimeout(() => {
            metricsFlushRef.current = null;
            metricsCache[metricsKey] = { ts: Date.now(), data: metricsRef.current };
            setMetricsVer((v) => v + 1);
          }, METRICS_FLUSH_MS);
        }
      };

      ws.onerror = () => {
        try {
          ws?.close();
        } catch {}
      };

      ws.onclose = () => {
        if (closed) return;
        const delay = nextBackoff(retry);
        retry += 1;
        if (reconnectTimer) window.clearTimeout(reconnectTimer);
        reconnectTimer = window.setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      closed = true;
      if (metricsFlushRef.current) {
        window.clearTimeout(metricsFlushRef.current);
        metricsFlushRef.current = null;
      }
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      try {
        ws?.close(1000, "cleanup");
      } catch {}
      ws = null;
    };
  }, [market, metricWindow, metricsKey]);

  // 4) 병합 + 정렬
  const merged = useMemo(() => {
    void tickVer;
    void metricsVer;
    const base = query.data ?? [];
    const tick = tickRef.current;
    const met = metricsRef.current;

    return base.map((row) => {
      const sym = row.symbol;

      const t = tick[sym];
      const m = met[sym];

      const price = t ? t.price : row.price;
      const time = t ? t.time : row.time;

      const volume = m ? m.volume : t ? t.volume : row.volume;
      const quoteRaw = m ? m.quoteVolume : t ? t.quoteVolume : row.quoteVolume;
      const quoteVolume = safeQuoteVolume(quoteRaw, volume, price);
      const change24h = m ? m.pctChange : row.change24h;

      return { ...row, price, time, volume, quoteVolume, change24h };
    });
  }, [query.data, tickVer, metricsVer]);

  const sorted = useMemo(() => sortSymbols(merged, sortKey, sortOrder), [merged, sortKey, sortOrder]);

  return { ...query, data: sorted };
}

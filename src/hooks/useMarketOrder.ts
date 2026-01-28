// filename: frontend/src/hooks/useMarketOrder.ts
// 변경 이유: 차트 좌/우 심볼 네비게이션을 위해 market 정렬 order(전체 심볼 리스트)를 가볍게 로드/캐시한다.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MetricWindow, SortKey } from "@/store/useSymbolStore";
import {
  getIdbMarketOrderCache,
  getMemoryMarketOrderCache,
  putIdbMarketOrderCache,
  setMemoryMarketOrderCache
} from "@/lib/marketOrderCache";

type MarketScope = "managed" | "all";

type MarketOrderPayload = {
  order: string[];
  cursor_next: number | null;
  server_time_ms?: number;
};

// 변경 이유: NEXT_PUBLIC_API_BASE_URL 미설정 시에도 단일 오리진(/api) 기본값으로 동작하게 한다.
const DEFAULT_API_BASE_URL = "/";

function stripSlash(u: string) {
  return String(u || "").trim().replace(/\/+$/, "");
}

function stripApiSuffix(u: string) {
  const x = stripSlash(u);
  return x.replace(/\/api$/i, "");
}

function toApiBase(): string {
  const envRaw = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (envRaw === "/" || envRaw.startsWith("/")) return "/api";
  const env = (envRaw || DEFAULT_API_BASE_URL).trim();
  const root = stripApiSuffix(env);
  return root.endsWith("/api") ? root : `${root}/api`;
}

function toSortParam(key: SortKey): string {
  if (key === "symbol") return "symbol";
  if (key === "price") return "price";
  if (key === "volume") return "volume";
  if (key === "quoteVolume") return "qv";
  if (key === "change24h") return "pct";
  return "time";
}

function normMarket(value: string): string {
  const m = String(value || "").trim().toLowerCase();
  if (m === "spot" || m === "um" || m === "cm") return m;
  return "um";
}

function buildKey(args: {
  market: string;
  scope: MarketScope;
  window: MetricWindow;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  query: string;
}): string {
  const m = normMarket(args.market);
  const sc = args.scope;
  const w = String(args.window || "1d").trim();
  const sort = toSortParam(args.sortKey);
  const order = args.sortOrder === "asc" ? "asc" : "desc";
  const q = String(args.query || "").trim();
  return `market_order|m=${m}|sc=${sc}|w=${w}|sort=${sort}|ord=${order}|q=${q}`;
}

async function fetchOrderAll(args: {
  market: string;
  scope: MarketScope;
  window: MetricWindow;
  sortKey: SortKey;
  sortOrder: "asc" | "desc";
  query: string;
  pageLimit?: number;
}): Promise<{ savedAt: number; order: string[] }> {
  const api = toApiBase();
  const m = normMarket(args.market);
  const sc = args.scope;
  const w = String(args.window || "1d").trim();
  const sort = toSortParam(args.sortKey);
  const ord = args.sortOrder === "asc" ? "asc" : "desc";
  const q = String(args.query || "").trim();
  const limit = Math.min(200, Math.max(1, Number(args.pageLimit || 200)));

  const out: string[] = [];
  let cursor = 0;
  let savedAt = Date.now();
  let guard = 0;

  while (guard < 500) {
    guard += 1;
    const params = new URLSearchParams({
      market: m,
      scope: sc,
      sort,
      order: ord,
      window: w,
      limit: String(limit),
      cursor: String(cursor)
    });
    if (q) params.set("q", q);
    const url = `${api}/market/order?${params.toString()}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`market_order_http_${res.status}`);
    const js = (await res.json()) as MarketOrderPayload;
    const chunk = Array.isArray(js.order) ? js.order : [];
    if (typeof js.server_time_ms === "number" && Number.isFinite(js.server_time_ms)) {
      savedAt = js.server_time_ms;
    }
    for (const sym of chunk) {
      const s = String(sym || "").trim().toUpperCase();
      if (s) out.push(s);
    }
    if (!js.cursor_next || chunk.length === 0) break;
    cursor = js.cursor_next;
  }

  return { savedAt, order: out };
}

export function useMarketOrder(
  args: {
    market: string;
    window: MetricWindow;
    sortKey: SortKey;
    sortOrder: "asc" | "desc";
    scope?: MarketScope;
    query?: string;
  },
  options: { enabled?: boolean } = {}
) {
  const enabled = options.enabled !== false;
  const scope = (args.scope || "managed") as MarketScope;
  const query = String(args.query || "").trim();
  const key = useMemo(
    () =>
      buildKey({
        market: args.market,
        scope,
        window: args.window,
        sortKey: args.sortKey,
        sortOrder: args.sortOrder,
        query
      }),
    [args.market, args.sortKey, args.sortOrder, args.window, query, scope]
  );

  const [order, setOrder] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    reqIdRef.current += 1;
    const rid = reqIdRef.current;
    setIsError(false);
    setIsLoading(true);

    const mem = getMemoryMarketOrderCache(key);
    if (mem?.order?.length) {
      setOrder(mem.order);
      setSavedAt(mem.savedAt || 0);
      setIsLoading(false);
      return;
    }

    void (async () => {
      const cached = await getIdbMarketOrderCache(key);
      if (rid !== reqIdRef.current) return;
      if (cached?.order?.length) {
        setMemoryMarketOrderCache(key, cached);
        setOrder(cached.order);
        setSavedAt(cached.savedAt || 0);
        setIsLoading(false);
        return;
      }

      try {
        const fetched = await fetchOrderAll({
          market: args.market,
          scope,
          window: args.window,
          sortKey: args.sortKey,
          sortOrder: args.sortOrder,
          query
        });
        if (rid !== reqIdRef.current) return;
        setMemoryMarketOrderCache(key, fetched);
        await putIdbMarketOrderCache(key, fetched);
        setOrder(fetched.order);
        setSavedAt(fetched.savedAt || 0);
        setIsLoading(false);
      } catch {
        if (rid !== reqIdRef.current) return;
        setIsError(true);
        setIsLoading(false);
      }
    })();
  }, [args.market, args.sortKey, args.sortOrder, args.window, enabled, key, query, scope]);

  return { key, order, savedAt, isLoading, isError };
}

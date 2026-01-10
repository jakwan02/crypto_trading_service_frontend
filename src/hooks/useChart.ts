// filename: frontend/hooks/useChart.ts
// 변경 이유: REST 스냅샷 선적용 + WS 델타 버퍼링으로 레이스 제거
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { nextBackoff } from "@/lib/backoff";
import { decodeBundleBytes, fetchChartBundle, type ChartBundle } from "@/lib/chartBundle";
import {
  broadcastBundleReady,
  getIdbBundleBytes,
  getMemoryBundle,
  onBundleReady,
  putIdbBundleBytes,
  setMemoryBundle
} from "@/lib/chartCache";

export type Candle = {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type WsUpd = {
  type?: string;
  market?: string;
  symbol?: string;
  tf?: string;

  // 레거시 키 지원
  m?: string;
  s?: string;
  k?: string;

  candle?: unknown;
  t?: number;
  o?: number;
  h?: number;
  l?: number;
  c?: number;
  v?: number;
  x?: boolean;

  time?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";
const DEFAULT_WS_BASE_URL = "ws://localhost:8002";
const REVALIDATE_MS = 300_000;
const HARD_REFRESH_COOLDOWN_MS = 10_000;
const TF_LIMIT: Record<string, number> = {
  "1m": 720,
  "5m": 720,
  "15m": 720,
  "1h": 720,
  "4h": 360,
  "1d": 365,
  "1w": 260
};
const TF_STEP_MS: Record<string, number> = {
  "1m": 60_000,
  "5m": 5 * 60_000,
  "15m": 15 * 60_000,
  "1h": 60 * 60_000,
  "4h": 4 * 60 * 60_000,
  "1d": 24 * 60 * 60_000,
  "1w": 7 * 24 * 60 * 60_000
};

function normTf(tf: string): string {
  const v = String(tf || "").trim().toLowerCase();
  if (!v) return "1m";
  return v;
}

function normMarket(value: string): string {
  const m = String(value || "").trim().toLowerCase();
  if (m === "spot" || m === "um" || m === "cm") return m;
  return "spot";
}

function getTfLimit(tf: string): number {
  const key = normTf(tf);
  return TF_LIMIT[key] ?? 300;
}

function getTfStepMs(tf: string): number {
  const key = normTf(tf);
  return TF_STEP_MS[key] ?? 60_000;
}

function stripApiSuffix(url: string): string {
  const u = String(url || "").trim().replace(/\/+$/, "");
  return u.replace(/\/api$/i, "");
}

function toApiBase(): string {
  const apiEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  const base = stripApiSuffix(apiEnv || DEFAULT_API_BASE_URL);
  return base.endsWith("/api") ? base : `${base}/api`;
}

function toWsBase(): string {
  const raw = String(process.env.NEXT_PUBLIC_WS_BASE_URL || DEFAULT_WS_BASE_URL).trim();
  let base = raw.replace(/\/+$/, "");
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

function toMs(raw: unknown): number {
  // 2025년 기준 ms epoch은 1e12 이상, seconds epoch은 1e9대
  if (raw === null || raw === undefined || raw === "") return 0;
  if (typeof raw === "string") {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  const t = Number(raw);
  if (!Number.isFinite(t) || t <= 0) return 0;
  if (t < 100_000_000_000) return Math.floor(t * 1000);
  return Math.floor(t);
}

function parseCandle(x: unknown): Candle | null {
  if (!x || typeof x !== "object") return null;

  const obj = x as Record<string, unknown>;
  const t = toMs(obj.t ?? obj.time ?? 0);
  if (!Number.isFinite(t) || t <= 0) return null;

  const o = Number(obj.o ?? obj.open ?? 0);
  const h = Number(obj.h ?? obj.high ?? 0);
  const l = Number(obj.l ?? obj.low ?? 0);
  const c = Number(obj.c ?? obj.close ?? 0);
  const v = Number(obj.v ?? obj.volume ?? 0);

  return {
    time: t,
    open: Number.isFinite(o) ? o : 0,
    high: Number.isFinite(h) ? h : 0,
    low: Number.isFinite(l) ? l : 0,
    close: Number.isFinite(c) ? c : 0,
    volume: Number.isFinite(v) ? v : 0
  };
}

function upsert(arr: Candle[], it: Candle, maxLen: number): Candle[] {
  if (arr.length === 0) return [it];

  const last = arr[arr.length - 1];

  if (it.time === last.time) {
    const out = arr.slice(0, -1);
    out.push(it);
    return out;
  }

  if (it.time > last.time) {
    const out = arr.concat(it);
    if (out.length > maxLen) return out.slice(out.length - maxLen);
    return out;
  }

  // 과거 시점 업데이트 방어: 정렬+중복 제거
  const m = new Map<number, Candle>();
  for (const c of arr) m.set(c.time, c);
  m.set(it.time, it);

  const out = Array.from(m.values()).sort((a, b) => a.time - b.time);
  if (out.length > maxLen) return out.slice(out.length - maxLen);
  return out;
}

export function useChart(symbol: string | null, timeframe: string, marketOverride?: string) {
  const tf = normTf(timeframe);
  // 변경 이유: 차트 경로 market 파라미터 우선 반영
  const storeMarket = useSymbolsStore((s) => s.market);
  const market = normMarket(marketOverride || storeMarket);

  const [data, setData] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyNotice, setHistoryNotice] = useState<{ kind: "error" | "end"; text: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const connectTimerRef = useRef<number | null>(null);
  const aliveRef = useRef(true);
  const retryRef = useRef(0);
  const dataRef = useRef<Candle[]>([]);
  const restReadyRef = useRef(false);
  const pendingDeltaRef = useRef<Candle | null>(null);
  const lastCandleTimeRef = useRef(0);
  const bundleReqIdRef = useRef(0);
  const lastBundleAtRef = useRef(0);
  const hardRefreshAtRef = useRef(0);
  const hardRefreshInFlightRef = useRef(false);
  const noticeTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const swrTimerRef = useRef<number | null>(null);
  const pendingReplaceRef = useRef<{ market: string; symbol: string; tf: string; limit: number } | null>(null);
  const bundleKeyRef = useRef<string>("");
  const wsEverOpenRef = useRef(false);
  const paramsRef = useRef<{ market: string; symbol: string; tf: string; limit: number }>({
    market: normMarket(market || "spot"),
    symbol: String(symbol || "").trim().toUpperCase(),
    tf: tf,
    limit: getTfLimit(tf)
  });
  const connectRef = useRef<() => void>(() => {});
  const closedRef = useRef(false);

  useEffect(() => {
    // 변경 이유: 라우팅 후 재마운트 시 reconnect 차단 해제
    closedRef.current = false;
    aliveRef.current = true;
    return () => {
      closedRef.current = true;
      aliveRef.current = false;
      if (connectTimerRef.current) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
      if (noticeTimerRef.current) {
        window.clearTimeout(noticeTimerRef.current);
        noticeTimerRef.current = null;
      }
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (swrTimerRef.current) {
        window.clearTimeout(swrTimerRef.current);
        swrTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const pushNotice = (kind: "error" | "end", text: string) => {
    setHistoryNotice({ kind, text });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setHistoryNotice(null);
    }, 2400);
  };

  // 변경 이유: 번들/캐시에서 TF별 limit를 정확히 적용
  const buildSnapshot = useCallback(
    (raw: unknown[], tempRaw?: unknown | null, limitOverride?: number): Candle[] => {
      const out: Candle[] = [];
      const seen = new Set<number>();
      const limit = limitOverride ?? paramsRef.current.limit;

    for (const x of raw) {
      const c = parseCandle(x);
      if (!c) continue;
      if (seen.has(c.time)) continue;
      seen.add(c.time);
      out.push(c);
    }

    out.sort((a, b) => a.time - b.time);

    const temp = parseCandle(tempRaw);
    if (temp) {
      const lastTime = out.length ? out[out.length - 1].time : 0;
      if (!lastTime || temp.time > lastTime) return upsert(out, temp, Math.max(limit, 1));
    }
      return out;
    },
    []
  );

  const applySnapshot = useCallback(
    (next: Candle[], savedAt?: number, tempByTf?: Record<string, Candle | null>) => {
    const { market: m, symbol: s, tf: t } = paramsRef.current;
    const pending = pendingDeltaRef.current;
    const merged = pending ? upsert(next, pending, 1200) : next;
    const cacheKey = `${m}:${s}`;
    const prev = getMemoryBundle(cacheKey);
    const nextSavedAt = savedAt ?? prev?.savedAt ?? Date.now();
    const nextDataByTf = { ...(prev?.dataByTf || {}), [t]: merged };
    const nextTempByTf = tempByTf ?? prev?.tempByTf;

    pendingDeltaRef.current = null;
    restReadyRef.current = true;
    lastCandleTimeRef.current = merged.length ? merged[merged.length - 1].time : 0;
    if (nextSavedAt > lastBundleAtRef.current) {
      lastBundleAtRef.current = nextSavedAt;
    }
    setError(null);
    setData(merged);
    setMemoryBundle(cacheKey, nextDataByTf, nextTempByTf, nextSavedAt);
  }, []);

  // 변경 이유: 번들 응답을 TF별 Candle[]로 변환해 캐시와 UI에 재사용
  // 변경 이유: 번들에서 tempByTf까지 캐시로 반영
  const buildBundleCache = useCallback(
    (bundle: ChartBundle): { dataByTf: Record<string, Candle[]>; tempByTf: Record<string, Candle | null> } => {
      const dataByTf: Record<string, Candle[]> = {};
      const tempByTf: Record<string, Candle | null> = {};
      if (!bundle || !bundle.items) return { dataByTf, tempByTf };
      const temps = bundle.tempByTf || {};
      for (const [tfKey, raw] of Object.entries(bundle.items)) {
        if (!Array.isArray(raw)) continue;
        const tempRaw = (tfKey in temps ? temps[tfKey] : bundle.temp?.[tfKey]) ?? null;
        tempByTf[tfKey] = tempRaw ? parseCandle(tempRaw) : null;
        dataByTf[tfKey] = buildSnapshot(raw, tempRaw, getTfLimit(tfKey));
      }
      return { dataByTf, tempByTf };
    },
    [buildSnapshot]
  );

  const fetchBundle = useCallback(
    async (reason: "init" | "swr" | "ws_reconnect" | "gap") => {
      bundleReqIdRef.current += 1;
      const rid = bundleReqIdRef.current;
      const { market: m, symbol: s, tf: t } = paramsRef.current;
      if (!s) return;

      const apiBase = toApiBase();
      const cacheKey = `${m}:${s}`;

      try {
        const res = await fetchChartBundle({
          apiBase,
          market: m,
          symbol: s,
          tf: t,
          headers: withApiToken()
        });
        if (rid !== bundleReqIdRef.current) return;
        if (bundleKeyRef.current && bundleKeyRef.current !== cacheKey) return;

        const savedAt = Number(res.bundle?.now || 0) || Date.now();
        const { dataByTf, tempByTf } = buildBundleCache(res.bundle);
        lastBundleAtRef.current = savedAt;
        setMemoryBundle(cacheKey, dataByTf, tempByTf, savedAt);
        if (res.bytes?.length) {
          await putIdbBundleBytes(cacheKey, res.bytes, savedAt);
          broadcastBundleReady(cacheKey, savedAt);
        }

        const currentTf = paramsRef.current.tf;
        const current = dataByTf[currentTf];
        if (current && current.length) {
          applySnapshot(current, savedAt, tempByTf);
        }
      } catch {
        if (reason === "init" && dataRef.current.length === 0) {
          setError("snapshot_error");
        }
      } finally {
        hardRefreshInFlightRef.current = false;
      }
    },
    [applySnapshot, buildBundleCache]
  );

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

  const triggerHardRefresh = useCallback(
    (reason: "ws_reconnect" | "gap") => {
      const now = Date.now();
      if (hardRefreshInFlightRef.current) return;
      if (now - hardRefreshAtRef.current < HARD_REFRESH_COOLDOWN_MS) return;
      hardRefreshAtRef.current = now;
      hardRefreshInFlightRef.current = true;
      void fetchBundle(reason);
    },
    [fetchBundle]
  );

  const sendReplace = useCallback(
    (payload?: { market: string; symbol: string; tf: string; limit: number }) => {
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
            kind: "chart",
            market: next.market,
            symbol: next.symbol,
            tf: next.tf,
            limit: next.limit
          })
        );
        pendingReplaceRef.current = null;
      } catch {}
    },
    []
  );

  const connect = useCallback(() => {
    if (closedRef.current) return;
    const nextParams =
      pendingReplaceRef.current || {
        market: paramsRef.current.market,
        symbol: paramsRef.current.symbol,
        tf: paramsRef.current.tf,
        limit: paramsRef.current.limit
      };
    if (!nextParams.symbol) return;
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
      const url =
        `${wsBase}/ws_chart` +
        `?market=${encodeURIComponent(nextParams.market)}` +
        `&symbol=${encodeURIComponent(nextParams.symbol)}` +
        `&tf=${encodeURIComponent(nextParams.tf)}` +
        `&limit=${encodeURIComponent(String(nextParams.limit))}`;
      const token = getWsAuthToken();
      const finalUrl = token ? `${url}&token=${encodeURIComponent(token)}` : url;

      let next: WebSocket;
      try {
        next = new WebSocket(finalUrl, getWsProtocols());
      } catch {
        scheduleReconnect();
        return;
      }
      wsRef.current = next;

      next.onopen = () => {
        retryRef.current = 0;
        setError(null);
        sendReplace(nextParams);
        if (wsEverOpenRef.current) {
          triggerHardRefresh("ws_reconnect");
        }
        wsEverOpenRef.current = true;
      };

      next.onmessage = (ev) => {
        let msg: unknown;
        try {
          msg = JSON.parse(ev.data) as unknown;
        } catch {
          return;
        }

        const { market: m, symbol: s, tf: t } = paramsRef.current;

        const upd = msg as WsUpd;
        const uSym = String(upd.symbol ?? upd.s ?? "").trim().toUpperCase();
        if (uSym && uSym !== s) return;
        const uMkt = String(upd.market ?? upd.m ?? "").trim().toLowerCase();
        if (uMkt && uMkt !== m) return;
        const mtf = upd.tf ? normTf(String(upd.tf)) : t;
        if (mtf !== t) return;

        let c = parseCandle(upd.candle);
        if (!c) c = parseCandle(upd);
        if (!c) return;

        if (!restReadyRef.current) {
          pendingDeltaRef.current = c;
          return;
        }

        const lastTime = lastCandleTimeRef.current;
        const step = getTfStepMs(t);
        if (lastTime > 0 && c.time - lastTime > step * 2) {
          triggerHardRefresh("gap");
        }

        setData((prev) => {
          const nextList = upsert(prev, c as Candle, 1200);
          const cacheKey = `${m}:${s}`;
          const prevBundle = getMemoryBundle(cacheKey);
          if (prevBundle) {
            const nextTempByTf = { ...(prevBundle.tempByTf || {}), [t]: c };
            setMemoryBundle(
              cacheKey,
              { ...prevBundle.dataByTf, [t]: nextList },
              nextTempByTf,
              prevBundle.savedAt
            );
          }
          lastCandleTimeRef.current = nextList.length ? nextList[nextList.length - 1].time : 0;
          return nextList;
        });
      };

      next.onerror = () => {
        setError("ws_error");
        try {
          next.close();
        } catch {}
      };

      next.onclose = () => {
        if (wsRef.current !== next) return;
        scheduleReconnect();
      };
    }, 0);
  }, [scheduleReconnect, sendReplace, triggerHardRefresh]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    const unsubscribe = onBundleReady((msg) => {
      if (!msg || msg.type !== "bundle_ready") return;
      if (msg.key !== bundleKeyRef.current) return;
      if (msg.savedAt <= lastBundleAtRef.current) return;
      void (async () => {
        const cached = await getIdbBundleBytes(msg.key);
        if (!cached || cached.savedAt < msg.savedAt) return;
        const bundle = decodeBundleBytes(cached.data);
        const { dataByTf, tempByTf } = buildBundleCache(bundle);
        setMemoryBundle(msg.key, dataByTf, tempByTf, cached.savedAt);
        const current = dataByTf[paramsRef.current.tf];
        if (current && current.length > 0) {
          applySnapshot(current, cached.savedAt, tempByTf);
        }
      })();
    });

    return () => {
      unsubscribe();
    };
  }, [applySnapshot, buildBundleCache]);

  useEffect(() => {
    const sym = String(symbol || "").trim().toUpperCase();
    const m = normMarket(market || "");
    const tfNorm = normTf(tf);
    const limit = getTfLimit(tfNorm);
    paramsRef.current = { market: m, symbol: sym, tf: tfNorm, limit };
    restReadyRef.current = false;
    pendingDeltaRef.current = null;
    lastCandleTimeRef.current = 0;
    wsEverOpenRef.current = false;
    // 변경 이유: SPA 이동 후 reconnect 차단 플래그 해제
    closedRef.current = false;
    setError(null);
    retryRef.current = 0;

    if (!sym) {
      setData([]);
      return;
    }

    const cacheKey = `${m}:${sym}`;
    bundleKeyRef.current = cacheKey;

    let cancelled = false;

    const mem = getMemoryBundle(cacheKey);
    if (mem && mem.dataByTf[tfNorm] && mem.dataByTf[tfNorm].length > 0) {
      applySnapshot(mem.dataByTf[tfNorm], mem.savedAt, mem.tempByTf);
    } else {
      setData([]);
      void (async () => {
        const cached = await getIdbBundleBytes(cacheKey);
        if (cancelled || !cached) return;
        // 변경 이유: 최신 번들 적용 이후 오래된 IDB 스냅샷 덮어쓰기 방지
        if (cached.savedAt <= lastBundleAtRef.current) return;
        const bundle = decodeBundleBytes(cached.data);
        const { dataByTf, tempByTf } = buildBundleCache(bundle);
        setMemoryBundle(cacheKey, dataByTf, tempByTf, cached.savedAt);
        const current = dataByTf[paramsRef.current.tf];
        if (current && current.length > 0) {
          applySnapshot(current, cached.savedAt, tempByTf);
        }
      })();
    }

    fetchBundle("init");

    pendingReplaceRef.current = { market: m, symbol: sym, tf: tfNorm, limit };
    sendReplace();
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connectRef.current();
    }

    if (swrTimerRef.current) {
      window.clearTimeout(swrTimerRef.current);
      swrTimerRef.current = null;
    }
    swrTimerRef.current = window.setTimeout(function tick() {
      if (closedRef.current) return;
      const age = Date.now() - lastBundleAtRef.current;
      if (age >= REVALIDATE_MS) {
        fetchBundle("swr");
      }
      swrTimerRef.current = window.setTimeout(tick, REVALIDATE_MS);
    }, REVALIDATE_MS);

    return () => {
      cancelled = true;
      if (swrTimerRef.current) {
        window.clearTimeout(swrTimerRef.current);
        swrTimerRef.current = null;
      }
    };
  }, [applySnapshot, buildBundleCache, fetchBundle, market, sendReplace, symbol, tf]);

    const loadMore = async () => {
      const sym = String(symbol || "").trim().toUpperCase();
      const m = String(market || "").trim().toLowerCase();
      const tfNorm = normTf(tf);
      const limit = getTfLimit(tfNorm);
      if (!sym || loadingMore) return;

      const oldest = data && data.length > 0 ? data[0].time : 0;
      if (!oldest) return;

    setLoadingMore(true);
    try {
      const api = toApiBase();
      const url =
        `${api}/chart/history` +
        `?market=${encodeURIComponent(m)}` +
        `&symbol=${encodeURIComponent(sym)}` +
        `&tf=${encodeURIComponent(tfNorm)}` +
        `&before=${encodeURIComponent(String(oldest))}` +
        `&limit=${encodeURIComponent(String(limit))}`;

      const res = await fetch(url, { cache: "no-store", headers: withApiToken() });
      if (!res.ok) throw new Error(`history_http_${res.status}`);
      const js = await res.json();
      const items = Array.isArray(js?.items) ? js.items : [];

      const older: Candle[] = [];
      for (const it of items) {
        const c = parseCandle(it);
        if (c) older.push(c);
      }

      if (older.length > 0) {
        const merged = [...older, ...data];
        const out: Candle[] = [];
        const seen = new Set<number>();
        for (const c of merged) {
          if (seen.has(c.time)) continue;
          seen.add(c.time);
          out.push(c);
        }
        out.sort((a, b) => a.time - b.time);
        setData(out);
        const cacheKey = `${m}:${sym}`;
        const prev = getMemoryBundle(cacheKey);
        const savedAt = prev?.savedAt ?? Date.now();
        setMemoryBundle(cacheKey, { ...(prev?.dataByTf || {}), [tfNorm]: out }, prev?.tempByTf, savedAt);
      } else {
        pushNotice("end", "과거 데이터가 더 없습니다.");
      }
    } catch {
      setError("history_error");
      pushNotice("error", "이전 데이터 로드에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoadingMore(false);
    }
  };

  return { data, error, loadMore, loadingMore, historyNotice };
}

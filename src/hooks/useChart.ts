// filename: frontend/hooks/useChart.ts
// 변경 이유: ws_chart 초기 연결 보장 + REST 스냅샷 time 파싱 보강
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSymbolsStore } from "@/store/useSymbolStore";
import { nextBackoff } from "@/lib/backoff";

export type Candle = {
  time: number; // ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type WsSnap = {
  type?: string;
  market?: string;
  symbol?: string;
  tf?: string;
  candles?: unknown[];
  final?: unknown[];
  temp?: unknown | null;
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

type ChartCache = {
  ts: number;
  data: Candle[];
};

const DEFAULT_API_BASE_URL = "http://localhost:8001";
const DEFAULT_WS_BASE_URL = "ws://localhost:8002";
const CHART_CACHE_TTL_MS = 15_000;
const chartCache = new Map<string, ChartCache>();
const TF_LIMIT: Record<string, number> = {
  "1m": 720,
  "5m": 720,
  "15m": 720,
  "1h": 720,
  "4h": 360,
  "1d": 365,
  "1w": 260
};

function normTf(tf: string): string {
  const v = String(tf || "").trim().toLowerCase();
  if (!v) return "1m";
  return v;
}

function getTfLimit(tf: string): number {
  const key = normTf(tf);
  return TF_LIMIT[key] ?? 300;
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

function isSnapshotMsg(msg: unknown): boolean {
  if (!msg || typeof msg !== "object") return false;
  const obj = msg as Record<string, unknown>;
  const tp = String(obj.type || "").toLowerCase();
  if (tp === "snapshot") return true;

  // type이 없어도 스냅샷은 배열을 포함한다
  if (Array.isArray(obj.candles)) return true;
  if (Array.isArray(obj.final)) return true;

  return false;
}

export function useChart(symbol: string | null, timeframe: string) {
  const tf = normTf(timeframe);
  const market = useSymbolsStore((s) => s.market);

  const [data, setData] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyNotice, setHistoryNotice] = useState<{ kind: "error" | "end"; text: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const aliveRef = useRef(true);
  const restReqIdRef = useRef(0);
  const retryRef = useRef(0);
  const dataRef = useRef<Candle[]>([]);
  const noticeTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const pendingReplaceRef = useRef<{ market: string; symbol: string; tf: string; limit: number } | null>(null);
  const paramsRef = useRef<{ market: string; symbol: string; tf: string; limit: number }>({
    market: String(market || "spot").trim().toLowerCase(),
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

  const buildSnapshot = useCallback((raw: unknown[], tempRaw?: unknown | null): Candle[] => {
    const out: Candle[] = [];
    const seen = new Set<number>();
    const limit = paramsRef.current.limit;

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
  }, []);

  const applySnapshot = useCallback(
    (next: Candle[], source: "ws" | "rest") => {
      if (!next.length) return;
      const cur = dataRef.current || [];
      const curLast = cur.length ? cur[cur.length - 1].time : 0;
      const nextLast = next[next.length - 1].time;

      if (curLast && nextLast < curLast) {
        if (source === "rest") return;
        return;
      }

      const { market: m, symbol: s, tf: t } = paramsRef.current;
      setData(next);
      chartCache.set(`${m}:${s}:${t}`, { ts: Date.now(), data: next });
    },
    [setData]
  );

  const fetchSnapshot = useCallback(
    async (reason: "init" | "ws_error") => {
      restReqIdRef.current += 1;
      const rid = restReqIdRef.current;
      const { market: m, symbol: s, tf: t, limit } = paramsRef.current;
      if (!s) return;

      const apiBase = toApiBase();
      const snapUrl =
        `${apiBase}/chart` +
        `?market=${encodeURIComponent(m)}` +
        `&symbol=${encodeURIComponent(s)}` +
        `&tf=${encodeURIComponent(t)}` +
        `&limit=${encodeURIComponent(String(limit))}`;

      try {
        const res = await fetch(snapUrl, { cache: "no-store", headers: withApiToken() });
        if (!res.ok) throw new Error(`chart_http_${res.status}`);
        const js = await res.json();
        const items = Array.isArray(js?.items) ? js.items : [];
        const temp = js?.temp ?? null;
        const snap = buildSnapshot(items, temp);
        if (rid !== restReqIdRef.current) return;
        if (!aliveRef.current || closedRef.current) return;
        if (reason === "ws_error" && dataRef.current.length > 0) return;
        applySnapshot(snap, "rest");
      } catch {
        if (reason === "ws_error" && dataRef.current.length === 0) {
          setError("snapshot_error");
        }
      }
    },
    [applySnapshot, buildSnapshot]
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
    };

    next.onmessage = (ev) => {
      let msg: unknown;
      try {
        msg = JSON.parse(ev.data) as unknown;
      } catch {
        return;
      }

      const { market: m, symbol: s, tf: t } = paramsRef.current;

      if (isSnapshotMsg(msg)) {
        const snap = msg as WsSnap;
        if (snap.tf && normTf(String(snap.tf)) !== t) return;
        if (snap.market && String(snap.market).toLowerCase() !== m) return;
        if (snap.symbol && String(snap.symbol).toUpperCase() !== s) return;
        const raw = Array.isArray(snap.candles) ? snap.candles : Array.isArray(snap.final) ? snap.final : [];
        const merged = buildSnapshot(raw, snap.temp);
        applySnapshot(merged, "ws");
        return;
      }

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

      setData((prev) => {
        const nextList = upsert(prev, c as Candle, 1200);
        chartCache.set(`${m}:${s}:${t}`, { ts: Date.now(), data: nextList });
        return nextList;
      });
    };

    next.onerror = () => {
      setError("ws_error");
      fetchSnapshot("ws_error");
      try {
        next.close();
      } catch {}
    };

    next.onclose = () => {
      scheduleReconnect();
    };
  }, [applySnapshot, buildSnapshot, fetchSnapshot, scheduleReconnect, sendReplace]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    const sym = String(symbol || "").trim().toUpperCase();
    const m = String(market || "").trim().toLowerCase();
    const tfNorm = normTf(tf);
    const limit = getTfLimit(tfNorm);
    paramsRef.current = { market: m, symbol: sym, tf: tfNorm, limit };

    if (!sym) {
      setData([]);
      setError(null);
      return;
    }

    const cacheKey = `${m}:${sym}:${tfNorm}`;
    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.ts <= CHART_CACHE_TTL_MS) {
      setData(cached.data);
    } else {
      setData([]);
    }
    setError(null);
    retryRef.current = 0;

    fetchSnapshot("init");

    pendingReplaceRef.current = { market: m, symbol: sym, tf: tfNorm, limit };
    sendReplace();
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      connectRef.current();
    }
  }, [fetchSnapshot, market, sendReplace, symbol, tf]);

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
        const cacheKey = `${m}:${sym}:${tfNorm}`;
        chartCache.set(cacheKey, { ts: Date.now(), data: out });
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

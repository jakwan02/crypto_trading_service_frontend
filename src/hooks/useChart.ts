// filename: frontend/hooks/useChart.ts
"use client";

import { useEffect, useRef, useState } from "react";
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

  return base.replace(/\/+$/, "");
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

function toMs(t: number): number {
  // 2025년 기준 ms epoch은 1e12 이상, seconds epoch은 1e9대
  if (!Number.isFinite(t) || t <= 0) return 0;
  if (t < 100_000_000_000) return Math.floor(t * 1000);
  return Math.floor(t);
}

function parseCandle(x: unknown): Candle | null {
  if (!x || typeof x !== "object") return null;

  const obj = x as Record<string, unknown>;
  const tRaw = Number(obj.t ?? obj.time ?? 0);
  const t = toMs(tRaw);
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
  const connIdRef = useRef(0);
  const retryRef = useRef(0);
  const dataRef = useRef<Candle[]>([]);
  const noticeTimerRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const skipInitialWsRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
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

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" && skipInitialWsRef.current) {
      skipInitialWsRef.current = false;
      return;
    }
    const sym = String(symbol || "").trim().toUpperCase();
    const m = String(market || "").trim().toLowerCase();
    const tfNorm = normTf(tf);
    const limit = getTfLimit(tfNorm);
    const cacheKey = `${m}:${sym}:${tfNorm}`;

    if (!sym) {
      setData([]);
      setError(null);
      return;
    }

    connIdRef.current += 1;
    const myConnId = connIdRef.current;

    // 기존 소켓 종료
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;

    const cached = chartCache.get(cacheKey);
    if (cached && Date.now() - cached.ts <= CHART_CACHE_TTL_MS) {
      setData(cached.data);
    } else {
      setData([]);
    }
    setError(null);
    retryRef.current = 0;

    const wsBase = toWsBase();
    const apiBase = toApiBase();
    const url =
      `${wsBase}/ws_chart` +
      `?market=${encodeURIComponent(m)}` +
      `&symbol=${encodeURIComponent(sym)}` +
      `&tf=${encodeURIComponent(tfNorm)}` +
      `&limit=${encodeURIComponent(String(limit))}`;

    let ws: WebSocket | null = null;
    let stopped = false;
    let restReqId = 0;

    const buildSnapshot = (raw: unknown[], tempRaw?: unknown | null): Candle[] => {
      const out: Candle[] = [];
      const seen = new Set<number>();

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
    };

    const applySnapshot = (next: Candle[], source: "ws" | "rest") => {
      if (!next.length) return;

      const cur = dataRef.current || [];
      const curLast = cur.length ? cur[cur.length - 1].time : 0;
      const nextLast = next[next.length - 1].time;

      if (curLast && nextLast < curLast) {
        if (source === "rest") return;
        return;
      }

      setData(next);
      chartCache.set(cacheKey, { ts: Date.now(), data: next });
    };

    const fetchSnapshot = async (reason: "init" | "ws_error") => {
      restReqId += 1;
      const rid = restReqId;

      const snapUrl =
        `${apiBase}/chart` +
        `?market=${encodeURIComponent(m)}` +
        `&symbol=${encodeURIComponent(sym)}` +
        `&tf=${encodeURIComponent(tfNorm)}` +
        `&limit=${encodeURIComponent(String(limit))}`;

      try {
        const res = await fetch(snapUrl, { cache: "no-store", headers: withApiToken() });
        if (!res.ok) throw new Error(`chart_http_${res.status}`);
        const js = await res.json();
        const items = Array.isArray(js?.items) ? js.items : [];
        const temp = js?.temp ?? null;
        const snap = buildSnapshot(items, temp);
        if (rid !== restReqId) return;
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;
        if (reason === "ws_error" && dataRef.current.length > 0) return;
        applySnapshot(snap, "rest");
      } catch {
        if (reason === "ws_error" && dataRef.current.length === 0) {
          setError("snapshot_error");
        }
      }
    };

    const connect = () => {
      if (!aliveRef.current || stopped) return;
      if (connIdRef.current !== myConnId) return;

      ws = new WebSocket(url, getWsProtocols());
      wsRef.current = ws;

      ws.onopen = () => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) {
          try {
            ws?.close();
          } catch {}
          return;
        }
        retryRef.current = 0;
        setError(null);
      };

      ws.onmessage = (ev) => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;

        let msg: unknown;
        try {
          msg = JSON.parse(ev.data) as unknown;
        } catch {
          return;
        }

        // SNAPSHOT(type 유무 모두 지원)
        if (isSnapshotMsg(msg)) {
          const snap = msg as WsSnap;

          if (snap.tf && normTf(String(snap.tf)) !== tfNorm) return;
          if (snap.market && String(snap.market).toLowerCase() !== m) return;
          if (snap.symbol && String(snap.symbol).toUpperCase() !== sym) return;

          const raw = Array.isArray(snap.candles) ? snap.candles : Array.isArray(snap.final) ? snap.final : [];
          const merged = buildSnapshot(raw, snap.temp);
          applySnapshot(merged, "ws");
          return;
        }

        // UPDATE
        const upd = msg as WsUpd;

        const uSym = String(upd.symbol ?? upd.s ?? "").trim().toUpperCase();
        if (uSym && uSym !== sym) return;

        const uMkt = String(upd.market ?? upd.m ?? "").trim().toLowerCase();
        if (uMkt && uMkt !== m) return;

        const mtf = upd.tf ? normTf(String(upd.tf)) : tfNorm;
        if (mtf !== tfNorm) return;

        let c = parseCandle(upd.candle);
        if (!c) c = parseCandle(upd);
        if (!c) return;

        setData((prev) => {
          const next = upsert(prev, c as Candle, 1200);
          chartCache.set(cacheKey, { ts: Date.now(), data: next });
          return next;
        });
      };

      ws.onerror = () => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;
        setError("ws_error");
        fetchSnapshot("ws_error");
      };

      ws.onclose = () => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;

        const delay = nextBackoff(retryRef.current);
        retryRef.current += 1;

        if (reconnectTimerRef.current) window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = window.setTimeout(() => {
          if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;
          connect();
        }, delay);
      };
    };

    fetchSnapshot("init");
    connect();

    return () => {
      stopped = true;
      try {
        ws?.close();
      } catch {}
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [symbol, market, tf]);

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

// filename: frontend/hooks/useChart.ts
"use client";

import { useEffect, useRef, useState } from "react";
import { useSymbolsStore } from "@/store/useSymbolStore";

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
  candles?: any[];
  final?: any[];
  temp?: any | null;
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

  candle?: any;
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

const CHART_CACHE_TTL_MS = 15_000;
const chartCache = new Map<string, ChartCache>();

function normTf(tf: string): string {
  const v = String(tf || "").trim().toLowerCase();
  if (!v) return "1m";
  return v;
}

function stripApiSuffix(url: string): string {
  const u = String(url || "").trim().replace(/\/+$/, "");
  return u.replace(/\/api$/i, "");
}

function toApiBase(): string {
  const apiEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  const base = stripApiSuffix(apiEnv || "http://localhost:8000");
  return base.endsWith("/api") ? base : `${base}/api`;
}

function toWsBase(): string {
  const wsEnv = process.env.NEXT_PUBLIC_WS_BASE_URL;
  const apiEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  const base = stripApiSuffix(wsEnv || apiEnv || "http://localhost:8000");
  if (base.startsWith("ws://") || base.startsWith("wss://")) return base;
  if (base.startsWith("https://")) return "wss://" + base.slice("https://".length);
  if (base.startsWith("http://")) return "ws://" + base.slice("http://".length);
  return base;
}

function toMs(t: number): number {
  // 2025년 기준 ms epoch은 1e12 이상, seconds epoch은 1e9대
  if (!Number.isFinite(t) || t <= 0) return 0;
  if (t < 100_000_000_000) return Math.floor(t * 1000);
  return Math.floor(t);
}

function parseCandle(x: any): Candle | null {
  if (!x || typeof x !== "object") return null;

  const tRaw = Number(x.t ?? x.time ?? 0);
  const t = toMs(tRaw);
  if (!Number.isFinite(t) || t <= 0) return null;

  const o = Number(x.o ?? x.open ?? 0);
  const h = Number(x.h ?? x.high ?? 0);
  const l = Number(x.l ?? x.low ?? 0);
  const c = Number(x.c ?? x.close ?? 0);
  const v = Number(x.v ?? x.volume ?? 0);

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

function isSnapshotMsg(msg: any): boolean {
  if (!msg || typeof msg !== "object") return false;
  const tp = String(msg.type || "").toLowerCase();
  if (tp === "snapshot") return true;

  // type이 없어도 스냅샷은 배열을 포함한다
  if (Array.isArray(msg.candles)) return true;
  if (Array.isArray(msg.final)) return true;

  return false;
}

export function useChart(symbol: string | null, timeframe: string) {
  const tf = normTf(timeframe);
  const market = useSymbolsStore((s: any) => (s?.market ?? s?.activeMarket ?? s?.selMarket ?? "spot")) as string;

  const [data, setData] = useState<Candle[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const aliveRef = useRef(true);
  const connIdRef = useRef(0);
  const retryRef = useRef(0);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    const sym = String(symbol || "").trim().toUpperCase();
    const m = String(market || "").trim().toLowerCase();
    const tfNorm = normTf(tf);
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
    const url =
      `${wsBase}/ws_chart` +
      `?market=${encodeURIComponent(m)}` +
      `&symbol=${encodeURIComponent(sym)}` +
      `&tf=${encodeURIComponent(tfNorm)}` +
      `&limit=${encodeURIComponent(String(300))}`;

    let ws: WebSocket | null = null;
    let stopped = false;

    const connect = () => {
      if (!aliveRef.current || stopped) return;
      if (connIdRef.current !== myConnId) return;

      ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) {
          try {
            ws?.close();
          } catch {}
          return;
        }
      };

      ws.onmessage = (ev) => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;

        let msg: any;
        try {
          msg = JSON.parse(ev.data);
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

          // temp가 있으면 마지막 캔들에 합친다
          const temp = parseCandle(snap.temp);
          let merged = out;
          if (temp) merged = upsert(out, temp, 1200);

          setData(merged);
          chartCache.set(cacheKey, { ts: Date.now(), data: merged });
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
      };

      ws.onclose = () => {
        if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;

        const n = Math.min(6, retryRef.current);
        const delay = Math.round(250 * Math.pow(2, n));
        retryRef.current += 1;

        window.setTimeout(() => {
          if (!aliveRef.current || stopped || connIdRef.current !== myConnId) return;
          connect();
        }, delay);
      };
    };

    connect();

    return () => {
      stopped = true;
      try {
        ws?.close();
      } catch {}
    };
  }, [symbol, market, tf]);

  const loadMore = async () => {
    const sym = String(symbol || "").trim().toUpperCase();
    const m = String(market || "").trim().toLowerCase();
    const tfNorm = normTf(tf);
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
        `&limit=300`;

      const res = await fetch(url, { cache: "no-store" });
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
      }
    } catch (e) {
      setError("history_error");
    } finally {
      setLoadingMore(false);
    }
  };

  return { data, error, loadMore, loadingMore };
}

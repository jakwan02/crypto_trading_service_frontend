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

// 변경 이유: NEXT_PUBLIC_* 미설정 시에도 단일 오리진(/api + /ws_*)을 기본으로 해 CORS/포트 드리프트를 제거한다.
const DEFAULT_API_BASE_URL = "/";
const DEFAULT_WS_BASE_URL = "/";
const REVALIDATE_MS = 300_000;
const HARD_REFRESH_COOLDOWN_MS = 10_000;
const TF_LIMIT: Record<string, number> = {
  "1m": 2000,
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
  if (m === "spot" || m === "um") return m;
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

function _dedupSortCandles(items: Candle[]): Candle[] {
  const m = new Map<number, Candle>();
  for (const c of items || []) {
    if (!c || !Number.isFinite(c.time) || c.time <= 0) continue;
    m.set(c.time, c);
  }
  return Array.from(m.values()).sort((a, b) => a.time - b.time);
}

function _trimToContiguousSuffix(items: Candle[], stepMs: number, minKeep: number = 2): Candle[] {
  if (!items || items.length < 2) return items || [];
  const step = Number(stepMs || 0);
  if (!Number.isFinite(step) || step <= 0) return items;

  // 변경 이유: 마지막 1개만 고립된(outlier) 바가 남으면(예: 20→30으로 점프) 차트가 “건너뛴” 것처럼 보여 치명적이므로,
  //           연속 구간 길이가 minKeep 미만이면 outlier를 버리고 다시 계산한다.
  let cur = items;
  while (cur.length >= 2) {
    let start = cur.length - 1;
    while (start > 0) {
      if (cur[start].time - cur[start - 1].time !== step) break;
      start -= 1;
    }
    const suffixLen = cur.length - start;
    if (suffixLen >= Math.max(1, Math.trunc(minKeep))) return cur.slice(start);
    cur = cur.slice(0, cur.length - 1);
  }
  return cur;
}

function _canAppendNoGap(lastTimeMs: number, nextTimeMs: number, stepMs: number): boolean {
  if (!lastTimeMs) return true;
  const step = Number(stepMs || 0);
  if (!Number.isFinite(step) || step <= 0) return true;
  return nextTimeMs === lastTimeMs || nextTimeMs === lastTimeMs + step;
}

function stripApiSuffix(url: string): string {
  const u = String(url || "").trim().replace(/\/+$/, "");
  return u.replace(/\/api$/i, "");
}

function toApiBase(): string {
  const apiEnv = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  if (apiEnv === "/" || apiEnv.startsWith("/")) return "/api";
  const base = stripApiSuffix((apiEnv || DEFAULT_API_BASE_URL).trim());
  return base.endsWith("/api") ? base : `${base}/api`;
}

function toWsBase(): string {
  const raw = String(process.env.NEXT_PUBLIC_WS_BASE_URL || DEFAULT_WS_BASE_URL).trim();
  let base = raw.replace(/\/+$/, "");
  if (base === "" || base === "/") {
    if (typeof window === "undefined") return "";
    const proto = window.location.protocol === "https:" ? "wss://" : "ws://";
    return proto + window.location.host;
  }
  if (base.startsWith("https://")) base = "wss://" + base.slice("https://".length);
  if (base.startsWith("http://")) base = "ws://" + base.slice("http://".length);
  return base;
}

function shouldTrimContiguous(): boolean {
  // 변경 이유: gap(누락)이 있어도 "최근 몇 개만 남는" UX를 방지하기 위해 기본은 fail-open(트림 비활성).
  const raw = String(process.env.NEXT_PUBLIC_CHART_TRIM_CONTIGUOUS_SUFFIX || "").trim().toLowerCase();
  return raw === "1" || raw === "true";
}

function getWsProtocols(): string[] | undefined {
  // 변경 이유: 기본은 subprotocol 미사용(프록시/서버 호환성)
  if (process.env.NEXT_PUBLIC_WS_SUBPROTO !== "1") return undefined;
  return undefined;
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
    (raw: unknown[], tempRaw?: unknown | null, limitOverride?: number, tfOverride?: string): Candle[] => {
      const limit = limitOverride ?? paramsRef.current.limit;
      const tfKey = tfOverride ?? paramsRef.current.tf;
      const step = getTfStepMs(tfKey);

      const parsed: Candle[] = [];
      for (const x of raw || []) {
        const c = parseCandle(x);
        if (!c) continue;
        parsed.push(c);
      }

      let out = _dedupSortCandles(parsed);
      if (limit > 0 && out.length > limit) out = out.slice(out.length - limit);
      if (shouldTrimContiguous()) out = _trimToContiguousSuffix(out, step);

      const temp = parseCandle(tempRaw);
      if (temp) {
        const lastTime = out.length ? out[out.length - 1].time : 0;
        // 변경 이유: 스냅샷이 dirty/갭 상태여도 최신 temp는 사용자에게 즉시 보여주는 것이 UX/운영 최선이다.
        if (!lastTime || temp.time >= lastTime) return upsert(out, temp, Math.max(limit, 1));
      }
      return out;
    },
    []
  );

  const applySnapshot = useCallback(
    (
      next: Candle[],
      savedAt: number | undefined,
      tempByTf: Record<string, Candle | null> | undefined,
      source: "cache" | "server"
    ) => {
      const { market: m, symbol: s, tf: t } = paramsRef.current;
      const cacheKey = `${m}:${s}`;
      const prev = getMemoryBundle(cacheKey);
      const nextSavedAt = savedAt ?? prev?.savedAt ?? Date.now();
      const nextTempByTf = tempByTf ?? prev?.tempByTf;
      const step = getTfStepMs(t);

      // 변경 이유: 캐시 미리보기 동안 WS 델타를 즉시 붙이지 않아 "잠깐 생겼다 사라지는" 마지막 캔들(현재 티커) 플리커를 제거
      const pending = source === "server" ? pendingDeltaRef.current : null;
      const base0 = _dedupSortCandles(next || []);
      const base = shouldTrimContiguous() ? _trimToContiguousSuffix(base0, step) : base0;
      const baseLast = base.length ? base[base.length - 1].time : 0;
      const merged = pending && (!baseLast || pending.time >= baseLast) ? upsert(base, pending, 1200) : base;

      if (source === "server") {
        if (!pending) {
          pendingDeltaRef.current = null;
        } else if (baseLast && pending.time <= baseLast) {
          pendingDeltaRef.current = null;
        } else if (!baseLast || pending.time >= baseLast) {
          pendingDeltaRef.current = null;
        }
        restReadyRef.current = true;
      }

      lastCandleTimeRef.current = merged.length ? merged[merged.length - 1].time : 0;
      if (nextSavedAt > lastBundleAtRef.current) {
        lastBundleAtRef.current = nextSavedAt;
      }
      setError(null);
      setData(merged);
      setMemoryBundle(cacheKey, { ...(prev?.dataByTf || {}), [t]: merged }, nextTempByTf, nextSavedAt);
    },
    []
  );

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
        dataByTf[tfKey] = buildSnapshot(raw, tempRaw, getTfLimit(tfKey), tfKey);
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
          // 변경 이유: 차트 초기 진입 지연 편차(모든 TF 번들 다운로드/파싱)를 줄이기 위해 현재 TF만 요청한다.
          tfs: [t]
        });
        if (rid !== bundleReqIdRef.current) return;
        if (bundleKeyRef.current && bundleKeyRef.current !== cacheKey) return;

        const savedAt = Number(res.bundle?.now || 0) || Date.now();
        const { dataByTf, tempByTf } = buildBundleCache(res.bundle);
        lastBundleAtRef.current = savedAt;
        // 변경 이유: 번들을 현재 TF만 요청하더라도, 기존에 캐시된 다른 TF 스냅샷은 유지해 TF 전환 UX를 보존한다.
        const prev = getMemoryBundle(cacheKey);
        setMemoryBundle(
          cacheKey,
          { ...(prev?.dataByTf || {}), ...dataByTf },
          { ...(prev?.tempByTf || {}), ...tempByTf },
          savedAt
        );
        if (res.bytes?.length) {
          await putIdbBundleBytes(cacheKey, res.bytes, savedAt);
          broadcastBundleReady(cacheKey, savedAt);
        }

        const currentTf = paramsRef.current.tf;
        const current = dataByTf[currentTf];
        if (current && current.length) {
          applySnapshot(current, savedAt, tempByTf, "server");
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
        // 변경 이유: 1개라도 누락되면 차트/지표가 뒤틀리므로, gap이 감지되면 해당 델타를 적용하지 않고 서버 스냅샷으로 재동기화한다.
        if (lastTime > 0 && c.time > lastTime + step) {
          const p = pendingDeltaRef.current;
          if (!p || (p.time > 0 && c.time < p.time)) pendingDeltaRef.current = c;
          triggerHardRefresh("gap");
          return;
        }
        if (lastTime > 0 && c.time < lastTime) return;

        setData((prev) => {
          let nextList = upsert(prev, c as Candle, 1200);
          // 변경 이유: gap으로 인해 미리 도착한 “미래” 캔들은 보류했다가, 누락 캔들이 채워진 시점에 즉시 반영한다.
          const pending = pendingDeltaRef.current;
          if (pending) {
            const last2 = nextList.length ? nextList[nextList.length - 1].time : 0;
            if (last2 && pending.time <= last2) {
              pendingDeltaRef.current = null;
            } else if (_canAppendNoGap(last2, pending.time, step)) {
              nextList = upsert(nextList, pending, 1200);
              pendingDeltaRef.current = null;
            }
          }
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
          applySnapshot(current, cached.savedAt, tempByTf, "server");
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
    // 변경 이유: 심볼/TF 전환 시 이전 lastBundleAt(다른 심볼 기준)이 남아 있으면 IDB 캐시가 불필요하게 스킵되어 초기 렌더 지연 편차가 커질 수 있어 reset한다.
    lastBundleAtRef.current = 0;
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
      applySnapshot(mem.dataByTf[tfNorm], mem.savedAt, mem.tempByTf, "cache");
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
          applySnapshot(current, cached.savedAt, tempByTf, "cache");
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
        const step = getTfStepMs(tfNorm);
        const olderSorted0 = _dedupSortCandles(older);
        const olderSorted = shouldTrimContiguous() ? _trimToContiguousSuffix(olderSorted0, step) : olderSorted0;
        const merged = _dedupSortCandles([...olderSorted, ...(data || [])]);
        setData(merged);
        const cacheKey = `${m}:${sym}`;
        const prev = getMemoryBundle(cacheKey);
        const savedAt = prev?.savedAt ?? Date.now();
        setMemoryBundle(cacheKey, { ...(prev?.dataByTf || {}), [tfNorm]: merged }, prev?.tempByTf, savedAt);
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

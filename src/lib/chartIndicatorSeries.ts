"use client";

import type { HistogramData, LineData, UTCTimestamp } from "lightweight-charts";
import type { Candle } from "@/hooks/useChart";
import type { ChartIndicatorConfigV1 } from "@/lib/chartIndicatorConfig";

export type ChartIndicatorSeries = {
  closesByTime: Map<UTCTimestamp, number>;
  volume: HistogramData<UTCTimestamp>[];
  rsi: LineData<UTCTimestamp>[];
  macd: LineData<UTCTimestamp>[];
  macdSignal: LineData<UTCTimestamp>[];
  macdHist: HistogramData<UTCTimestamp>[];
  bbUpper: LineData<UTCTimestamp>[];
  bbMid: LineData<UTCTimestamp>[];
  bbLower: LineData<UTCTimestamp>[];
  last: {
    rsi: number | null;
    macd: number | null;
    macdSignal: number | null;
    macdHist: number | null;
    bbUpper: number | null;
    bbMid: number | null;
    bbLower: number | null;
  };
};

function toTs(tMs: number): UTCTimestamp {
  return Math.floor(Number(tMs || 0) / 1000) as UTCTimestamp;
}

function emaSeries(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (const v of values) {
    const x = Number(v);
    if (!Number.isFinite(x)) {
      out.push(prev ?? 0);
      continue;
    }
    if (prev === null) prev = x;
    else prev = prev + k * (x - prev);
    out.push(prev);
  }
  return out;
}

function rsiWilderSeries(closes: number[], period: number): Array<number | null> {
  const n = Math.max(2, Math.trunc(period));
  const out: Array<number | null> = new Array(closes.length).fill(null);
  if (closes.length < n + 1) return out;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= n; i += 1) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) gainSum += ch;
    else lossSum += -ch;
  }
  let avgGain = gainSum / n;
  let avgLoss = lossSum / n;

  const rs0 = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  out[n] = avgLoss === 0 ? 100 : 100 - 100 / (1 + rs0);

  for (let i = n + 1; i < closes.length; i += 1) {
    const ch = closes[i] - closes[i - 1];
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (n - 1) + gain) / n;
    avgLoss = (avgLoss * (n - 1) + loss) / n;
    if (avgLoss === 0) out[i] = 100;
    else {
      const rs = avgGain / avgLoss;
      out[i] = 100 - 100 / (1 + rs);
    }
  }
  return out;
}

function bollingerSeries(closes: number[], n: number, k: number): {
  upper: Array<number | null>;
  mid: Array<number | null>;
  lower: Array<number | null>;
} {
  const period = Math.max(2, Math.trunc(n));
  const upper: Array<number | null> = new Array(closes.length).fill(null);
  const mid: Array<number | null> = new Array(closes.length).fill(null);
  const lower: Array<number | null> = new Array(closes.length).fill(null);
  if (closes.length < period) return { upper, mid, lower };

  let sum = 0;
  let sumsq = 0;
  for (let i = 0; i < closes.length; i += 1) {
    const x = closes[i];
    sum += x;
    sumsq += x * x;
    if (i >= period) {
      const old = closes[i - period];
      sum -= old;
      sumsq -= old * old;
    }
    if (i >= period - 1) {
      const mean = sum / period;
      const variance = Math.max(0, sumsq / period - mean * mean);
      const std = Math.sqrt(variance);
      mid[i] = mean;
      upper[i] = mean + k * std;
      lower[i] = mean - k * std;
    }
  }
  return { upper, mid, lower };
}

export function computeChartIndicatorSeries(
  candles: Candle[],
  cfg: ChartIndicatorConfigV1
): ChartIndicatorSeries {
  const volume: HistogramData<UTCTimestamp>[] = [];
  const rsi: LineData<UTCTimestamp>[] = [];
  const macd: LineData<UTCTimestamp>[] = [];
  const macdSignal: LineData<UTCTimestamp>[] = [];
  const macdHist: HistogramData<UTCTimestamp>[] = [];
  const bbUpper: LineData<UTCTimestamp>[] = [];
  const bbMid: LineData<UTCTimestamp>[] = [];
  const bbLower: LineData<UTCTimestamp>[] = [];
  const closesByTime = new Map<UTCTimestamp, number>();

  if (!candles || candles.length === 0) {
    return {
      closesByTime,
      volume,
      rsi,
      macd,
      macdSignal,
      macdHist,
      bbUpper,
      bbMid,
      bbLower,
      last: {
        rsi: null,
        macd: null,
        macdSignal: null,
        macdHist: null,
        bbUpper: null,
        bbMid: null,
        bbLower: null
      }
    };
  }

  const sorted = [...candles].sort((a, b) => a.time - b.time);
  const closes: number[] = [];
  const times: UTCTimestamp[] = [];

  for (const c of sorted) {
    const t = toTs(c.time);
    const close = Number(c.close);
    const vol = Number(c.volume);
    times.push(t);
    closes.push(Number.isFinite(close) ? close : 0);
    closesByTime.set(t, Number.isFinite(close) ? close : 0);
    volume.push({
      time: t,
      value: Number.isFinite(vol) ? vol : 0,
      color: Number(c.close) >= Number(c.open) ? "#22c55e80" : "#ef444480"
    });
  }

  const rsiN = cfg.panes.rsi.n;
  const rsiArr = rsiWilderSeries(closes, rsiN);
  for (let i = 0; i < rsiArr.length; i += 1) {
    const v = rsiArr[i];
    if (typeof v === "number" && Number.isFinite(v)) rsi.push({ time: times[i], value: v });
  }

  const fast = cfg.panes.macd.fast;
  const slow = cfg.panes.macd.slow;
  const signal = cfg.panes.macd.signal;

  const emaFast = emaSeries(closes, fast);
  const emaSlow = emaSeries(closes, slow);
  const macdRaw: number[] = [];
  for (let i = 0; i < closes.length; i += 1) macdRaw.push(emaFast[i] - emaSlow[i]);
  const emaSig = emaSeries(macdRaw, signal);
  for (let i = 0; i < closes.length; i += 1) {
    const m = macdRaw[i];
    const s = emaSig[i];
    const h = m - s;
    macd.push({ time: times[i], value: m });
    macdSignal.push({ time: times[i], value: s });
    macdHist.push({
      time: times[i],
      value: h,
      color: h >= 0 ? "#22c55e80" : "#ef444480"
    });
  }

  const bbN = cfg.overlays.bb.n;
  const bbK = cfg.overlays.bb.k;
  const bb = bollingerSeries(closes, bbN, bbK);
  for (let i = 0; i < closes.length; i += 1) {
    const u = bb.upper[i];
    const m = bb.mid[i];
    const l = bb.lower[i];
    if (typeof u === "number" && Number.isFinite(u)) bbUpper.push({ time: times[i], value: u });
    if (typeof m === "number" && Number.isFinite(m)) bbMid.push({ time: times[i], value: m });
    if (typeof l === "number" && Number.isFinite(l)) bbLower.push({ time: times[i], value: l });
  }

  const lastTs = times[times.length - 1];
  const last = {
    rsi: rsiArr.length ? (rsiArr[rsiArr.length - 1] ?? null) : null,
    macd: macdRaw.length ? macdRaw[macdRaw.length - 1] : null,
    macdSignal: emaSig.length ? emaSig[emaSig.length - 1] : null,
    macdHist: macdRaw.length && emaSig.length ? macdRaw[macdRaw.length - 1] - emaSig[emaSig.length - 1] : null,
    bbUpper: bbUpper.length && bbUpper[bbUpper.length - 1].time === lastTs ? bbUpper[bbUpper.length - 1].value : null,
    bbMid: bbMid.length && bbMid[bbMid.length - 1].time === lastTs ? bbMid[bbMid.length - 1].value : null,
    bbLower: bbLower.length && bbLower[bbLower.length - 1].time === lastTs ? bbLower[bbLower.length - 1].value : null
  };

  return {
    closesByTime,
    volume,
    rsi,
    macd,
    macdSignal,
    macdHist,
    bbUpper,
    bbMid,
    bbLower,
    last: {
      rsi: typeof last.rsi === "number" && Number.isFinite(last.rsi) ? last.rsi : null,
      macd: typeof last.macd === "number" && Number.isFinite(last.macd) ? last.macd : null,
      macdSignal: typeof last.macdSignal === "number" && Number.isFinite(last.macdSignal) ? last.macdSignal : null,
      macdHist: typeof last.macdHist === "number" && Number.isFinite(last.macdHist) ? last.macdHist : null,
      bbUpper: typeof last.bbUpper === "number" && Number.isFinite(last.bbUpper) ? last.bbUpper : null,
      bbMid: typeof last.bbMid === "number" && Number.isFinite(last.bbMid) ? last.bbMid : null,
      bbLower: typeof last.bbLower === "number" && Number.isFinite(last.bbLower) ? last.bbLower : null
    }
  };
}


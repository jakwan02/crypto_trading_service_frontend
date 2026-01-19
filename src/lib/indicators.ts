export type TechIndicators = {
  rsi14: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_mid: number | null;
  bb_upper: number | null;
  bb_lower: number | null;
};

function ema(values: number[], period: number): number[] {
  const out: number[] = [];
  const k = 2 / (period + 1);
  let prev: number | null = null;
  for (const v of values) {
    const x = Number(v);
    if (!Number.isFinite(x)) continue;
    if (prev === null) prev = x;
    else prev = prev + k * (x - prev);
    out.push(prev);
  }
  return out;
}

export function computeRsi14(closes: number[]): number | null {
  const n = 14;
  if (closes.length < n + 1) return null;

  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= n; i += 1) {
    const ch = closes[i] - closes[i - 1];
    if (ch >= 0) gainSum += ch;
    else lossSum += -ch;
  }
  let avgGain = gainSum / n;
  let avgLoss = lossSum / n;

  for (let i = n + 1; i < closes.length; i += 1) {
    const ch = closes[i] - closes[i - 1];
    const gain = ch > 0 ? ch : 0;
    const loss = ch < 0 ? -ch : 0;
    avgGain = (avgGain * (n - 1) + gain) / n;
    avgLoss = (avgLoss * (n - 1) + loss) / n;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function computeMacd(closes: number[]): { macd: number; signal: number; hist: number } | null {
  if (closes.length < 5) return null;
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const len = Math.min(ema12.length, ema26.length);
  if (len <= 0) return null;

  const macdSeries: number[] = [];
  for (let i = 0; i < len; i += 1) macdSeries.push(ema12[ema12.length - len + i] - ema26[ema26.length - len + i]);
  const sig = ema(macdSeries, 9);
  if (sig.length <= 0) return null;
  const macdLast = macdSeries[macdSeries.length - 1];
  const sigLast = sig[sig.length - 1];
  return { macd: macdLast, signal: sigLast, hist: macdLast - sigLast };
}

export function computeBollinger(closes: number[]): { mid: number; upper: number; lower: number } | null {
  const n = 20;
  if (closes.length < n) return null;
  const tail = closes.slice(closes.length - n);
  const mean = tail.reduce((a, b) => a + b, 0) / n;
  const variance = tail.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return { mid: mean, upper: mean + 2 * std, lower: mean - 2 * std };
}

export function computeTechIndicators(closes: number[]): TechIndicators {
  const rsi14 = computeRsi14(closes);
  const macd = computeMacd(closes);
  const bb = computeBollinger(closes);
  return {
    rsi14,
    macd: macd ? macd.macd : null,
    macd_signal: macd ? macd.signal : null,
    macd_hist: macd ? macd.hist : null,
    bb_mid: bb ? bb.mid : null,
    bb_upper: bb ? bb.upper : null,
    bb_lower: bb ? bb.lower : null
  };
}


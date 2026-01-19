"use client";

export type ChartIndicatorConfigV1 = {
  v: 1;
  overlays: {
    bb: { enabled: boolean; n: number; k: number };
  };
  panes: {
    volume: { enabled: boolean };
    rsi: { enabled: boolean; n: number };
    macd: { enabled: boolean; fast: number; slow: number; signal: number };
  };
};

export const DEFAULT_CHART_INDICATOR_CONFIG: ChartIndicatorConfigV1 = {
  v: 1,
  overlays: { bb: { enabled: true, n: 20, k: 2 } },
  panes: {
    volume: { enabled: true },
    rsi: { enabled: true, n: 14 },
    macd: { enabled: true, fast: 12, slow: 26, signal: 9 }
  }
};

const LS_KEY = "chart.indicators.v1";

function clampInt(n: number, min: number, max: number): number {
  const x = Math.trunc(Number(n));
  if (!Number.isFinite(x)) return min;
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

function clampFloat(n: number, min: number, max: number): number {
  const x = Number(n);
  if (!Number.isFinite(x)) return min;
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

export function sanitizeChartIndicatorConfig(input: unknown): ChartIndicatorConfigV1 {
  const base = DEFAULT_CHART_INDICATOR_CONFIG;
  if (!input || typeof input !== "object") return base;
  const obj = input as Partial<ChartIndicatorConfigV1>;
  const rawV = Number((obj as unknown as Record<string, unknown>).v);
  if (rawV !== 1) return base;

  const bbEnabled = !!obj.overlays?.bb?.enabled;
  const bbN = clampInt(obj.overlays?.bb?.n ?? base.overlays.bb.n, 2, 200);
  const bbK = clampFloat(obj.overlays?.bb?.k ?? base.overlays.bb.k, 0.1, 5);

  const volumeEnabled = !!obj.panes?.volume?.enabled;
  const rsiEnabled = !!obj.panes?.rsi?.enabled;
  const rsiN = clampInt(obj.panes?.rsi?.n ?? base.panes.rsi.n, 2, 200);

  const macdEnabled = !!obj.panes?.macd?.enabled;
  const fast = clampInt(obj.panes?.macd?.fast ?? base.panes.macd.fast, 2, 50);
  let slow = clampInt(obj.panes?.macd?.slow ?? base.panes.macd.slow, 3, 200);
  if (slow <= fast) slow = Math.min(200, fast + 1);
  const signal = clampInt(obj.panes?.macd?.signal ?? base.panes.macd.signal, 2, 50);

  return {
    v: 1,
    overlays: { bb: { enabled: bbEnabled, n: bbN, k: bbK } },
    panes: {
      volume: { enabled: volumeEnabled },
      rsi: { enabled: rsiEnabled, n: rsiN },
      macd: { enabled: macdEnabled, fast, slow, signal }
    }
  };
}

export function readChartIndicatorConfigFromLs(): ChartIndicatorConfigV1 {
  if (typeof window === "undefined") return DEFAULT_CHART_INDICATOR_CONFIG;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_CHART_INDICATOR_CONFIG;
    return sanitizeChartIndicatorConfig(JSON.parse(raw));
  } catch {
    return DEFAULT_CHART_INDICATOR_CONFIG;
  }
}

export function writeChartIndicatorConfigToLs(cfg: ChartIndicatorConfigV1): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(sanitizeChartIndicatorConfig(cfg)));
  } catch {
    // ignore
  }
}

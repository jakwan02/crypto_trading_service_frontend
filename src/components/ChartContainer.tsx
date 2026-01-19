// filename: frontend/components/ChartContainer.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CandlestickData, IChartApi, ISeriesApi, MouseEventParams, Time, UTCTimestamp } from "lightweight-charts";
import { useTranslation } from "react-i18next";
import { useChart, type Candle } from "@/hooks/useChart";
import type { TechIndicators } from "@/lib/indicators";
import type { ChartIndicatorConfigV1 } from "@/lib/chartIndicatorConfig";
import { DEFAULT_CHART_INDICATOR_CONFIG } from "@/lib/chartIndicatorConfig";
import { computeChartIndicatorSeries } from "@/lib/chartIndicatorSeries";

type Props = {
  symbol: string | null;
  timeframe: string;
  market?: string;
  onLastCandle?: (candle: Candle | null) => void;
  onIndicators?: (indicators: TechIndicators | null) => void;
  indicatorConfig?: ChartIndicatorConfigV1;
};

function pricePrecisionByLast(px: number): { precision: number; minMove: number } {
  const ax = Math.abs(px);

  if (!Number.isFinite(ax) || ax === 0) return { precision: 8, minMove: 0.00000001 };
  if (ax >= 1000) return { precision: 2, minMove: 0.01 };
  if (ax >= 100) return { precision: 3, minMove: 0.001 };
  if (ax >= 1) return { precision: 4, minMove: 0.0001 };
  if (ax >= 0.01) return { precision: 6, minMove: 0.000001 };
  if (ax >= 0.0001) return { precision: 8, minMove: 0.00000001 };
  return { precision: 10, minMove: 0.0000000001 };
}

function fmtPrice(px: number, precision: number, locale: string): string {
  if (!Number.isFinite(px)) return "-";
  return px.toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

export default function ChartContainer({ symbol, timeframe, market, onLastCandle, onIndicators, indicatorConfig }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const priceRef = useRef<HTMLDivElement | null>(null);
  const volumeRef = useRef<HTMLDivElement | null>(null);
  const rsiRef = useRef<HTMLDivElement | null>(null);
  const macdRef = useRef<HTMLDivElement | null>(null);

  const priceChartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbMidRef = useRef<ISeriesApi<"Line"> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<"Line"> | null>(null);

  const volumeChartRef = useRef<IChartApi | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const rsiChartRef = useRef<IChartApi | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  const macdChartRef = useRef<IChartApi | null>(null);
  const macdSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdSignalSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const macdHistSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  const [seriesReady, setSeriesReady] = useState(false);
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const fittedRef = useRef(false);
  const initialFocusRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const lastLenRef = useRef<number>(0);
  const firstTimeRef = useRef<number>(0);
  const restoreRangeRef = useRef<{ from: number; to: number } | null>(null);
  const syncingRangeRef = useRef(false);
  const syncingCrosshairRef = useRef(false);
  const crosshairMapsRef = useRef<{
    close: Map<UTCTimestamp, number>;
    volume: Map<UTCTimestamp, number>;
    rsi: Map<UTCTimestamp, number>;
    macd: Map<UTCTimestamp, number>;
  }>({
    close: new Map(),
    volume: new Map(),
    rsi: new Map(),
    macd: new Map()
  });

  // 변경 이유: 차트 경로 market 파라미터를 우선 적용
  const { data: candles, error, loadMore, loadingMore, historyNotice } = useChart(symbol, timeframe, market);

  useEffect(() => {
    // 변경 이유: 차트 실시간 가격을 상단 지표와 동기화
    if (!onLastCandle) return;
    const last = candles && candles.length > 0 ? candles[candles.length - 1] : null;
    onLastCandle(last || null);
  }, [candles, onLastCandle]);

  const cfg = useMemo(() => indicatorConfig || DEFAULT_CHART_INDICATOR_CONFIG, [indicatorConfig]);
  const ind = useMemo(() => computeChartIndicatorSeries(candles || [], cfg), [candles, cfg]);

  const tech = useMemo<TechIndicators | null>(() => {
    if (!candles || candles.length < 5) return null;
    return {
      rsi14: cfg.panes.rsi.enabled ? ind.last.rsi : null,
      macd: cfg.panes.macd.enabled ? ind.last.macd : null,
      macd_signal: cfg.panes.macd.enabled ? ind.last.macdSignal : null,
      macd_hist: cfg.panes.macd.enabled ? ind.last.macdHist : null,
      bb_mid: cfg.overlays.bb.enabled ? ind.last.bbMid : null,
      bb_upper: cfg.overlays.bb.enabled ? ind.last.bbUpper : null,
      bb_lower: cfg.overlays.bb.enabled ? ind.last.bbLower : null
    };
  }, [candles, cfg, ind.last]);

  useEffect(() => {
    if (!onIndicators) return;
    onIndicators(tech);
  }, [onIndicators, tech]);

  useEffect(() => {
    const close = new Map<UTCTimestamp, number>();
    const volume = new Map<UTCTimestamp, number>();
    for (const v of ind.volume) volume.set(v.time, v.value);
    for (const [ts, px] of ind.closesByTime.entries()) close.set(ts, px);
    const rsi = new Map<UTCTimestamp, number>();
    for (const p of ind.rsi) rsi.set(p.time, p.value);
    const macd = new Map<UTCTimestamp, number>();
    for (const p of ind.macd) macd.set(p.time, p.value);
    crosshairMapsRef.current = { close, volume, rsi, macd };
  }, [ind]);

  // 마지막 종가로 precision/minMove 동적 선택
  const pf = useMemo(() => {
    const last = candles && candles.length > 0 ? candles[candles.length - 1] : null;
    const lastClose = last ? Number(last.close) : 0;
    return pricePrecisionByLast(lastClose);
  }, [candles]);

  const INITIAL_FOCUS_BARS = 150;
  // 차트/시리즈 생성
  useEffect(() => {
    if (!containerRef.current) return;
    if (!priceRef.current) return;
    let cancelled = false;
    let ro: ResizeObserver | null = null;
    let priceChart: IChartApi | null = null;
    let volumeChart: IChartApi | null = null;
    let rsiChart: IChartApi | null = null;
    let macdChart: IChartApi | null = null;

    const unsubs: Array<() => void> = [];

    const init = async () => {
      const mod = await import("lightweight-charts");
      if (cancelled || !containerRef.current) return;

      const width = containerRef.current.clientWidth;

      priceChart = mod.createChart(priceRef.current as HTMLDivElement, {
        width,
        height: 420,
        layout: { background: { color: "#ffffff" }, textColor: "#1f2937" },
        grid: { vertLines: { color: "#e5e7eb" }, horzLines: { color: "#f3f4f6" } },
        timeScale: { timeVisible: true, secondsVisible: false, borderColor: "#e5e7eb" },
        rightPriceScale: {
          borderColor: "#e5e7eb",
          autoScale: true,
          scaleMargins: { top: 0.1, bottom: 0.1 }
        },
        crosshair: { mode: 1 },

        // 가격 라벨(축/크로스헤어) 포맷: 이 버전에서는 여기만이 타입 안전한 경로입니다.
        localization: {
          priceFormatter: (p: number) => fmtPrice(p, pf.precision, locale)
        }
      });

      priceChartRef.current = priceChart;

      const candleSeries = priceChart.addSeries(mod.CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",

        // 시리즈 가격 정밀도(작은 가격도 0처럼 뭉개지지 않게)
        priceFormat: {
          type: "price",
          precision: pf.precision,
          minMove: pf.minMove
        }
      }) as ISeriesApi<"Candlestick">;

      candleSeriesRef.current = candleSeries;

      if (cfg.overlays.bb.enabled) {
        bbUpperRef.current = priceChart.addSeries(mod.LineSeries, {
          color: "#0ea5e9",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        }) as ISeriesApi<"Line">;
        bbMidRef.current = priceChart.addSeries(mod.LineSeries, {
          color: "#94a3b8",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        }) as ISeriesApi<"Line">;
        bbLowerRef.current = priceChart.addSeries(mod.LineSeries, {
          color: "#0ea5e9",
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        }) as ISeriesApi<"Line">;
      } else {
        bbUpperRef.current = null;
        bbMidRef.current = null;
        bbLowerRef.current = null;
      }

      if (cfg.panes.volume.enabled && volumeRef.current) {
        volumeChart = mod.createChart(volumeRef.current, {
          width,
          height: 120,
          layout: { background: { color: "#ffffff" }, textColor: "#1f2937" },
          grid: { vertLines: { color: "#e5e7eb" }, horzLines: { color: "#f3f4f6" } },
          timeScale: { visible: false, borderColor: "#e5e7eb", timeVisible: false, secondsVisible: false },
          rightPriceScale: { borderColor: "#e5e7eb", scaleMargins: { top: 0.2, bottom: 0.1 } },
          crosshair: { mode: 1 }
        });
        volumeChartRef.current = volumeChart;
        volumeSeriesRef.current = volumeChart.addSeries(mod.HistogramSeries, {
          priceLineVisible: false,
          lastValueVisible: false
        }) as ISeriesApi<"Histogram">;
      } else {
        volumeChartRef.current = null;
        volumeSeriesRef.current = null;
      }

      if (cfg.panes.rsi.enabled && rsiRef.current) {
        rsiChart = mod.createChart(rsiRef.current, {
          width,
          height: 160,
          layout: { background: { color: "#ffffff" }, textColor: "#1f2937" },
          grid: { vertLines: { color: "#e5e7eb" }, horzLines: { color: "#f3f4f6" } },
          timeScale: { visible: false, borderColor: "#e5e7eb", timeVisible: false, secondsVisible: false },
          rightPriceScale: { borderColor: "#e5e7eb", scaleMargins: { top: 0.2, bottom: 0.2 } },
          crosshair: { mode: 1 }
        });
        rsiChartRef.current = rsiChart;
        const series = rsiChart.addSeries(mod.LineSeries, {
          color: "#a855f7",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true
        }) as ISeriesApi<"Line">;
        rsiSeriesRef.current = series;
        try {
          series.createPriceLine({ price: 70, color: "#ef444480", lineWidth: 1, lineStyle: 2, axisLabelVisible: true });
          series.createPriceLine({ price: 30, color: "#22c55e80", lineWidth: 1, lineStyle: 2, axisLabelVisible: true });
        } catch {}
      } else {
        rsiChartRef.current = null;
        rsiSeriesRef.current = null;
      }

      if (cfg.panes.macd.enabled && macdRef.current) {
        macdChart = mod.createChart(macdRef.current, {
          width,
          height: 160,
          layout: { background: { color: "#ffffff" }, textColor: "#1f2937" },
          grid: { vertLines: { color: "#e5e7eb" }, horzLines: { color: "#f3f4f6" } },
          timeScale: { visible: false, borderColor: "#e5e7eb", timeVisible: false, secondsVisible: false },
          rightPriceScale: { borderColor: "#e5e7eb", scaleMargins: { top: 0.2, bottom: 0.2 } },
          crosshair: { mode: 1 }
        });
        macdChartRef.current = macdChart;
        macdHistSeriesRef.current = macdChart.addSeries(mod.HistogramSeries, {
          priceLineVisible: false,
          lastValueVisible: false
        }) as ISeriesApi<"Histogram">;
        macdSeriesRef.current = macdChart.addSeries(mod.LineSeries, {
          color: "#0ea5e9",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true
        }) as ISeriesApi<"Line">;
        macdSignalSeriesRef.current = macdChart.addSeries(mod.LineSeries, {
          color: "#f59e0b",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: true
        }) as ISeriesApi<"Line">;
      } else {
        macdChartRef.current = null;
        macdHistSeriesRef.current = null;
        macdSeriesRef.current = null;
        macdSignalSeriesRef.current = null;
      }

      setSeriesReady(true);

      fittedRef.current = false;
      initialFocusRef.current = false;
      lastTimeRef.current = 0;
      lastLenRef.current = 0;

      const charts: IChartApi[] = [priceChart];
      if (volumeChart) charts.push(volumeChart);
      if (rsiChart) charts.push(rsiChart);
      if (macdChart) charts.push(macdChart);

      const syncRange = (src: IChartApi, dest: IChartApi) => {
        const handler = (range: { from: number; to: number } | null) => {
          if (!range) return;
          if (syncingRangeRef.current) return;
          syncingRangeRef.current = true;
          try {
            dest.timeScale().setVisibleLogicalRange(range);
          } catch {}
          syncingRangeRef.current = false;
        };
        src.timeScale().subscribeVisibleLogicalRangeChange(handler);
        return () => src.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      };

      for (let i = 0; i < charts.length; i += 1) {
        for (let j = 0; j < charts.length; j += 1) {
          if (i === j) continue;
          unsubs.push(syncRange(charts[i], charts[j]));
        }
      }

      const syncCrosshair = (src: IChartApi) => {
        const handler = (param: MouseEventParams<Time>) => {
          if (syncingCrosshairRef.current) return;
          syncingCrosshairRef.current = true;
          try {
            const rawT = param?.time;
            const t = typeof rawT === "number" ? (rawT as UTCTimestamp) : undefined;
            if (!t) {
              for (const c of charts) {
                if (c === src) continue;
                try {
                  c.clearCrosshairPosition();
                } catch {}
              }
              syncingCrosshairRef.current = false;
              return;
            }

            const maps = crosshairMapsRef.current;
            const close = maps.close.get(t);
            const vol = maps.volume.get(t);
            const rsi = maps.rsi.get(t);
            const macd = maps.macd.get(t);

            for (const c of charts) {
              if (c === src) continue;
              try {
                if (c === priceChart && candleSeriesRef.current && typeof close === "number") {
                  c.setCrosshairPosition(close, t, candleSeriesRef.current);
                } else if (c === volumeChart && volumeSeriesRef.current && typeof vol === "number") {
                  c.setCrosshairPosition(vol, t, volumeSeriesRef.current);
                } else if (c === rsiChart && rsiSeriesRef.current && typeof rsi === "number") {
                  c.setCrosshairPosition(rsi, t, rsiSeriesRef.current);
                } else if (c === macdChart && macdSeriesRef.current && typeof macd === "number") {
                  c.setCrosshairPosition(macd, t, macdSeriesRef.current);
                } else {
                  c.clearCrosshairPosition();
                }
              } catch {}
            }
          } finally {
            syncingCrosshairRef.current = false;
          }
        };
        src.subscribeCrosshairMove(handler);
        return () => src.unsubscribeCrosshairMove(handler);
      };

      for (const c of charts) {
        unsubs.push(syncCrosshair(c));
      }

      ro = new ResizeObserver((entries) => {
        for (const e of entries) {
          if (e.target !== containerRef.current) continue;
          const w = e.contentRect.width;
          try {
            priceChart?.applyOptions({ width: w });
            volumeChart?.applyOptions({ width: w });
            rsiChart?.applyOptions({ width: w });
            macdChart?.applyOptions({ width: w });
          } catch {}
        }
      });
      ro.observe(containerRef.current);
    };

    init();

    return () => {
      cancelled = true;
      setSeriesReady(false);
      for (const u of unsubs) {
        try {
          u();
        } catch {}
      }
      ro?.disconnect();
      priceChart?.remove();
      volumeChart?.remove();
      rsiChart?.remove();
      macdChart?.remove();
      priceChartRef.current = null;
      candleSeriesRef.current = null;
      bbUpperRef.current = null;
      bbMidRef.current = null;
      bbLowerRef.current = null;
      volumeChartRef.current = null;
      volumeSeriesRef.current = null;
      rsiChartRef.current = null;
      rsiSeriesRef.current = null;
      macdChartRef.current = null;
      macdSeriesRef.current = null;
      macdSignalSeriesRef.current = null;
      macdHistSeriesRef.current = null;
      fittedRef.current = false;
      initialFocusRef.current = false;
      lastTimeRef.current = 0;
      lastLenRef.current = 0;
      firstTimeRef.current = 0;
    };
    // pf 포함: 심볼/TF 변경 또는 precision 변경 시 새로 생성
  }, [symbol, timeframe, pf.precision, pf.minMove, locale, cfg.overlays.bb.enabled, cfg.panes.volume.enabled, cfg.panes.rsi.enabled, cfg.panes.macd.enabled]);

  // candles -> series
  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    const priceChart = priceChartRef.current;
    if (!seriesReady || !candleSeries || !priceChart) return;

    if (!candles || candles.length === 0) {
      candleSeries.setData([]);
      bbUpperRef.current?.setData([]);
      bbMidRef.current?.setData([]);
      bbLowerRef.current?.setData([]);
      volumeSeriesRef.current?.setData([]);
      rsiSeriesRef.current?.setData([]);
      macdSeriesRef.current?.setData([]);
      macdSignalSeriesRef.current?.setData([]);
      macdHistSeriesRef.current?.setData([]);
      fittedRef.current = false;
      initialFocusRef.current = false;
      lastTimeRef.current = 0;
      lastLenRef.current = 0;
      firstTimeRef.current = 0;
      return;
    }

    const mapped: CandlestickData[] = candles
      .map((c) => ({
        time: Math.floor(c.time / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    const last = mapped[mapped.length - 1];
    const lastTime = last ? (last.time as number) : 0;
    const firstTime = mapped[0] ? (mapped[0].time as number) : 0;
    const isPrepend =
      firstTimeRef.current > 0 &&
      firstTime > 0 &&
      firstTime < firstTimeRef.current;

    // 첫 로딩/대량 변경은 전체 setData
    let needFull =
      !fittedRef.current ||
      mapped.length < lastLenRef.current ||
      firstTime <= 0 ||
      lastTime <= 0;

    if (!needFull) {
      if (firstTimeRef.current && firstTime !== firstTimeRef.current) needFull = true;
      if (lastTimeRef.current && lastTime < lastTimeRef.current) needFull = true;
    }

    if (needFull) {
      const ts = priceChart.timeScale();
      const keepRange = isPrepend || loadingMore || !!restoreRangeRef.current;
      const prevRange = ts.getVisibleLogicalRange();
      const restoreRange = restoreRangeRef.current;

      candleSeries.setData(mapped);
      bbUpperRef.current?.setData(ind.bbUpper);
      bbMidRef.current?.setData(ind.bbMid);
      bbLowerRef.current?.setData(ind.bbLower);
      volumeSeriesRef.current?.setData(ind.volume);
      rsiSeriesRef.current?.setData(ind.rsi);
      macdSeriesRef.current?.setData(ind.macd);
      macdSignalSeriesRef.current?.setData(ind.macdSignal);
      macdHistSeriesRef.current?.setData(ind.macdHist);

      if (!initialFocusRef.current) {
        const to = mapped.length - 1;
        const from = Math.max(0, to - (INITIAL_FOCUS_BARS - 1));
        ts.setVisibleLogicalRange({ from, to });
        restoreRangeRef.current = null;
        initialFocusRef.current = true;
      // 변경 이유: null range 전달로 인한 타입 오류 방지
      } else if (keepRange) {
        const nextRange = restoreRange || prevRange;
        if (nextRange) {
          ts.setVisibleLogicalRange(nextRange);
        } else {
          ts.fitContent();
        }
        restoreRangeRef.current = null;
      } else if (prevRange) {
        ts.setVisibleLogicalRange(prevRange);
      } else {
        ts.fitContent();
      }
      fittedRef.current = true;
      lastTimeRef.current = lastTime;
      lastLenRef.current = mapped.length;
      firstTimeRef.current = firstTime;
      return;
    }

    // 이후에는 마지막 캔들만 update
    if (last) {
      candleSeries.update(last);
      const lastT = last.time as UTCTimestamp;
      const bbU = ind.bbUpper.length ? ind.bbUpper[ind.bbUpper.length - 1] : null;
      const bbM = ind.bbMid.length ? ind.bbMid[ind.bbMid.length - 1] : null;
      const bbL = ind.bbLower.length ? ind.bbLower[ind.bbLower.length - 1] : null;
      if (bbU && bbU.time === lastT) bbUpperRef.current?.update(bbU);
      if (bbM && bbM.time === lastT) bbMidRef.current?.update(bbM);
      if (bbL && bbL.time === lastT) bbLowerRef.current?.update(bbL);

      const v = ind.volume.length ? ind.volume[ind.volume.length - 1] : null;
      if (v && v.time === lastT) volumeSeriesRef.current?.update(v);
      const r = ind.rsi.length ? ind.rsi[ind.rsi.length - 1] : null;
      if (r && r.time === lastT) rsiSeriesRef.current?.update(r);
      const m1 = ind.macd.length ? ind.macd[ind.macd.length - 1] : null;
      if (m1 && m1.time === lastT) macdSeriesRef.current?.update(m1);
      const m2 = ind.macdSignal.length ? ind.macdSignal[ind.macdSignal.length - 1] : null;
      if (m2 && m2.time === lastT) macdSignalSeriesRef.current?.update(m2);
      const mh = ind.macdHist.length ? ind.macdHist[ind.macdHist.length - 1] : null;
      if (mh && mh.time === lastT) macdHistSeriesRef.current?.update(mh);
      lastTimeRef.current = lastTime;
      lastLenRef.current = mapped.length;
      firstTimeRef.current = firstTime;
    }
  }, [candles, loadingMore, seriesReady, ind]);

  if (!symbol) {
    return (
        <div className="w-full h-[420px] flex items-center justify-center text-sm text-gray-500">
        {t("chart.selectSymbol")}
      </div>
    );
  }

  if (error && error !== "ws_error" && (!candles || candles.length === 0)) {
    return (
      <div className="w-full h-[420px] flex items-center justify-center text-sm text-red-500">
        {t("chart.loadError")}
      </div>
    );
  }

  return (
    <div className="w-full">
      {historyNotice ? (
        <div className="mb-2 flex justify-end">
          <div
            className={`rounded px-3 py-1 text-xs ring-1 ${
              historyNotice.kind === "error"
                ? "bg-rose-500/10 text-rose-300 ring-rose-500/30"
                : "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30"
            }`}
          >
            {historyNotice.text}
          </div>
        </div>
      ) : null}
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => loadMore?.()}
          disabled={loadingMore}
          className="rounded border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
        >
          {loadingMore ? t("chart.loadingMore") : t("chart.loadMore")}
        </button>
      </div>
      <div ref={containerRef} className="w-full space-y-3">
        <div ref={priceRef} className="w-full" />
        {cfg.panes.volume.enabled ? <div ref={volumeRef} className="w-full" /> : null}
        {cfg.panes.rsi.enabled ? <div ref={rsiRef} className="w-full" /> : null}
        {cfg.panes.macd.enabled ? <div ref={macdRef} className="w-full" /> : null}
      </div>
    </div>
  );
}

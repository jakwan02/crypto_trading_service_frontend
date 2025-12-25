// filename: frontend/components/ChartContainer.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp
} from "lightweight-charts";
import { useChart } from "@/hooks/useChart";

type Props = {
  symbol: string | null;
  timeframe: string;
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

function fmtPrice(px: number, precision: number): string {
  if (!Number.isFinite(px)) return "-";
  return px.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: precision
  });
}

export default function ChartContainer({ symbol, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const fittedRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const lastLenRef = useRef<number>(0);
  const autoLoadRef = useRef<number>(0);

  const { data: candles, error, loadMore, loadingMore } = useChart(symbol, timeframe);

  // 마지막 종가로 precision/minMove 동적 선택
  const pf = useMemo(() => {
    const last = candles && candles.length > 0 ? candles[candles.length - 1] : null;
    const lastClose = last ? Number(last.close) : 0;
    return pricePrecisionByLast(lastClose);
  }, [candles]);

  // 차트/시리즈 생성
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: { background: { color: "#020617" }, textColor: "#e5e7eb" },
      grid: { vertLines: { color: "#1f2937" }, horzLines: { color: "#111827" } },
      timeScale: { timeVisible: true, secondsVisible: false, borderColor: "#1f2937" },
      rightPriceScale: {
        borderColor: "#1f2937",
        autoScale: true,
        scaleMargins: { top: 0.1, bottom: 0.1 }
      },
      crosshair: { mode: 1 },

      // 가격 라벨(축/크로스헤어) 포맷: 이 버전에서는 여기만이 타입 안전한 경로입니다.
      localization: {
        priceFormatter: (p: number) => fmtPrice(p, pf.precision)
      }
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
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

    seriesRef.current = series;

    fittedRef.current = false;
    lastTimeRef.current = 0;
    lastLenRef.current = 0;

    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        if (e.target === containerRef.current) chart.applyOptions({ width: e.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      fittedRef.current = false;
      lastTimeRef.current = 0;
      lastLenRef.current = 0;
    };
    // pf 포함: 심볼/TF 변경 또는 precision 변경 시 새로 생성
  }, [symbol, timeframe, pf.precision, pf.minMove]);

  // candles -> series
  useEffect(() => {
    const series = seriesRef.current;
    const chart = chartRef.current;
    if (!series || !chart) return;

    if (!candles || candles.length === 0) {
      series.setData([]);
      fittedRef.current = false;
      lastTimeRef.current = 0;
      lastLenRef.current = 0;
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

    // 첫 로딩/대량 변경은 전체 setData
    const needFull =
      !fittedRef.current ||
      mapped.length < lastLenRef.current ||
      (mapped[0]?.time as number) === 0 ||
      (lastTimeRef.current > 0 && mapped[0] && (mapped[0].time as number) > lastTimeRef.current);

    if (needFull) {
      series.setData(mapped);
      chart.timeScale().fitContent();
      fittedRef.current = true;
      lastTimeRef.current = lastTime;
      lastLenRef.current = mapped.length;
      return;
    }

    // 이후에는 마지막 캔들만 update
    if (last) {
      series.update(last);
      lastTimeRef.current = lastTime;
      lastLenRef.current = mapped.length;
    }
  }, [candles]);

  // 스크롤로 좌측 끝 접근 시 자동으로 과거 데이터 로드
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !loadMore) return;

    const onRange = (range: { from: number; to: number } | null) => {
      if (!range || loadingMore) return;
      if (range.from > 5) return;
      const now = Date.now();
      if (now - autoLoadRef.current < 1200) return;
      autoLoadRef.current = now;
      loadMore();
    };

    const ts = chart.timeScale();
    ts.subscribeVisibleLogicalRangeChange(onRange);
    return () => {
      ts.unsubscribeVisibleLogicalRangeChange(onRange);
    };
  }, [loadMore, loadingMore]);

  if (!symbol) {
    return (
      <div className="w-full h-[420px] flex items-center justify-center text-sm text-slate-400">
        심볼을 선택해주세요.
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[420px] flex items-center justify-center text-sm text-red-400">
        차트 로딩 중 오류가 발생했습니다.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => loadMore?.()}
          disabled={loadingMore}
          className="rounded bg-slate-800 px-3 py-1 text-xs text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700 disabled:opacity-50"
        >
          {loadingMore ? "로딩 중..." : "이전 데이터 불러오기"}
        </button>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}

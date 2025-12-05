// filename: src/components/ChartContainer.tsx
"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  type Time
} from "lightweight-charts";
import { useChart } from "@/hooks/useChart";

type Props = {
  symbol: string;
  timeframe: string;
};

export default function ChartContainer({ symbol, timeframe }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useChart(
    symbol,
    timeframe
  );

  // 차트 생성 / 해제
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: "#020617" },
        textColor: "#e5e7eb"
      },
      grid: {
        vertLines: { color: "#1f2937" },
        horzLines: { color: "#111827" }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#1f2937"
      },
      rightPriceScale: {
        borderColor: "#1f2937"
      },
      crosshair: {
        mode: 1
      }
    });

    chartRef.current = chart;

    // v5: addSeries + CandlestickSeries 사용
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444"
    }) as ISeriesApi<"Candlestick">;

    seriesRef.current = series;

    // 리사이즈 대응
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === containerRef.current) {
          const { width } = entry.contentRect;
          chart.applyOptions({ width });
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    // 왼쪽으로 스크롤 시 과거 데이터 추가
    const timeScale = chart.timeScale();

    const handleRangeChange = (logicalRange: any) => {
      if (!logicalRange) return;
      if (!hasNextPage || isFetchingNextPage) return;

      const from = logicalRange.from;
      if (typeof from === "number" && from < 20) {
        fetchNextPage();
      }
    };

    timeScale.subscribeVisibleLogicalRangeChange(handleRangeChange);

    return () => {
      timeScale.unsubscribeVisibleLogicalRangeChange(handleRangeChange);
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [symbol, timeframe, fetchNextPage, hasNextPage, isFetchingNextPage]);

  // 데이터 변경 시 차트에 반영
  useEffect(() => {
    if (!seriesRef.current || !data?.pages) return;

    const flat = data.pages.flat();
    flat.sort((a, b) => a.time - b.time);

    const mapped: CandlestickData[] = flat.map((candle) => ({
      time: Math.floor(candle.time / 1000) as Time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close
    }));

    seriesRef.current.setData(mapped);

    if (chartRef.current && mapped.length > 0) {
      chartRef.current.timeScale().fitContent();
    }
  }, [data]);

  // TODO: 나중에 WebSocket 실시간 업데이트는 여기서 seriesRef.current.update(...) 로 처리

  return <div ref={containerRef} className="w-full" />;
}
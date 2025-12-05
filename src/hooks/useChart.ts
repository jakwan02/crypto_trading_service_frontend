// filename: frontend/hooks/useChart.ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useSymbolsStore } from "@/store/useSymbolStore";

export type Candle = {
  time: number; // ms 단위 UNIX 시간
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();

// 백엔드 /api/chart 에서 캔들 데이터를 받아온다.
async function fetchChart(params: {
  market: string;
  symbol: string;
  timeframe: string;
  limit?: number;
}): Promise<Candle[]> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 이 설정되지 않았습니다.");
  }

  const { market, symbol, timeframe, limit = 300 } = params;

  const url =
    `${API_BASE}/api/chart` +
    `?market=${encodeURIComponent(market)}` +
    `&symbol=${encodeURIComponent(symbol)}` +
    `&tf=${encodeURIComponent(timeframe)}` +
    `&limit=${limit}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("캔들 데이터를 불러오지 못했습니다.");
  }

  const json = await res.json();
  const items = (json.items || []) as any[];

  const candles: Candle[] = items.map((c: any) => ({
    time: Number(c.time),          // backend에서 ms 로 내려줌
    open: Number(c.open),
    high: Number(c.high),
    low: Number(c.low),
    close: Number(c.close),
    volume: Number(c.volume)
  }));

  return candles;
}

// 선택된 market(spot/um)에 따라 해당 마켓의 캔들을 조회한다.
export function useChart(symbol: string, timeframe: string) {
  const market = useSymbolsStore((s) => s.market); // "spot" | "um"

  return useInfiniteQuery<Candle[]>({
    queryKey: ["chart", market, symbol, timeframe],
    queryFn: async () => {
      return fetchChart({
        market,
        symbol,
        timeframe,
        limit: 300
      });
    },
    initialPageParam: 0,
    // backend에 페이지 개념이 없으므로 추가 페이지는 없음
    getNextPageParam: () => undefined
  });
}
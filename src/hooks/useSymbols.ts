// filename: frontend/hooks/useSymbols.ts
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSymbolsStore } from "@/store/useSymbolStore";

export type SymbolRow = {
  symbol: string;    // 심볼 이름 (예: BTCUSDT)
  price: number;     // 현재 가격
  volume: number;    // 24h 거래량
  change24h: number; // 24h 등락률 (%)
  time: number;      // 상장일(또는 onboard 시간) ms
};

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();

// 정렬 유틸
function sortSymbols(
  data: SymbolRow[],
  sortKey: "symbol" | "price" | "volume" | "change24h" | "time",
  sortOrder: "asc" | "desc"
): SymbolRow[] {
  const sorted = [...data];

  sorted.sort((a, b) => {
    const dir = sortOrder === "asc" ? 1 : -1;

    if (sortKey === "symbol") {
      return a.symbol.localeCompare(b.symbol) * dir;
    }
    if (sortKey === "price") {
      return (a.price - b.price) * dir;
    }
    if (sortKey === "volume") {
      return (a.volume - b.volume) * dir;
    }
    if (sortKey === "change24h") {
      return (a.change24h - b.change24h) * dir;
    }
    // time = 상장일 ms
    return (a.time - b.time) * dir;
  });

  return sorted;
}

// 백엔드 /api/symbols 에서 심볼 목록을 가져온다.
async function fetchSymbols(market: string): Promise<SymbolRow[]> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL 이 설정되지 않았습니다.");
  }

  const m = market.toLowerCase();

  const url = `${API_BASE}/api/symbols?market=${encodeURIComponent(
    m
  )}&status=TRADING`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("심볼 데이터를 불러오지 못했습니다.");
  }

  const json = await res.json();
  const items = (json.items || []) as any[];

  const rows: SymbolRow[] = items.map((item: any) => ({
    symbol: item.symbol,
    // 아직 Summary API가 없으므로 0으로 채움
    price: Number(item.last_price ?? 0),
    volume: Number(item.volume_24h ?? 0),
    change24h: Number(item.change_24h ?? 0),
    time: item.onboard_date ? new Date(item.onboard_date).getTime() : 0
  }));

  return rows;
}

export function useSymbols() {
  const market = useSymbolsStore((s) => s.market);
  const sortKey = useSymbolsStore((s) => s.sortKey);
  const sortOrder = useSymbolsStore((s) => s.sortOrder);

  const query = useQuery<SymbolRow[]>({
    queryKey: ["symbols", market],
    queryFn: () => fetchSymbols(market),
    refetchInterval: 5000,
    staleTime: 4000
  });

  const sortedData = useMemo(
    () => sortSymbols(query.data ?? [], sortKey, sortOrder),
    [query.data, sortKey, sortOrder]
  );

  return {
    ...query,
    data: sortedData
  };
}
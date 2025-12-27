"use client";

import { create } from "zustand";

export type Market = "spot" | "um";
export type SortKey = "symbol" | "price" | "volume" | "quoteVolume" | "change24h" | "time";

type SortOrder = "asc" | "desc";

type SymbolsStoreState = {
  market: Market;
  sortKey: SortKey;
  sortOrder: SortOrder;
  setMarket: (market: Market) => void;
  setSortKey: (key: SortKey) => void;
  toggleSortOrder: () => void;
};

export const useSymbolsStore = create<SymbolsStoreState>((set) => ({
  market: "spot",
  // 기본: 거래량 내림차순
  sortKey: "volume",
  sortOrder: "desc",
  setMarket: (market) => set({ market }),
  setSortKey: (sortKey) => set({ sortKey }),
  toggleSortOrder: () =>
    set((state) => ({
      sortOrder: state.sortOrder === "asc" ? "desc" : "asc"
    }))
}));

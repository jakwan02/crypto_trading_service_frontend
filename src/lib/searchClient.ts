"use client";

// 변경 이유: Week6 전역 검색/트렌딩/내 스크리너 검색 UI를 위해 검색 API 클라이언트 추가

import { apiRequest } from "@/lib/appClient";
import { publicRequest } from "@/lib/publicClient";
import { getAcc } from "@/lib/token";

export type SearchSymbolItem = {
  market: string;
  symbol: string;
  base_asset?: string;
  quote_asset?: string;
  status?: string;
};

export type SearchPostItem = {
  slug: string;
  title: string;
  summary?: string | null;
  published_at?: string | null;
  category_id?: string | null;
};

export type PublicSearchResponse = {
  q: string;
  symbols: SearchSymbolItem[];
  posts: SearchPostItem[];
};

export type TrendingItem = { keyword: string; count: number };
export type TrendingResponse = { range: string; items: TrendingItem[] };

export async function searchPublic(params: { q: string; types?: string; limit?: number }): Promise<PublicSearchResponse> {
  const qs = new URLSearchParams();
  qs.set("q", params.q);
  if (params.types) qs.set("types", params.types);
  if (params.limit) qs.set("limit", String(params.limit));
  return await publicRequest<PublicSearchResponse>(`/search?${qs.toString()}`, { method: "GET" });
}

export async function getTrending(params?: { range?: "24h" | "7d"; limit?: number }): Promise<TrendingResponse> {
  const qs = new URLSearchParams();
  if (params?.range) qs.set("range", params.range);
  if (params?.limit) qs.set("limit", String(params.limit));
  const tail = qs.toString();
  return await publicRequest<TrendingResponse>(`/search/trending${tail ? `?${tail}` : ""}`, { method: "GET" });
}

export type ScreenerSearchItem = { id: string; name: string; market: string; updated_at?: string | null };
export type ScreenerSearchResponse = { q: string; items: ScreenerSearchItem[] };

export async function searchMyScreeners(params: { q: string; limit?: number }): Promise<ScreenerSearchResponse> {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  const qs = new URLSearchParams();
  qs.set("q", params.q);
  qs.set("type", "screeners");
  if (params.limit) qs.set("limit", String(params.limit));
  return await apiRequest<ScreenerSearchResponse>(`/search?${qs.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` }
  });
}


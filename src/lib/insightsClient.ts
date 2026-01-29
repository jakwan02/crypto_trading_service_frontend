import { publicRequest } from "@/lib/publicClient";
import type { AnomaliesLatestResponse, AnomalyKind, AnomalyWindow, BreadthHistoryResponse, BreadthLatestResponse, BreadthWindow, InsightMarket } from "@/types/insights";

export async function getBreadthLatest(params?: { market?: InsightMarket; window?: BreadthWindow }): Promise<BreadthLatestResponse> {
  const q = new URLSearchParams();
  if (params?.market) q.set("market", String(params.market));
  if (params?.window) q.set("window", String(params.window));
  const qs = q.toString();
  return await publicRequest<BreadthLatestResponse>(`/breadth/latest${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getBreadthHistory(params?: { market?: InsightMarket; window?: BreadthWindow; days?: number }): Promise<BreadthHistoryResponse> {
  const q = new URLSearchParams();
  if (params?.market) q.set("market", String(params.market));
  if (params?.window) q.set("window", String(params.window));
  if (params?.days) q.set("days", String(params.days));
  const qs = q.toString();
  return await publicRequest<BreadthHistoryResponse>(`/breadth/history${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getAnomaliesLatest(params?: { market?: InsightMarket; window?: AnomalyWindow; kind?: AnomalyKind; limit?: number }): Promise<AnomaliesLatestResponse> {
  const q = new URLSearchParams();
  if (params?.market) q.set("market", String(params.market));
  if (params?.window) q.set("window", String(params.window));
  if (params?.kind) q.set("kind", String(params.kind));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return await publicRequest<AnomaliesLatestResponse>(`/anomalies/latest${qs ? `?${qs}` : ""}`, { method: "GET" });
}


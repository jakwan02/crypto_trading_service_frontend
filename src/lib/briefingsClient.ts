import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { Briefing, BriefingKind, BriefingListResponse } from "@/types/briefings";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function getLatestBriefing(kind: BriefingKind = "daily"): Promise<Briefing> {
  const q = new URLSearchParams();
  if (kind) q.set("kind", String(kind));
  const qs = q.toString();
  return await apiRequest<Briefing>(`/briefings/latest${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function listBriefings(params?: { kind?: BriefingKind; cursor?: string | null; limit?: number }): Promise<BriefingListResponse> {
  const q = new URLSearchParams();
  if (params?.kind) q.set("kind", String(params.kind));
  if (params?.cursor) q.set("cursor", String(params.cursor));
  if (params?.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return await apiRequest<BriefingListResponse>(`/briefings${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function getBriefing(id: string): Promise<Briefing> {
  return await apiRequest<Briefing>(`/briefings/${encodeURIComponent(id)}`, { method: "GET", headers: requireAuthHeaders() });
}


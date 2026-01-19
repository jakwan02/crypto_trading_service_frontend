import { publicRequest } from "@/lib/publicClient";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { ChangelogDetail, ChangelogListResponse } from "@/types/changelog";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function listChangelog(params: { type?: string | null; cursor?: string | null; limit?: number | null }): Promise<ChangelogListResponse> {
  const q = new URLSearchParams();
  if (params.type) q.set("type", params.type);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return await publicRequest<ChangelogListResponse>(`/changelog${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getChangelog(slug: string): Promise<ChangelogDetail> {
  return await publicRequest<ChangelogDetail>(`/changelog/${encodeURIComponent(slug)}`, { method: "GET" });
}

export async function adminListChangelog(): Promise<{ items: Array<Record<string, unknown>> }> {
  return await apiRequest("/admin/changelog", { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateChangelog(payload: Record<string, unknown>): Promise<{ id: string }> {
  return await apiRequest("/admin/changelog", { method: "POST", headers: requireAuthHeaders(), json: payload });
}

export async function adminPatchChangelog(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/changelog/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload });
}

export async function adminDeleteChangelog(id: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/changelog/${encodeURIComponent(id)}`, { method: "DELETE", headers: requireAuthHeaders() });
}


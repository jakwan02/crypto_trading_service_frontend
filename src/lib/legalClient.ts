import { publicRequest } from "@/lib/publicClient";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { LegalDoc, LegalVersionsResponse } from "@/types/legal";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function getLatestLegal(kind: string, locale?: string | null): Promise<LegalDoc> {
  const q = new URLSearchParams();
  if (locale) q.set("locale", locale);
  const qs = q.toString();
  return await publicRequest<LegalDoc>(`/legal/${encodeURIComponent(kind)}/latest${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function listLegalVersions(kind: string, locale?: string | null): Promise<LegalVersionsResponse> {
  const q = new URLSearchParams();
  if (locale) q.set("locale", locale);
  const qs = q.toString();
  return await publicRequest<LegalVersionsResponse>(`/legal/${encodeURIComponent(kind)}/versions${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function getLegalByVersion(kind: string, version: string, locale?: string | null): Promise<LegalDoc> {
  const q = new URLSearchParams();
  if (locale) q.set("locale", locale);
  const qs = q.toString();
  return await publicRequest<LegalDoc>(`/legal/${encodeURIComponent(kind)}/${encodeURIComponent(version)}${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function acceptLegal(payload: { kind: string; version: string; locale?: string | null }): Promise<{ ok: boolean }> {
  return await apiRequest("/legal/accept", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: { kind: payload.kind, version: payload.version, locale: payload.locale || undefined }
  });
}

export async function adminListLegal(): Promise<{ items: Array<Record<string, unknown>> }> {
  return await apiRequest("/admin/legal", { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateLegal(payload: Record<string, unknown>): Promise<{ id: string }> {
  return await apiRequest("/admin/legal", { method: "POST", headers: requireAuthHeaders(), json: payload });
}

export async function adminPatchLegal(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/legal/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload });
}

export async function adminDeleteLegal(id: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/legal/${encodeURIComponent(id)}`, { method: "DELETE", headers: requireAuthHeaders() });
}


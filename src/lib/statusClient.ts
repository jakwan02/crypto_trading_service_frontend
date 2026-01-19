import { publicRequest } from "@/lib/publicClient";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { CursorPage, StatusIncident, StatusMaintenance, StatusSummary } from "@/types/status";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function getStatusSummary(): Promise<StatusSummary> {
  return await publicRequest<StatusSummary>("/status/summary", { method: "GET" });
}

export async function listStatusIncidents(
  cursor?: string | null,
  limit?: number | null,
  status?: string | null
): Promise<CursorPage<StatusIncident>> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (limit) q.set("limit", String(limit));
  if (status) q.set("status", status);
  const qs = q.toString();
  return await publicRequest<CursorPage<StatusIncident>>(`/status/incidents${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function listStatusMaintenances(
  cursor?: string | null,
  limit?: number | null,
  status?: string | null
): Promise<CursorPage<StatusMaintenance>> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (limit) q.set("limit", String(limit));
  if (status) q.set("status", status);
  const qs = q.toString();
  return await publicRequest<CursorPage<StatusMaintenance>>(`/status/maintenances${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function adminListStatusIncidents(): Promise<{ items: Array<Pick<StatusIncident, "id" | "component" | "severity" | "status" | "title" | "started_at" | "resolved_at" | "updated_at">> }> {
  return await apiRequest("/admin/status/incidents", { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateStatusIncident(payload: {
  component: string;
  severity: string;
  status?: string;
  title: string;
  body_md: string;
  started_at?: string | null;
  resolved_at?: string | null;
}): Promise<{ id: string }> {
  return await apiRequest("/admin/status/incidents", { method: "POST", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}

export async function adminPatchStatusIncident(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/status/incidents/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload });
}

export async function adminDeleteStatusIncident(id: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/status/incidents/${encodeURIComponent(id)}`, { method: "DELETE", headers: requireAuthHeaders() });
}

export async function adminListStatusMaintenances(): Promise<{ items: Array<{ id: string; status: string; title: string; start_at: string; end_at: string | null; updated_at: string }> }> {
  return await apiRequest("/admin/status/maintenances", { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateStatusMaintenance(payload: {
  status?: string;
  title: string;
  body_md: string;
  start_at: string;
  end_at?: string | null;
}): Promise<{ id: string }> {
  return await apiRequest("/admin/status/maintenances", { method: "POST", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}

export async function adminPatchStatusMaintenance(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/status/maintenances/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload });
}

export async function adminDeleteStatusMaintenance(id: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/status/maintenances/${encodeURIComponent(id)}`, { method: "DELETE", headers: requireAuthHeaders() });
}


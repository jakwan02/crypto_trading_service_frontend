import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type {
  AlertEventListResponse,
  AlertRuleCreateRequest,
  AlertRuleCreateResponse,
  AlertRuleListResponse,
  AlertRulePatchRequest
} from "@/types/alerts";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function listAlertRules(): Promise<AlertRuleListResponse> {
  return await apiRequest<AlertRuleListResponse>("/alerts/rules", { method: "GET", headers: requireAuthHeaders() });
}

export async function createAlertRule(req: AlertRuleCreateRequest): Promise<AlertRuleCreateResponse> {
  return await apiRequest<AlertRuleCreateResponse>("/alerts/rules", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: req as unknown as Record<string, unknown>
  });
}

export async function patchAlertRule(id: string, patch: AlertRulePatchRequest): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/alerts/rules/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: patch as unknown as Record<string, unknown>
  });
}

export async function deleteAlertRule(id: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/alerts/rules/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}

export async function listAlertEvents(cursor?: string | null, limit?: number | null, includeOutcomes?: boolean): Promise<AlertEventListResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (limit) q.set("limit", String(limit));
  if (includeOutcomes) q.set("include_outcomes", "1");
  const qs = q.toString();
  return await apiRequest<AlertEventListResponse>(`/alerts/events${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

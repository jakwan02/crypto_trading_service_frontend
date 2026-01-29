import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { WebhookListResponse } from "@/types/webhooks";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function listWebhooks(): Promise<WebhookListResponse> {
  return await apiRequest<WebhookListResponse>("/webhooks", { method: "GET", headers: requireAuthHeaders() });
}

export async function createWebhook(payload: { url: string; enabled?: boolean }): Promise<{ id?: string; secret?: string }> {
  return await apiRequest<{ id?: string; secret?: string }>("/webhooks", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: payload as unknown as Record<string, unknown>
  });
}

export async function patchWebhook(endpointId: string, payload: { url?: string; enabled?: boolean; rotate_secret?: boolean }): Promise<{ ok?: boolean; secret?: string }> {
  return await apiRequest<{ ok?: boolean; secret?: string }>(`/webhooks/${encodeURIComponent(endpointId)}`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: payload as unknown as Record<string, unknown>
  });
}

export async function deleteWebhook(endpointId: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/webhooks/${encodeURIComponent(endpointId)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}


import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type DeveloperApiKey = {
  id: string;
  name: string;
  prefix: string;
  last_used_at?: string | null;
  revoked_at?: string | null;
  created_at?: string | null;
};

export async function listDeveloperApiKeys(): Promise<{ items: DeveloperApiKey[] }> {
  return await apiRequest<{ items: DeveloperApiKey[] }>("/developer/api_keys", { method: "GET", headers: requireAuthHeaders() });
}

export async function createDeveloperApiKey(name: string): Promise<{ api_key: string; prefix: string; id: string }> {
  return await apiRequest<{ api_key: string; prefix: string; id: string }>("/developer/api_keys", { method: "POST", headers: requireAuthHeaders(), json: { name } });
}

export async function revokeDeveloperApiKey(id: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/developer/api_keys/${encodeURIComponent(id)}/revoke`, { method: "POST", headers: requireAuthHeaders() });
}

export async function rotateDeveloperApiKey(id: string): Promise<{ api_key: string; prefix: string; id: string }> {
  return await apiRequest<{ api_key: string; prefix: string; id: string }>(`/developer/api_keys/${encodeURIComponent(id)}/rotate`, { method: "POST", headers: requireAuthHeaders() });
}

export async function adminRevokeApiKey(id: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/admin/api_keys/${encodeURIComponent(id)}/revoke`, { method: "POST", headers: requireAuthHeaders() });
}


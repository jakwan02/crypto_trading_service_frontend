import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { Strategy, StrategyCreateRequest, StrategyListResponse, StrategyRun, StrategyRunCreateRequest } from "@/types/strategy";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function listStrategies(): Promise<StrategyListResponse> {
  return await apiRequest<StrategyListResponse>("/strategies", { method: "GET", headers: requireAuthHeaders() });
}

export async function createStrategy(payload: StrategyCreateRequest): Promise<{ id?: string }> {
  return await apiRequest<{ id?: string }>("/strategies", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: payload as unknown as Record<string, unknown>
  });
}

export async function getStrategy(id: string): Promise<Strategy> {
  return await apiRequest<Strategy>(`/strategies/${encodeURIComponent(id)}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function patchStrategy(id: string, patch: Partial<StrategyCreateRequest>): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/strategies/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: patch as unknown as Record<string, unknown>
  });
}

export async function deleteStrategy(id: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/strategies/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}

export async function createStrategyRun(strategyId: string, payload: StrategyRunCreateRequest): Promise<{ id?: string }> {
  return await apiRequest<{ id?: string }>(`/strategies/${encodeURIComponent(strategyId)}/runs`, {
    method: "POST",
    headers: requireAuthHeaders(),
    json: payload as unknown as Record<string, unknown>
  });
}

export async function getStrategyRun(runId: string): Promise<StrategyRun> {
  return await apiRequest<StrategyRun>(`/strategy-runs/${encodeURIComponent(runId)}`, { method: "GET", headers: requireAuthHeaders() });
}


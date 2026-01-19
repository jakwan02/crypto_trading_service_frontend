import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type {
  PortfolioCashCreateRequest,
  PortfolioCashListResponse,
  PortfolioPerfResponse,
  PortfolioResponse,
  PortfolioTxCreateRequest,
  PortfolioTxListResponse
} from "@/types/portfolio";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function getPortfolio(): Promise<PortfolioResponse> {
  return await apiRequest<PortfolioResponse>("/portfolio", { method: "GET", headers: requireAuthHeaders() });
}

export async function listPortfolioTx(cursor?: string | null, limit?: number | null): Promise<PortfolioTxListResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return await apiRequest<PortfolioTxListResponse>(`/portfolio/tx${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

export async function createPortfolioTx(req: PortfolioTxCreateRequest): Promise<{ id?: string }> {
  return await apiRequest<{ id?: string }>("/portfolio/tx", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: req as unknown as Record<string, unknown>
  });
}

export async function deletePortfolioTx(id: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/portfolio/tx/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}

export async function listPortfolioCash(cursor?: string | null, limit?: number | null): Promise<PortfolioCashListResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return await apiRequest<PortfolioCashListResponse>(`/portfolio/cash${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

export async function createPortfolioCash(req: PortfolioCashCreateRequest): Promise<{ id?: string }> {
  return await apiRequest<{ id?: string }>("/portfolio/cash", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: req as unknown as Record<string, unknown>
  });
}

export async function deletePortfolioCash(id: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/portfolio/cash/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}

export async function getPortfolioPerf(): Promise<PortfolioPerfResponse> {
  return await apiRequest<PortfolioPerfResponse>("/portfolio/perf", { method: "GET", headers: requireAuthHeaders() });
}


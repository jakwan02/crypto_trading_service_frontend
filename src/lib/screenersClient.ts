import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type {
  SavedScreenerCreateRequest,
  SavedScreenerCreateResponse,
  SavedScreenerListResponse,
  ScreenerRunRequest,
  ScreenerRunResponse
} from "@/types/screener";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function runScreener(req: ScreenerRunRequest): Promise<ScreenerRunResponse> {
  return await apiRequest<ScreenerRunResponse>("/screeners/run", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: {
      dsl: req.dsl,
      cursor: req.cursor ?? undefined,
      limit: req.limit ?? undefined
    }
  });
}

export async function listSavedScreeners(): Promise<SavedScreenerListResponse> {
  return await apiRequest<SavedScreenerListResponse>("/screeners", { method: "GET", headers: requireAuthHeaders() });
}

export async function createSavedScreener(req: SavedScreenerCreateRequest): Promise<SavedScreenerCreateResponse> {
  return await apiRequest<SavedScreenerCreateResponse>("/screeners", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: { name: req.name, market: req.market, dsl: req.dsl }
  });
}

export async function patchSavedScreener(
  id: string,
  patch: Partial<SavedScreenerCreateRequest>
): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/screeners/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: { name: patch.name, dsl: patch.dsl }
  });
}

export async function deleteSavedScreener(id: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/screeners/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}


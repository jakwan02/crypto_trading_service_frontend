import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type {
  NormalizedSharedWatchlist,
  Watchlist,
  WatchlistCreateRequest,
  WatchlistCreateResponse,
  WatchlistItem,
  WatchlistsResponse,
  WatchlistShareResponse,
  WatchlistUpdateRequest
} from "@/types/watchlists";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) {
    throw new Error("Missing access token.");
  }
  return { Authorization: `Bearer ${token}` };
}

export async function listWatchlists(): Promise<WatchlistsResponse> {
  return await apiRequest<WatchlistsResponse>("/watchlists", { method: "GET", headers: requireAuthHeaders() });
}

export async function getWatchlist(id: string): Promise<Watchlist> {
  return await apiRequest<Watchlist>(`/watchlists/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

export async function createWatchlist(body: WatchlistCreateRequest): Promise<WatchlistCreateResponse> {
  return await apiRequest<WatchlistCreateResponse>("/watchlists", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: {
      name: body.name,
      tags: body.tags ?? [],
      is_public: body.is_public ?? false
    }
  });
}

export async function updateWatchlist(id: string, body: WatchlistUpdateRequest): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/watchlists/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: body as Record<string, unknown>
  });
}

export async function deleteWatchlist(id: string): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/watchlists/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}

export async function addWatchlistItem(
  watchlistId: string,
  body: { market?: string; symbol: string }
): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>(`/watchlists/${encodeURIComponent(watchlistId)}/items`, {
    method: "POST",
    headers: requireAuthHeaders(),
    json: {
      market: body.market,
      symbol: body.symbol
    }
  });
}

export async function deleteWatchlistItem(
  watchlistId: string,
  symbol: string,
  market?: string
): Promise<{ ok?: boolean }> {
  const q = market ? `?market=${encodeURIComponent(market)}` : "";
  return await apiRequest<{ ok?: boolean }>(
    `/watchlists/${encodeURIComponent(watchlistId)}/items/${encodeURIComponent(symbol)}${q}`,
    {
      method: "DELETE",
      headers: requireAuthHeaders()
    }
  );
}

export async function favoritesAdd(symbol: string, market?: string): Promise<{ ok?: boolean }> {
  const q = market ? `?market=${encodeURIComponent(market)}` : "";
  return await apiRequest<{ ok?: boolean }>(`/watchlists/favorites/${encodeURIComponent(symbol)}${q}`, {
    method: "PUT",
    headers: requireAuthHeaders()
  });
}

export async function favoritesRemove(symbol: string, market?: string): Promise<{ ok?: boolean }> {
  const q = market ? `?market=${encodeURIComponent(market)}` : "";
  return await apiRequest<{ ok?: boolean }>(`/watchlists/favorites/${encodeURIComponent(symbol)}${q}`, {
    method: "DELETE",
    headers: requireAuthHeaders()
  });
}

export async function shareWatchlist(id: string): Promise<WatchlistShareResponse> {
  return await apiRequest<WatchlistShareResponse>(`/watchlists/${encodeURIComponent(id)}/share`, {
    method: "POST",
    headers: requireAuthHeaders()
  });
}

export async function getFavorites(): Promise<{ watchlistId: string | null; items: WatchlistItem[] }> {
  const list = await listWatchlists();
  const wl = (list.items ?? []).find((w) => Boolean(w.is_default));
  if (!wl?.id) return { watchlistId: null, items: [] };
  const detail = await getWatchlist(String(wl.id));
  return { watchlistId: String(detail.id), items: (detail.items ?? []) as WatchlistItem[] };
}


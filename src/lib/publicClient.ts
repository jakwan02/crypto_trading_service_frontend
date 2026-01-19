import type { ApiError } from "@/lib/appClient";
import type { NormalizedSharedWatchlist, PublicSharedWatchlistResponse } from "@/types/watchlists";

const DEFAULT_API_BASE_URL = "http://localhost:8001";

function stripTrailingSlash(value: string): string {
  if (!value.endsWith("/")) return value;
  return value.slice(0, -1);
}

function stripKnownSuffix(value: string): string {
  const trimmed = stripTrailingSlash(value);
  if (trimmed.endsWith("/api")) return trimmed.slice(0, -4);
  if (trimmed.endsWith("/app")) return trimmed.slice(0, -4);
  return trimmed;
}

function resolveApiBase(): string {
  const env = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
  const root = stripKnownSuffix(env);
  return `${root}/api`;
}

const API_BASE_URL = resolveApiBase();

function withApiToken(headers: Headers): void {
  const token = String(process.env.NEXT_PUBLIC_API_TOKEN || "").trim();
  if (token) headers.set("X-API-Token", token);
}

function parseRetryAfterSec(res: Response): number | undefined {
  const raw = String(res.headers.get("Retry-After") || "").trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

async function safeJson(res: Response): Promise<unknown | null> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function normalizeMessage(payload: unknown, status: number): { message: string; code: string } {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message =
      (typeof record.message === "string" && record.message) ||
      (typeof record.detail === "string" && record.detail) ||
      (typeof record.code === "string" && record.code) ||
      (typeof record.error === "string" && record.error) ||
      `Request failed (${status})`;
    const code =
      (typeof record.code === "string" && record.code) ||
      (typeof record.error === "string" && record.error) ||
      (typeof record.detail === "string" && record.detail) ||
      String(status);
    return { message, code };
  }
  return { message: `Request failed (${status})`, code: String(status) };
}

function buildUrl(path: string): string {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function publicRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  withApiToken(headers);

  const url = buildUrl(path);
  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  if (res.status === 204) return null as T;

  const payload = await safeJson(res);
  if (!res.ok) {
    const { message, code } = normalizeMessage(payload, res.status);
    const error = new Error(message) as ApiError;
    error.code = code;
    error.status = res.status;
    error.payload = payload ?? undefined;
    error.retry_after = parseRetryAfterSec(res);
    throw error;
  }
  return (payload ?? null) as T;
}

function normalizeShared(payload: PublicSharedWatchlistResponse | unknown): NormalizedSharedWatchlist {
  const obj = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const itemsRaw = Array.isArray((obj as { items?: unknown[] }).items) ? (obj as { items?: unknown[] }).items ?? [] : [];
  const symbolsRaw = Array.isArray((obj as { symbols?: unknown[] }).symbols) ? (obj as { symbols?: unknown[] }).symbols ?? [] : [];

  const items: Array<{ market: "spot" | "um" | "cm"; symbol: string }> = [];
  for (const it of itemsRaw) {
    if (!it || typeof it !== "object") continue;
    const rec = it as Record<string, unknown>;
    const symbol = String(rec.symbol || "").trim().toUpperCase();
    if (!symbol) continue;
    const market = String(rec.market || "spot").trim().toLowerCase();
    const m = market === "um" || market === "cm" || market === "spot" ? market : "spot";
    items.push({ market: m, symbol });
  }
  for (const sym of symbolsRaw) {
    const s = String(sym || "").trim().toUpperCase();
    if (!s) continue;
    items.push({ market: "spot", symbol: s });
  }

  return { items };
}

export async function getSharedWatchlist(token: string): Promise<NormalizedSharedWatchlist> {
  const t = String(token || "").trim();
  const payload = await publicRequest<PublicSharedWatchlistResponse>(`/watchlists/shared/${encodeURIComponent(t)}`, {
    method: "GET"
  });
  return normalizeShared(payload);
}

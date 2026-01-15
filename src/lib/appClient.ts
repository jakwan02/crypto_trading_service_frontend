export type ApiError = Error & {
  code?: string;
  status?: number;
  payload?: unknown;
};

import { getAcc, setAcc } from "@/lib/token";

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

function resolveAppBase(): string {
  const env = String(process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).trim();
  const root = stripKnownSuffix(env);
  return `${root}/app`;
}

const APP_BASE_URL = resolveAppBase();

function withApiToken(headers: Headers): void {
  const token = String(process.env.NEXT_PUBLIC_API_TOKEN || "").trim();
  if (token) headers.set("X-API-Token", token);
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
  if (!path) return APP_BASE_URL;
  return `${APP_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

type ApiRequestInit = RequestInit & {
  json?: Record<string, unknown>;
  csrf?: boolean;
};

function getCookieValue(name: string): string {
  if (typeof document === "undefined") return "";
  const target = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((part) => part.trim());
  for (const part of parts) {
    if (!part.startsWith(target)) continue;
    return decodeURIComponent(part.slice(target.length));
  }
  return "";
}

function isInvalidTokenPayload(payload: unknown): boolean {
  if (!payload) return false;
  if (typeof payload === "string") return payload === "invalid_token";
  if (typeof payload !== "object") return false;
  const record = payload as Record<string, unknown>;
  if (record.detail === "invalid_token") return true;
  if (record.code === "invalid_token") return true;
  if (record.error === "invalid_token") return true;
  return false;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  const csrf = getCookieValue("csrf");
  if (!csrf) return null;

  const headers = new Headers();
  withApiToken(headers);
  headers.set("X-CSRF-Token", csrf);
  try {
    const res = await fetch(buildUrl("/auth/refresh"), {
      method: "POST",
      headers,
      credentials: "include"
    });
    if (!res.ok) return null;
    const payload = (await safeJson(res)) as Record<string, unknown> | null;
    const token = payload && typeof payload.access_token === "string" ? payload.access_token : "";
    if (!token) return null;
    setAcc(token);
    return token;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  withApiToken(headers);
  if (init.csrf) {
    const csrf = getCookieValue("csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  let body = init.body;
  if (init.json) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(init.json);
  }

  const url = buildUrl(path);
  const res = await fetch(url, {
    ...init,
    body,
    headers,
    credentials: "include"
  });

  if (res.status === 204) return null as T;

  let payload = await safeJson(res);

  // 변경 이유: access token 만료/무효(401 invalid_token) 시 refresh로 1회 복구 후 재시도
  const canRetry =
    res.status === 401 &&
    isInvalidTokenPayload(payload) &&
    !String(path || "").startsWith("/auth/") &&
    String(headers.get("Authorization") || "").toLowerCase().startsWith("bearer ");
  if (canRetry) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken || getAcc()}`);
      const res2 = await fetch(url, {
        ...init,
        body,
        headers,
        credentials: "include"
      });
      if (res2.status === 204) return null as T;
      payload = await safeJson(res2);
      if (res2.ok) return (payload ?? null) as T;
      const { message, code } = normalizeMessage(payload, res2.status);
      const error = new Error(message) as ApiError;
      error.code = code;
      error.status = res2.status;
      error.payload = payload ?? undefined;
      throw error;
    }
  }

  if (!res.ok) {
    const { message, code } = normalizeMessage(payload, res.status);
    const error = new Error(message) as ApiError;
    error.code = code;
    error.status = res.status;
    error.payload = payload ?? undefined;
    throw error;
  }

  return (payload ?? null) as T;
}

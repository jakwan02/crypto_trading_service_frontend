import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { TelegramLinkResponse, TelegramTestResponse, TelegramUnlinkResponse } from "@/types/telegram";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function issueTelegramLink(): Promise<TelegramLinkResponse> {
  return await apiRequest<TelegramLinkResponse>("/telegram/link", { method: "POST", headers: requireAuthHeaders() });
}

export async function unlinkTelegram(): Promise<TelegramUnlinkResponse> {
  return await apiRequest<TelegramUnlinkResponse>("/telegram/unlink", { method: "POST", headers: requireAuthHeaders() });
}

export async function testTelegram(): Promise<TelegramTestResponse> {
  return await apiRequest<TelegramTestResponse>("/telegram/test", { method: "POST", headers: requireAuthHeaders() });
}


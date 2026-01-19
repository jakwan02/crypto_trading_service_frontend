import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type {
  PushSubscribeRequest,
  PushSubscribeResponse,
  PushUnsubscribeRequest,
  PushUnsubscribeResponse,
  VapidPublicKeyResponse
} from "@/types/push";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function getVapidPublicKey(): Promise<VapidPublicKeyResponse> {
  return await apiRequest<VapidPublicKeyResponse>("/push/vapid", { method: "GET", headers: requireAuthHeaders() });
}

export async function subscribePush(req: PushSubscribeRequest): Promise<PushSubscribeResponse> {
  return await apiRequest<PushSubscribeResponse>("/push/subscribe", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: req as unknown as Record<string, unknown>
  });
}

export async function unsubscribePush(req: PushUnsubscribeRequest): Promise<PushUnsubscribeResponse> {
  return await apiRequest<PushUnsubscribeResponse>("/push/unsubscribe", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: req as unknown as Record<string, unknown>
  });
}

export async function testPush(): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>("/push/test", { method: "POST", headers: requireAuthHeaders() });
}


import { publicRequest } from "@/lib/publicClient";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type { FaqListResponse, SupportTicketDetail, SupportTicketsResponse } from "@/types/support";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export async function listFaqs(category?: string | null): Promise<FaqListResponse> {
  const q = new URLSearchParams();
  if (category) q.set("category", category);
  const qs = q.toString();
  return await publicRequest<FaqListResponse>(`/faq${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export async function listMyTickets(cursor?: string | null, limit?: number | null): Promise<SupportTicketsResponse> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  if (limit) q.set("limit", String(limit));
  const qs = q.toString();
  return await apiRequest<SupportTicketsResponse>(`/support/tickets${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function createTicket(payload: { subject: string; category?: string | null; priority?: string | null; body: string }): Promise<{ id: string }> {
  return await apiRequest("/support/tickets", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: { subject: payload.subject, category: payload.category || undefined, priority: payload.priority || undefined, body: payload.body }
  });
}

export async function getMyTicket(id: string): Promise<SupportTicketDetail> {
  return await apiRequest<SupportTicketDetail>(`/support/tickets/${encodeURIComponent(id)}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function addMyTicketMessage(id: string, body: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/support/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", headers: requireAuthHeaders(), json: { body } });
}

export async function closeMyTicket(id: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/support/tickets/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: { status: "closed" } });
}

export async function adminListFaqs(): Promise<{ items: Array<Record<string, unknown>> }> {
  return await apiRequest("/admin/support/faqs", { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateFaq(payload: Record<string, unknown>): Promise<{ id: string }> {
  return await apiRequest("/admin/support/faqs", { method: "POST", headers: requireAuthHeaders(), json: payload });
}

export async function adminPatchFaq(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/support/faqs/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload });
}

export async function adminDeleteFaq(id: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/support/faqs/${encodeURIComponent(id)}`, { method: "DELETE", headers: requireAuthHeaders() });
}

export async function adminListTickets(params: { status?: string | null; q?: string | null }): Promise<{ items: Array<Record<string, unknown>> }> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.q) q.set("q", params.q);
  const qs = q.toString();
  return await apiRequest(`/admin/support/tickets${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function adminGetTicket(id: string): Promise<Record<string, unknown>> {
  return await apiRequest(`/admin/support/tickets/${encodeURIComponent(id)}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function adminReplyTicket(id: string, body: string): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/support/tickets/${encodeURIComponent(id)}/messages`, { method: "POST", headers: requireAuthHeaders(), json: { body } });
}

export async function adminPatchTicket(id: string, payload: Record<string, unknown>): Promise<{ ok: boolean }> {
  return await apiRequest(`/admin/support/tickets/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload });
}


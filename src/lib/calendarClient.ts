import { apiRequest } from "@/lib/appClient";
import { publicRequest } from "@/lib/publicClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type CalendarEvent = {
  id: string;
  type: string;
  title: string;
  body_md?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  market?: string | null;
  symbol?: string | null;
  importance: number;
  source?: string | null;
};

export async function listPublicCalendar(params: { from?: string | null; to?: string | null; type?: string | null; market?: string | null; symbol?: string | null; limit?: number | null }): Promise<{ items: CalendarEvent[]; server_time: string }> {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.type) q.set("type", params.type);
  if (params.market) q.set("market", params.market);
  if (params.symbol) q.set("symbol", params.symbol);
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return await publicRequest<{ items: CalendarEvent[]; server_time: string }>(`/calendar${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export type CalendarSubscription = { id: string; filters: Record<string, unknown>; channels: Record<string, unknown>; cooldown_sec: number; created_at?: string | null; updated_at?: string | null };

export async function getCalendarSubscription(): Promise<{ subscription: CalendarSubscription | null }> {
  return await apiRequest<{ subscription: CalendarSubscription | null }>("/calendar/subscriptions", { method: "GET", headers: requireAuthHeaders() });
}

export async function putCalendarSubscription(payload: { filters: Record<string, unknown>; channels: Record<string, unknown>; cooldown_sec: number }): Promise<{ subscription: CalendarSubscription }> {
  return await apiRequest<{ subscription: CalendarSubscription }>("/calendar/subscriptions", { method: "PUT", headers: requireAuthHeaders(), json: payload });
}

export type AdminCalendarEvent = CalendarEvent & { meta?: Record<string, unknown>; created_at?: string | null; updated_at?: string | null };

export async function adminListCalendarEvents(params: { cursor?: string | null; limit?: number | null; from?: string | null; to?: string | null; type?: string | null; market?: string | null; symbol?: string | null }): Promise<{ items: AdminCalendarEvent[]; cursor_next?: string | null }> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  if (params.type) q.set("type", params.type);
  if (params.market) q.set("market", params.market);
  if (params.symbol) q.set("symbol", params.symbol);
  const qs = q.toString();
  return await apiRequest<{ items: AdminCalendarEvent[]; cursor_next?: string | null }>(`/admin/calendar/events${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateCalendarEvent(payload: {
  type: string;
  title: string;
  body_md?: string | null;
  start_at: string;
  end_at?: string | null;
  market?: string | null;
  symbol?: string | null;
  importance?: number | null;
  source?: string | null;
  meta?: Record<string, unknown>;
}): Promise<{ item: AdminCalendarEvent }> {
  return await apiRequest<{ item: AdminCalendarEvent }>("/admin/calendar/events", { method: "POST", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}

export async function adminPatchCalendarEvent(id: string, payload: Partial<Omit<AdminCalendarEvent, "id">>): Promise<{ item: AdminCalendarEvent }> {
  return await apiRequest<{ item: AdminCalendarEvent }>(`/admin/calendar/events/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}

export async function adminDeleteCalendarEvent(id: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/admin/calendar/events/${encodeURIComponent(id)}`, { method: "DELETE", headers: requireAuthHeaders() });
}

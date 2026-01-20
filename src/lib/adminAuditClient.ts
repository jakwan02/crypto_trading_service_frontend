import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type AdminAuditEvent = {
  id: string;
  actor_user_id: string;
  action: string;
  target_type?: string | null;
  target_id?: string | null;
  meta?: Record<string, unknown>;
  ip?: string | null;
  ua?: string | null;
  created_at?: string | null;
};

export type AdminAuditList = { items: AdminAuditEvent[]; cursor_next?: string | null };

export async function adminListAudit(params: {
  cursor?: string | null;
  limit?: number | null;
  actor?: string | null;
  action?: string | null;
  from?: string | null;
  to?: string | null;
}): Promise<AdminAuditList> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.actor) q.set("actor", params.actor);
  if (params.action) q.set("action", params.action);
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const qs = q.toString();
  return await apiRequest<AdminAuditList>(`/admin/audit${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}


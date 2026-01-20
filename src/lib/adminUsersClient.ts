import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type AdminOverview = {
  users_total: number;
  active_users_7d: number;
  paid_users: number;
  pending_refund_requests: number;
  covered_symbols_total: number;
  api_p95_ms: number | null;
  server_time: string;
};

export async function adminGetOverview(): Promise<AdminOverview> {
  return await apiRequest<AdminOverview>("/admin/overview", { method: "GET", headers: requireAuthHeaders() });
}

export type AdminUserListItem = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  plan: string;
  email_verified: boolean;
  is_active: boolean;
  created_at?: string | null;
  last_login_at?: string | null;
  deleted_at?: string | null;
};

export type AdminUserListResponse = {
  items: AdminUserListItem[];
  cursor_next?: string | null;
};

export async function adminListUsers(params: {
  cursor?: string | null;
  limit?: number | null;
  q?: string | null;
  role?: string | null;
  status?: string | null;
}): Promise<AdminUserListResponse> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.q) q.set("q", params.q);
  if (params.role) q.set("role", params.role);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return await apiRequest<AdminUserListResponse>(`/admin/users${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

export type AdminUserDetail = {
  user: AdminUserListItem;
  security: { has_2fa: boolean; email_verified: boolean };
  ent_grants: Array<{
    id: string;
    plan_id: string;
    source: string;
    kind: string;
    provider: string;
    provider_ref?: string | null;
    starts_at?: string | null;
    ends_at?: string | null;
    status: string;
    created_at?: string | null;
  }>;
  invoices: Array<{
    id: string;
    status: string;
    provider: string;
    currency: string;
    amount_minor: number;
    minor_unit: number;
    paid_at?: string | null;
    issued_at?: string | null;
  }>;
  login_events: Array<{
    ok: boolean;
    reason?: string | null;
    ip?: string | null;
    created_at?: string | null;
  }>;
  api_keys: Array<{
    id: string;
    name: string;
    prefix: string;
    revoked_at?: string | null;
    last_used_at?: string | null;
    created_at?: string | null;
  }>;
};

export async function adminGetUser(userId: string): Promise<AdminUserDetail> {
  return await apiRequest<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

export async function adminPatchUserRole(userId: string, role: "user" | "admin"): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: { role }
  });
}

export async function adminCreateEntGrant(
  userId: string,
  payload: { plan_code: string; source?: "admin" | "promo"; starts_at?: string | null; ends_at?: string | null; reason?: string | null }
): Promise<{ id: string }> {
  return await apiRequest<{ id: string }>(`/admin/users/${encodeURIComponent(userId)}/ent_grants`, {
    method: "POST",
    headers: requireAuthHeaders(),
    json: payload as unknown as Record<string, unknown>
  });
}

export async function adminRevokeEntGrant(userId: string, grantId: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(
    `/admin/users/${encodeURIComponent(userId)}/ent_grants/${encodeURIComponent(grantId)}/revoke`,
    { method: "POST", headers: requireAuthHeaders() }
  );
}


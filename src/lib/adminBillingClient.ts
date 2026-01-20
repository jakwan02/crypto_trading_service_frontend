import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type AdminRefund = {
  id: string;
  user_id: string;
  invoice_id: string;
  payment_id: string;
  reason?: string | null;
  status: string;
  requested_at?: string | null;
  resolved_at?: string | null;
};

export type AdminRefundList = { items: AdminRefund[]; cursor_next?: string | null };

export async function adminListRefunds(params: { status?: string | null; cursor?: string | null; limit?: number | null }): Promise<AdminRefundList> {
  const q = new URLSearchParams();
  if (params.status) q.set("status", params.status);
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  const qs = q.toString();
  return await apiRequest<AdminRefundList>(`/admin/refunds${qs ? `?${qs}` : ""}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function adminApproveRefund(id: string): Promise<{ ok: boolean; status?: string }> {
  return await apiRequest<{ ok: boolean; status?: string }>(`/admin/refunds/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    headers: requireAuthHeaders()
  });
}

export async function adminDenyRefund(id: string): Promise<{ ok: boolean; status?: string }> {
  return await apiRequest<{ ok: boolean; status?: string }>(`/admin/refunds/${encodeURIComponent(id)}/deny`, {
    method: "POST",
    headers: requireAuthHeaders()
  });
}

export type AdminCoupon = {
  id: string;
  code: string;
  type: string;
  percent?: number | null;
  amount_cents?: number | null;
  currency?: string | null;
  max_redemptions?: number | null;
  redeemed_count: number;
  expires_at?: string | null;
  applies_plan_id?: string | null;
  is_active: boolean;
  created_at?: string | null;
};

export async function adminListCoupons(): Promise<{ items: AdminCoupon[] }> {
  return await apiRequest<{ items: AdminCoupon[] }>("/admin/coupons", { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateCoupon(payload: {
  code: string;
  type: "percent" | "amount";
  percent?: number | null;
  amount_cents?: number | null;
  currency?: string | null;
  max_redemptions?: number | null;
  expires_at?: string | null;
  applies_plan_id?: string | null;
}): Promise<{ item: AdminCoupon }> {
  return await apiRequest<{ item: AdminCoupon }>("/admin/coupons", { method: "POST", headers: requireAuthHeaders(), json: payload });
}

export async function adminPatchCoupon(id: string, payload: Partial<Omit<AdminCoupon, "id" | "code" | "redeemed_count" | "created_at">>): Promise<{ item: AdminCoupon }> {
  return await apiRequest<{ item: AdminCoupon }>(`/admin/coupons/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: requireAuthHeaders(),
    json: payload as Record<string, unknown>
  });
}

export async function adminDeactivateCoupon(id: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/admin/coupons/${encodeURIComponent(id)}/deactivate`, { method: "POST", headers: requireAuthHeaders() });
}

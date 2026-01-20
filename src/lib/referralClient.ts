import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

export type ReferralMe = { code: string; link?: string | null; invited_total: number; rewards_total: number };

export async function getReferralMe(): Promise<ReferralMe> {
  return await apiRequest<ReferralMe>("/referral/me", { method: "GET", headers: requireAuthHeaders() });
}

export async function claimReferral(code: string): Promise<{ ok: boolean; trial_days?: number }> {
  return await apiRequest<{ ok: boolean; trial_days?: number }>("/referral/claim", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: { code }
  });
}

export type AdminReferral = {
  id: string;
  status: string;
  code: string;
  referrer_user_id: string;
  referrer_email: string;
  referee_user_id: string;
  referee_email: string;
  created_at?: string | null;
};

export async function adminListReferrals(params: { cursor?: string | null; limit?: number | null; status?: string | null; q?: string | null }): Promise<{ items: AdminReferral[]; cursor_next?: string | null }> {
  const q = new URLSearchParams();
  if (params.cursor) q.set("cursor", params.cursor);
  if (params.limit) q.set("limit", String(params.limit));
  if (params.status) q.set("status", params.status);
  if (params.q) q.set("q", params.q);
  const qs = q.toString();
  return await apiRequest<{ items: AdminReferral[]; cursor_next?: string | null }>(`/admin/referrals${qs ? `?${qs}` : ""}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

export async function adminApproveReferral(id: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/admin/referrals/${encodeURIComponent(id)}/approve`, { method: "POST", headers: requireAuthHeaders() });
}

export async function adminVoidReferral(id: string): Promise<{ ok: boolean }> {
  return await apiRequest<{ ok: boolean }>(`/admin/referrals/${encodeURIComponent(id)}/void`, { method: "POST", headers: requireAuthHeaders() });
}

export type AffiliateLink = { id: string; label: string; url: string; disclosure_md: string; is_active: boolean; created_at?: string | null; updated_at?: string | null };

export async function adminListAffiliateLinks(active?: boolean | null): Promise<{ items: AffiliateLink[] }> {
  const qs = active === null || active === undefined ? "" : `?active=${active ? "true" : "false"}`;
  return await apiRequest<{ items: AffiliateLink[] }>(`/admin/affiliate_links${qs}`, { method: "GET", headers: requireAuthHeaders() });
}

export async function adminCreateAffiliateLink(payload: { label: string; url: string; disclosure_md: string }): Promise<{ item: AffiliateLink }> {
  return await apiRequest<{ item: AffiliateLink }>("/admin/affiliate_links", { method: "POST", headers: requireAuthHeaders(), json: payload });
}

export async function adminPatchAffiliateLink(id: string, payload: Partial<Pick<AffiliateLink, "label" | "url" | "disclosure_md" | "is_active">>): Promise<{ item: AffiliateLink }> {
  return await apiRequest<{ item: AffiliateLink }>(`/admin/affiliate_links/${encodeURIComponent(id)}`, { method: "PATCH", headers: requireAuthHeaders(), json: payload as Record<string, unknown> });
}

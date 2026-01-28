import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import type {
  BillingMe,
  CheckoutCreateRequest,
  CheckoutCreateResponse,
  CheckoutStatusResponse,
  InvoicesResponse,
  Invoice,
  PlansResponse,
  RefundRequestCreateRequest,
  RefundRequestCreateResponse
} from "@/types/billing";

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
  const envRaw = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim();
  // 변경 이유: env 미설정(또는 "/") 시 브라우저에서는 단일 오리진(/app)을 기본으로 사용해 CORS를 제거한다.
  if (!envRaw || envRaw === "/" || envRaw.startsWith("/")) {
    if (typeof window !== "undefined") return "/app";
    const root = stripKnownSuffix(DEFAULT_API_BASE_URL);
    return `${root}/app`;
  }
  const env = (envRaw || DEFAULT_API_BASE_URL).trim();
  const root = stripKnownSuffix(env);
  return `${root}/app`;
}

const APP_BASE_URL = resolveAppBase();

function requireAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) {
    throw new Error("Missing access token.");
  }
  return { Authorization: `Bearer ${token}` };
}

export async function getPlans(): Promise<PlansResponse> {
  return await apiRequest<PlansResponse>("/billing/plans", { method: "GET" });
}

export async function createCheckout(req: CheckoutCreateRequest): Promise<CheckoutCreateResponse> {
  const body: Record<string, unknown> = {
    plan_code: String(req.plan_code || "").trim().toLowerCase(),
    kind: req.kind,
    provider: req.provider,
    currency: req.currency,
    coupon: req.coupon || req.coupon_code || undefined,
    return_path: req.return_path,
    cancel_path: req.cancel_path
  };
  return await apiRequest<CheckoutCreateResponse>("/billing/checkout", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: body
  });
}

export async function getBillingMe(): Promise<BillingMe> {
  return await apiRequest<BillingMe>("/billing/me", { method: "GET", headers: requireAuthHeaders() });
}

export async function cancelSub(): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>("/billing/cancel", { method: "POST", headers: requireAuthHeaders() });
}

export async function reactivateSub(): Promise<{ ok?: boolean }> {
  return await apiRequest<{ ok?: boolean }>("/billing/reactivate", { method: "POST", headers: requireAuthHeaders() });
}

export async function changePlan(req: CheckoutCreateRequest): Promise<CheckoutCreateResponse> {
  const body: Record<string, unknown> = {
    plan_code: String(req.plan_code || "").trim().toLowerCase(),
    kind: req.kind,
    provider: req.provider,
    currency: req.currency,
    coupon: req.coupon || req.coupon_code || undefined,
    return_path: req.return_path,
    cancel_path: req.cancel_path
  };
  return await apiRequest<CheckoutCreateResponse>("/billing/change_plan", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: body
  });
}

export async function getInvoices(): Promise<InvoicesResponse> {
  return await apiRequest<InvoicesResponse>("/billing/invoices", { method: "GET", headers: requireAuthHeaders() });
}

export async function getInvoice(id: string): Promise<Invoice> {
  return await apiRequest<Invoice>(`/billing/invoices/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: requireAuthHeaders()
  });
}

// 변경 이유: download 엔드포인트가 있으면 그 URL을 새 탭으로 열면 된다(302 redirect 포함).
export function getInvoiceDownloadUrl(id: string): string {
  return `${APP_BASE_URL}/billing/invoices/${encodeURIComponent(id)}/download`;
}

export async function requestRefund(body: RefundRequestCreateRequest): Promise<RefundRequestCreateResponse> {
  return await apiRequest<RefundRequestCreateResponse>("/billing/request_refund", {
    method: "POST",
    headers: requireAuthHeaders(),
    json: { invoice_id: body.invoice_id, reason: body.reason }
  });
}

export async function getCheckoutStatus(orderNoOrId: string): Promise<CheckoutStatusResponse | null> {
  const key = String(orderNoOrId || "").trim();
  if (!key) return null;
  try {
    return await apiRequest<CheckoutStatusResponse>(`/billing/checkout/${encodeURIComponent(key)}/status`, {
      method: "GET",
      headers: requireAuthHeaders()
    });
  } catch (err) {
    const status = typeof err === "object" && err && "status" in err ? Number((err as { status?: unknown }).status) : 0;
    if (status === 404 || status === 405) return null;
    throw err;
  }
}

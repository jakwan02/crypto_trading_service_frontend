export type BillingCurrency = "KRW" | "USD" | "JPY" | "EUR";

export type BillingSkuKind = "sub" | "pass30";

export type BillingProvider = "eximbay" | "paypal" | "mock" | (string & {});

export type Entitlement = Record<string, unknown>;

export type PlanSku = {
  kind: BillingSkuKind;
  provider: BillingProvider;
  price_usd_cents?: number;
  is_active?: boolean;
};

export type Plan = {
  code: string;
  name?: string | null;
  ent?: Entitlement;
  sku?: PlanSku[];
};

export type PlansResponse = {
  plans?: Plan[];
};

export type CheckoutCreateRequest = {
  plan_code: string;
  kind: BillingSkuKind;
  provider?: BillingProvider;
  currency?: BillingCurrency;
  coupon?: string;
  // 구형/오탈자 대비
  coupon_code?: string;
  return_path: string;
  cancel_path: string;
};

export type CheckoutCreateResponse = {
  order_no?: string;
  checkout_id?: string;
  provider?: BillingProvider;
  redirect_url?: string;
  checkout_url?: string;
  expires_at?: string;
};

export type CheckoutStatusResponse = {
  status?: string;
  provider?: BillingProvider;
  kind?: BillingSkuKind | string;
  plan_id?: string;
  amount_minor?: number;
  minor_unit?: number;
  currency?: string;
  expires_at?: string;
};

export type Subscription = {
  id: string;
  kind?: string;
  provider?: string;
  status?: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  expires_at?: string | null;
  cancel_requested_at?: string | null;
  canceled_at?: string | null;
};

export type Invoice = {
  id: string;
  status?: string;
  currency?: string;
  amount_minor?: number;
  minor_unit?: number;
  amount_cents?: number;
  issued_at?: string;
  paid_at?: string | null;
  hosted_url?: string | null;
  pdf_url?: string | null;
  invoice_url?: string | null;
};

export type BillingMe = {
  plan?: string;
  subscription?: Subscription | null;
  invoices?: Invoice[];
};

export type InvoicesResponse = {
  items?: Invoice[];
};

export type RefundRequestCreateRequest = {
  invoice_id: string;
  reason?: string;
};

export type RefundRequestCreateResponse = {
  request_id?: string;
  status?: string;
};


import { NextResponse } from "next/server";

type Payload = {
  plan_code?: string;
  kind?: string;
  currency?: string;
  return_path?: string;
  cancel_path?: string;
};

function isEnabled(): boolean {
  const enabled = String(process.env.NEXT_PUBLIC_ENABLE_DEV_BILLING || "").trim() === "1";
  const isProd = String(process.env.NODE_ENV || "").trim() === "production";
  return enabled && !isProd;
}

function requireToken(): string {
  const token = String(process.env.DEV_BILLING_TOKEN || "").trim();
  if (!token) {
    throw new Error("missing_dev_billing_token");
  }
  return token;
}

function backendBase(): string {
  const target = String(process.env.API_PROXY_TARGET || "").trim().replace(/\/+$/, "");
  if (target) return target;

  const env = String(process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
  if (env && !env.startsWith("/")) return env;

  return "http://localhost:8001";
}

function sanitizePath(value: unknown): string {
  const s = String(value || "").trim();
  if (!s.startsWith("/")) return "";
  if (s.startsWith("//")) return "";
  return s;
}

export async function POST(req: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ code: "not_found" }, { status: 404 });
  }

  let body: Payload = {};
  try {
    body = (await req.json()) as Payload;
  } catch {
    body = {};
  }

  const plan_code = String(body.plan_code || "pro").trim().toLowerCase();
  const kind = String(body.kind || "sub").trim().toLowerCase();
  const currency = String(body.currency || "USD").trim().toUpperCase();
  const return_path = sanitizePath(body.return_path) || "/billing/return";
  const cancel_path = sanitizePath(body.cancel_path) || "/billing/return?cancel=1";

  try {
    const base = backendBase();
    const token = requireToken();
    const upstream = `${base}/app/billing/dev/mock/anon/checkout`;
    const res = await fetch(upstream, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Dev-Token": token
      },
      body: JSON.stringify({ plan_code, kind, currency, return_path, cancel_path })
    });
    const js = await res.json().catch(() => null);
    return NextResponse.json(js ?? {}, { status: res.status });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "dev_checkout_failed";
    return NextResponse.json({ code: msg }, { status: 500 });
  }
}


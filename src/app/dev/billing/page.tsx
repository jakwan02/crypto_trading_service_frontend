import { notFound } from "next/navigation";
import DevBillingClient from "./devBillingClient";

export default function DevBillingPage() {
  const enabled = String(process.env.NEXT_PUBLIC_ENABLE_DEV_BILLING || "").trim() === "1";
  const isProd = String(process.env.NODE_ENV || "").trim() === "production";
  if (!enabled || isProd) notFound();
  return <DevBillingClient />;
}


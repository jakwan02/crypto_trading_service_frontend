"use client";

import type { BillingMe } from "@/types/billing";

type Props = {
  data: BillingMe;
};

export default function BillingStatus({ data }: Props) {
  const plan = String(data.plan || "").trim() || "-";
  const sub = data.subscription;

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">Billing</h2>
      <dl className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <dt>Plan</dt>
          <dd className="font-semibold text-gray-900">{plan.toUpperCase()}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Subscription</dt>
          <dd className="text-gray-700">{sub ? `${sub.provider || "-"} · ${sub.status || "-"}` : "None"}</dd>
        </div>
      </dl>
    </section>
  );
}


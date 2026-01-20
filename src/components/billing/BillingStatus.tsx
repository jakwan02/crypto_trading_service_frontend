"use client";

import type { BillingMe } from "@/types/billing";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  data: BillingMe;
  onRefresh?: () => void;
};

function fmtProvider(raw?: string | null): string {
  const v = String(raw || "").trim().toLowerCase();
  if (!v) return "-";
  if (v === "paypal") return "PayPal";
  if (v === "eximbay") return "Eximbay";
  if (v === "mock") return "Mock";
  return "-";
}

export default function BillingStatus({ data, onRefresh }: Props) {
  const { t } = useTranslation();
  const plan = String(data.plan || "").trim() || "-";
  const sub = data.subscription;
  const statusRaw = String(sub?.status || "").trim().toLowerCase();
  const isPastDue = statusRaw === "past_due";

  const statusLabel = useMemo(() => {
    if (!statusRaw) return "-";
    if (statusRaw === "active") return t("billing.status.subStatus.active");
    if (statusRaw === "cancel_at_period_end") return t("billing.status.subStatus.cancelAtPeriodEnd");
    if (statusRaw === "canceled") return t("billing.status.subStatus.canceled");
    if (statusRaw === "past_due") return t("billing.status.subStatus.pastDue");
    return t("billing.status.subStatus.unknown");
  }, [statusRaw, t]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-900">{t("billing.status.title")}</h2>
      <dl className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <dt>{t("billing.status.plan")}</dt>
          <dd className="font-semibold text-gray-900" data-testid="billing-plan">
            {plan.toUpperCase()}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>{t("billing.status.subscription")}</dt>
          <dd
            className="text-gray-700"
            data-testid="billing-subscription"
            data-sub-status={statusRaw || ""}
            data-sub-provider={String(sub?.provider || "").trim().toLowerCase()}
          >
            {sub ? `${fmtProvider(sub.provider)} · ${statusLabel}` : t("billing.status.none")}
          </dd>
        </div>
      </dl>

      {isPastDue ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">{t("billing.status.pastDue.title")}</p>
          <p className="mt-1 text-xs text-amber-800">{t("billing.status.pastDue.desc")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onRefresh ? (
              <button
                type="button"
                onClick={onRefresh}
                className="rounded-full bg-amber-200 px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-300"
              >
                {t("billing.status.pastDue.refreshCta")}
              </button>
            ) : null}
            <details className="rounded-full">
              <summary className="cursor-pointer rounded-full border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">
                {t("billing.status.pastDue.helpCta")}
              </summary>
              <div className="mt-3 whitespace-pre-wrap text-xs text-amber-900">{t("billing.status.pastDue.help")}</div>
            </details>
          </div>
        </div>
      ) : null}
    </section>
  );
}

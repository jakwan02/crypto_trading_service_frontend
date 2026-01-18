"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import BillingStatus from "@/components/billing/BillingStatus";
import InvoiceTable from "@/components/billing/InvoiceTable";
import { cancelSub, getBillingMe, getInvoiceDownloadUrl, reactivateSub, requestRefund } from "@/lib/billingClient";
import { getErrCode } from "@/lib/apiErr";
import { useTranslation } from "react-i18next";

export default function BillingPage() {
  const { t } = useTranslation();
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundInvoiceId, setRefundInvoiceId] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const billingQuery = useQuery({
    queryKey: ["billingMe"],
    queryFn: getBillingMe,
    staleTime: 10_000
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSub,
    onSuccess: () => billingQuery.refetch()
  });
  const reactivateMutation = useMutation({
    mutationFn: reactivateSub,
    onSuccess: () => billingQuery.refetch()
  });
  const refundMutation = useMutation({
    mutationFn: () => requestRefund({ invoice_id: refundInvoiceId, reason: refundReason || undefined }),
    onSuccess: () => {
      setRefundOpen(false);
      setRefundReason("");
      billingQuery.refetch();
    }
  });

  const invoices = billingQuery.data?.invoices ?? [];
  const canRefund = invoices.length > 0;
  const hasSubscription = Boolean(billingQuery.data?.subscription);

  const onDownload = useCallback((id: string) => {
    const url = getInvoiceDownloadUrl(id);
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const refundHint = useMemo(() => {
    if (!refundOpen) return "";
    if (!canRefund) return t("billing.refund.noInvoices");
    if (!refundInvoiceId) return t("billing.refund.pickInvoice");
    return "";
  }, [canRefund, refundInvoiceId, refundOpen, t]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("billing.title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("billing.desc")}</p>
            </div>
            <Link
              href="/upgrade"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </Link>
          </header>

          {billingQuery.isLoading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : billingQuery.isError ? (
            <ApiErrorView error={billingQuery.error} onRetry={() => billingQuery.refetch()} />
          ) : billingQuery.data ? (
            <>
              <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                <BillingStatus data={billingQuery.data} />

                <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">{t("billing.actions.title")}</h2>
                  <p className="mt-2 text-xs text-gray-500">{t("billing.actions.desc")}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {hasSubscription ? (
                      <>
                        <button
                          type="button"
                          onClick={() => cancelMutation.mutate()}
                          disabled={cancelMutation.isPending}
                          className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white disabled:bg-gray-300"
                        >
                          {t("billing.actions.cancel")}
                        </button>
                        <button
                          type="button"
                          onClick={() => reactivateMutation.mutate()}
                          disabled={reactivateMutation.isPending}
                          className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:bg-gray-50 disabled:text-gray-400"
                        >
                          {t("billing.actions.reactivate")}
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/upgrade?kind=pass30"
                        className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                      >
                        {t("billing.actions.repurchase")}
                      </Link>
                    )}

                    <Link
                      href="/billing/invoices"
                      className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                    >
                      {t("billing.invoices.all")}
                    </Link>

                    <button
                      type="button"
                      onClick={() => setRefundOpen((v) => !v)}
                      className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                    >
                      {t("billing.refund.cta")}
                    </button>
                  </div>

                  {cancelMutation.isError ? (
                    <div className="mt-4">
                      <ApiErrorView error={cancelMutation.error} />
                    </div>
                  ) : null}
                  {reactivateMutation.isError ? (
                    <div className="mt-4">
                      <ApiErrorView error={reactivateMutation.error} />
                    </div>
                  ) : null}
                  {refundMutation.isError ? (
                    <div className="mt-4">
                      <ApiErrorView error={refundMutation.error} />
                    </div>
                  ) : null}

                  {refundOpen ? (
                    <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-700">{t("billing.refund.formTitle")}</p>
                      <div className="mt-3 grid gap-3">
                        <select
                          value={refundInvoiceId}
                          onChange={(e) => setRefundInvoiceId(e.target.value)}
                          disabled={!canRefund}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">{t("billing.refund.selectPlaceholder")}</option>
                          {invoices.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.id}
                            </option>
                          ))}
                        </select>
                        <textarea
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          placeholder={t("billing.refund.reasonPlaceholder")}
                          rows={3}
                          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        />
                        {refundHint ? <p className="text-xs text-gray-500">{refundHint}</p> : null}
                        <button
                          type="button"
                          disabled={!refundInvoiceId || refundMutation.isPending}
                          onClick={() => refundMutation.mutate()}
                          className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-500"
                        >
                          {t("billing.refund.submit")}
                        </button>
                        {refundMutation.data ? (
                          <p className="text-xs text-emerald-600">
                            {t("billing.refund.submitted")} ({refundMutation.data.status || "ok"})
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {billingQuery.data?.subscription ? (
                    <p className="mt-4 text-xs text-gray-500">
                      status={billingQuery.data.subscription.status || "-"} · provider={billingQuery.data.subscription.provider || "-"}
                    </p>
                  ) : null}
                  {!billingQuery.data?.subscription && getErrCode(billingQuery.error) === "subscription_not_found" ? (
                    <p className="mt-4 text-xs text-gray-500">{t("billing.sub.none")}</p>
                  ) : null}
                </section>
              </div>

              <section className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">{t("billing.invoices.recent")}</h2>
                  <Link href="/billing/invoices" className="text-xs font-semibold text-primary">
                    {t("billing.invoices.all")}
                  </Link>
                </div>
                <InvoiceTable items={invoices} onDownload={onDownload} limit={5} />
              </section>
            </>
          ) : null}
        </div>
      </main>
    </RequireAuth>
  );
}


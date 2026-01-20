"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import {
  adminApproveRefund,
  adminCreateCoupon,
  adminDeactivateCoupon,
  adminDenyRefund,
  adminListCoupons,
  adminListRefunds
} from "@/lib/adminBillingClient";

export default function AdminBillingPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"refunds" | "coupons">("refunds");

  const refundsQ = useQuery({
    queryKey: ["admin.refunds"],
    queryFn: async () => await adminListRefunds({ status: null, cursor: null, limit: 100 })
  });
  const couponsQ = useQuery({ queryKey: ["admin.coupons"], queryFn: adminListCoupons });

  const approveRefundM = useMutation({
    mutationFn: async (id: string) => await adminApproveRefund(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.refunds"] });
    }
  });
  const denyRefundM = useMutation({
    mutationFn: async (id: string) => await adminDenyRefund(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.refunds"] });
    }
  });

  const [couponForm, setCouponForm] = useState({ code: "", type: "percent" as "percent" | "amount", percent: 10, amount_cents: 500, currency: "USD" });
  const createCouponM = useMutation({
    mutationFn: async () =>
      await adminCreateCoupon(
        couponForm.type === "percent"
          ? { code: couponForm.code, type: "percent", percent: couponForm.percent }
          : { code: couponForm.code, type: "amount", amount_cents: couponForm.amount_cents, currency: couponForm.currency }
      ),
    onSuccess: async () => {
      setCouponForm((p) => ({ ...p, code: "" }));
      await qc.invalidateQueries({ queryKey: ["admin.coupons"] });
    }
  });
  const deactivateCouponM = useMutation({
    mutationFn: async (id: string) => await adminDeactivateCoupon(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.coupons"] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminBilling.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminBilling.desc")}</p>
          </header>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("refunds")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "refunds" ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
            >
              {t("adminBilling.refunds")}
            </button>
            <button
              type="button"
              onClick={() => setTab("coupons")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "coupons" ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
            >
              {t("adminBilling.coupons")}
            </button>
          </div>

          {tab === "refunds" ? (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminBilling.refundRequests")}</h2>
              {refundsQ.isError ? <div className="mt-4"><ApiErrorView error={refundsQ.error} onRetry={() => refundsQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {(refundsQ.data?.items ?? []).length === 0 && !refundsQ.isFetching ? (
                  <p className="text-sm text-gray-500">{t("adminBilling.emptyRefunds")}</p>
                ) : null}
                {(refundsQ.data?.items ?? []).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{t("adminBilling.refundId")}: {r.id}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {String(r.status || "").toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">user: {r.user_id} · invoice: {r.invoice_id}</p>
                    {r.reason ? <p className="mt-2 text-sm text-gray-700">{r.reason}</p> : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={approveRefundM.isPending || r.status !== "requested"}
                        onClick={() => approveRefundM.mutate(r.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
                      >
                        {t("adminBilling.approve")}
                      </button>
                      <button
                        type="button"
                        disabled={denyRefundM.isPending || r.status !== "requested"}
                        onClick={() => denyRefundM.mutate(r.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-60"
                      >
                        {t("adminBilling.deny")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {approveRefundM.isError ? <div className="mt-4"><ApiErrorView error={approveRefundM.error} /></div> : null}
              {denyRefundM.isError ? <div className="mt-4"><ApiErrorView error={denyRefundM.error} /></div> : null}
            </section>
          ) : (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminBilling.coupons")}</h2>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">{t("adminBilling.couponCode")}</label>
                  <input
                    value={couponForm.code}
                    onChange={(e) => setCouponForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder="WELCOME10"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminBilling.type")}</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v !== "percent" && v !== "amount") return;
                      setCouponForm((p) => ({ ...p, type: v }));
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="percent">percent</option>
                    <option value="amount">amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminBilling.value")}</label>
                  <input
                    value={couponForm.type === "percent" ? couponForm.percent : couponForm.amount_cents}
                    onChange={(e) =>
                      setCouponForm((p) =>
                        p.type === "percent"
                          ? { ...p, percent: Number(e.target.value) }
                          : { ...p, amount_cents: Number(e.target.value) }
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    type="number"
                  />
                </div>
              </div>

              {createCouponM.isError ? <div className="mt-3"><ApiErrorView error={createCouponM.error} /></div> : null}
              <button
                type="button"
                disabled={!couponForm.code.trim() || createCouponM.isPending}
                onClick={() => createCouponM.mutate()}
                className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
              >
                {t("adminBilling.create")}
              </button>

              {couponsQ.isError ? <div className="mt-4"><ApiErrorView error={couponsQ.error} onRetry={() => couponsQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {(couponsQ.data?.items ?? []).map((c) => (
                  <div key={c.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{c.code}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {c.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {c.type === "percent" ? `${c.percent}%` : `${c.amount_cents} ${c.currency ?? ""}`}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={deactivateCouponM.isPending || !c.is_active}
                        onClick={() => deactivateCouponM.mutate(c.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-60"
                      >
                        {t("adminBilling.deactivate")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </RequireAdmin>
  );
}

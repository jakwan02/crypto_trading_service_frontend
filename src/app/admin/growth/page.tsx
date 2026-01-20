"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import {
  adminApproveReferral,
  adminCreateAffiliateLink,
  adminListAffiliateLinks,
  adminListReferrals,
  adminPatchAffiliateLink,
  adminVoidReferral
} from "@/lib/referralClient";

export default function AdminGrowthPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"referrals" | "affiliate">("referrals");

  const referralsQ = useQuery({
    queryKey: ["admin.referrals"],
    queryFn: async () => await adminListReferrals({ cursor: null, limit: 100, status: null, q: null })
  });
  const affiliateQ = useQuery({ queryKey: ["admin.affiliate_links"], queryFn: async () => await adminListAffiliateLinks(null) });

  const approveM = useMutation({
    mutationFn: async (id: string) => await adminApproveReferral(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.referrals"] });
    }
  });
  const voidM = useMutation({
    mutationFn: async (id: string) => await adminVoidReferral(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.referrals"] });
    }
  });

  const [affiliateForm, setAffiliateForm] = useState({ label: "", url: "", disclosure_md: "" });
  const createAffiliateM = useMutation({
    mutationFn: async () => await adminCreateAffiliateLink(affiliateForm),
    onSuccess: async () => {
      setAffiliateForm({ label: "", url: "", disclosure_md: "" });
      await qc.invalidateQueries({ queryKey: ["admin.affiliate_links"] });
    }
  });
  const patchAffiliateM = useMutation({
    mutationFn: async (p: { id: string; is_active: boolean }) => await adminPatchAffiliateLink(p.id, { is_active: p.is_active }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.affiliate_links"] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminGrowth.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminGrowth.desc")}</p>
          </header>

          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("referrals")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "referrals" ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
            >
              {t("adminGrowth.referrals")}
            </button>
            <button
              type="button"
              onClick={() => setTab("affiliate")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "affiliate" ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
            >
              {t("adminGrowth.affiliate")}
            </button>
          </div>

          {tab === "referrals" ? (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminGrowth.referrals")}</h2>
              {referralsQ.isError ? <div className="mt-4"><ApiErrorView error={referralsQ.error} onRetry={() => referralsQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {(referralsQ.data?.items ?? []).length === 0 && !referralsQ.isFetching ? (
                  <p className="text-sm text-gray-500">{t("adminGrowth.emptyReferrals")}</p>
                ) : null}
                {(referralsQ.data?.items ?? []).map((r) => (
                  <div key={r.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{r.code}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {String(r.status || "").toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      referrer: {r.referrer_email} · referee: {r.referee_email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={approveM.isPending}
                        onClick={() => approveM.mutate(r.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
                      >
                        {t("adminGrowth.approve")}
                      </button>
                      <button
                        type="button"
                        disabled={voidM.isPending}
                        onClick={() => voidM.mutate(r.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-60"
                      >
                        {t("adminGrowth.void")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {approveM.isError ? <div className="mt-4"><ApiErrorView error={approveM.error} /></div> : null}
              {voidM.isError ? <div className="mt-4"><ApiErrorView error={voidM.error} /></div> : null}
            </section>
          ) : (
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminGrowth.affiliate")}</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminGrowth.label")}</label>
                  <input
                    value={affiliateForm.label}
                    onChange={(e) => setAffiliateForm((p) => ({ ...p, label: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">{t("adminGrowth.url")}</label>
                  <input
                    value={affiliateForm.url}
                    onChange={(e) => setAffiliateForm((p) => ({ ...p, url: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs font-semibold text-gray-600">{t("adminGrowth.disclosure")}</label>
                  <textarea
                    value={affiliateForm.disclosure_md}
                    onChange={(e) => setAffiliateForm((p) => ({ ...p, disclosure_md: e.target.value }))}
                    className="mt-2 h-24 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
              </div>
              {createAffiliateM.isError ? <div className="mt-3"><ApiErrorView error={createAffiliateM.error} /></div> : null}
              <button
                type="button"
                disabled={!affiliateForm.label.trim() || !affiliateForm.url.trim() || !affiliateForm.disclosure_md.trim() || createAffiliateM.isPending}
                onClick={() => createAffiliateM.mutate()}
                className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
              >
                {t("adminGrowth.create")}
              </button>

              {affiliateQ.isError ? <div className="mt-4"><ApiErrorView error={affiliateQ.error} onRetry={() => affiliateQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {(affiliateQ.data?.items ?? []).map((l) => (
                  <div key={l.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{l.label}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {l.is_active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600 break-all">{l.url}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={patchAffiliateM.isPending}
                        onClick={() => patchAffiliateM.mutate({ id: l.id, is_active: !l.is_active })}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
                      >
                        {l.is_active ? t("adminGrowth.deactivate") : t("adminGrowth.activate")}
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


"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { claimReferral, getReferralMe } from "@/lib/referralClient";

export default function ReferralPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const meQ = useQuery({ queryKey: ["referral.me"], queryFn: getReferralMe });
  const [code, setCode] = useState("");

  const claimM = useMutation({
    mutationFn: async () => await claimReferral(code.trim()),
    onSuccess: async () => {
      setCode("");
      await qc.invalidateQueries({ queryKey: ["referral.me"] });
    }
  });

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("referral.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("referral.desc")}</p>
          </header>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("referral.myCode")}</h2>
            {meQ.isError ? <div className="mt-4"><ApiErrorView error={meQ.error} onRetry={() => meQ.refetch()} /></div> : null}
            <div className="mt-4 grid gap-3">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500">{t("referral.code")}</p>
                <p className="mt-1 text-lg font-semibold text-gray-900">{meQ.data?.code ?? "—"}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-500">{t("referral.link")}</p>
                <p className="mt-1 break-all text-sm text-gray-700">{meQ.data?.link ?? "—"}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{t("referral.invited")}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{meQ.data?.invited_total ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{t("referral.rewards")}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{meQ.data?.rewards_total ?? 0}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("referral.claimTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("referral.claimDesc")}</p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                placeholder={t("referral.claimPlaceholder")}
              />
              <button
                type="button"
                disabled={!code.trim() || claimM.isPending}
                onClick={() => claimM.mutate()}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
              >
                {t("referral.claimBtn")}
              </button>
            </div>
            {claimM.isError ? <div className="mt-3"><ApiErrorView error={claimM.error} /></div> : null}
          </section>
        </div>
      </main>
    </RequireAuth>
  );
}


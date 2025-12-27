"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountPage() {
  const { user, isPro } = useAuth();
  const { t } = useTranslation();
  const displayName = useMemo(() => {
    if (!user) return t("common.guest");
    return (
      String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
      String(user.email || t("common.user"))
    );
  }, [user, t]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("account.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("account.desc")}</p>
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("account.profile")}</h2>
            <dl className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>{t("account.name")}</dt>
                <dd className="font-medium text-gray-900">{displayName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t("account.email")}</dt>
                <dd className="font-medium text-gray-900">{user?.email || t("account.loginRequired")}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>{t("account.joinDate")}</dt>
                <dd>2025-02-01</dd>
              </div>
            </dl>
            <button type="button" className="mt-4 text-xs font-semibold text-primary">
              {t("account.editProfile")}
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("account.plan")}</h2>
            <p className="mt-3 text-sm text-gray-600">
              {t("account.currentPlan")}:{" "}
              <span className={`font-semibold ${isPro ? "text-primary" : "text-gray-700"}`}>
                {isPro ? t("account.pro") : t("account.free")}
              </span>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {isPro ? t("account.planMetaPro") : t("account.planMetaFree")}
            </p>
            <Link
              href="/upgrade"
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              {isPro ? t("footer.subscription") : t("account.planCta")}
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("account.security")}</h2>
            <p className="mt-3 text-sm text-gray-600">
              {t("account.securityDesc")}
            </p>
            <button
              type="button"
              className="mt-4 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              {t("account.securityCta")}
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("account.payment")}</h2>
            <p className="mt-2 text-sm text-gray-600">{t("account.paymentDesc")}</p>
            <p className="mt-1 text-xs text-gray-500">{t("account.paymentNext")}</p>
            <Link
              href="/payment"
              className="mt-4 inline-flex rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
            >
              {t("account.paymentEdit")}
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("account.notify")}</h2>
            <p className="mt-2 text-sm text-gray-600">{t("account.notifyDesc")}</p>
            <Link
              href="/alerts"
              className="mt-4 inline-flex rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              {t("account.notifyCta")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

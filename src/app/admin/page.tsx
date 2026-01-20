"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminGetOverview } from "@/lib/adminUsersClient";

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const q = useQuery({ queryKey: ["admin.overview"], queryFn: adminGetOverview });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminDashboard.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminDashboard.desc")}</p>
          </header>

          {q.isError ? <ApiErrorView error={q.error} onRetry={() => q.refetch()} /> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminDashboard.usersTotal")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data ? q.data.users_total : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminDashboard.activeUsers7d")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data ? q.data.active_users_7d : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminDashboard.paidUsers")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data ? q.data.paid_users : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminDashboard.pendingRefunds")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data ? q.data.pending_refund_requests : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminDashboard.coveredSymbols")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data ? q.data.covered_symbols_total : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminDashboard.apiP95")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {q.data?.api_p95_ms != null ? `${Math.round(q.data.api_p95_ms)}ms` : "—"}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("adminDashboard.quickLinks")}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary" href="/admin/users">
                {t("admin.navUsers")}
              </Link>
              <Link className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary" href="/admin/billing">
                {t("admin.navBilling")}
              </Link>
              <Link className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary" href="/admin/monitoring">
                {t("admin.navMonitoring")}
              </Link>
              <Link className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary" href="/admin/growth">
                {t("admin.navGrowth")}
              </Link>
              <Link className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary" href="/admin/calendar">
                {t("admin.navCalendar")}
              </Link>
              <Link className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary" href="/admin/audit">
                {t("admin.navAudit")}
              </Link>
            </div>
          </section>
        </div>
      </main>
    </RequireAdmin>
  );
}


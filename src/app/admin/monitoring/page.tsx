"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminGetKpi } from "@/lib/adminMonitoringClient";

export default function AdminMonitoringPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<"1h" | "24h" | "7d">("1h");
  const q = useQuery({ queryKey: ["admin.kpi", range], queryFn: async () => await adminGetKpi(range) });

  // 변경 이유: cm 마켓은 관리 심볼이 아니므로 관리자 모니터링에서도 노출하지 않는다.
  const ingestLagItems = q.data?.ingest_lag_sec_by_market
    ? Object.entries(q.data.ingest_lag_sec_by_market).filter(([m]) => String(m).trim().toLowerCase() !== "cm")
    : [];
  const maxLag = ingestLagItems.reduce((m, [, v]) => Math.max(m, Number(v) || 0), 0) || 1;

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminMonitoring.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminMonitoring.desc")}</p>
          </header>

          <div className="mb-4 flex flex-wrap gap-2">
            {(["1h", "24h", "7d"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${range === r ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
              >
                {r}
              </button>
            ))}
          </div>

          {q.isError ? <ApiErrorView error={q.error} onRetry={() => q.refetch()} /> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.apiP95")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.api_latency_p95_ms != null ? `${Math.round(q.data.api_latency_p95_ms)}ms` : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.apiP99")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.api_latency_p99_ms != null ? `${Math.round(q.data.api_latency_p99_ms)}ms` : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.wsConnections")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.ws_connections != null ? Math.round(q.data.ws_connections) : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.redisErrors1h")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.redis_errors_1h != null ? Math.round(q.data.redis_errors_1h) : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.dbErrors1h")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.db_errors_1h != null ? Math.round(q.data.db_errors_1h) : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.apiErrorRate")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.api_error_rate != null ? `${(q.data.api_error_rate * 100).toFixed(2)}%` : "—"}</p>
            </div>
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t("adminMonitoring.alertSuccessRate")}</p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">{q.data?.alert_delivery_success_rate != null ? `${(q.data.alert_delivery_success_rate * 100).toFixed(2)}%` : "—"}</p>
            </div>
          </div>

          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("adminMonitoring.ingestLag")}</h2>
            <div className="mt-4 space-y-2">
              {ingestLagItems.length > 0 ? (
                ingestLagItems.map(([m, v]) => {
                  const val = Number(v) || 0;
                  const pct = Math.max(0, Math.min(100, (val / maxLag) * 100));
                  return (
                    <div key={m} className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-semibold text-gray-700">{m}</p>
                        <p className="text-xs font-semibold text-gray-900">{val.toFixed(2)}s</p>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">{t("adminMonitoring.noData")}</p>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("adminMonitoring.retryQueues")}</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-700">{t("adminMonitoring.ingestRetry")}</p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  {q.data?.retry_queue_sizes?.ingest_retry
                    ? Object.entries(q.data.retry_queue_sizes.ingest_retry)
                        .filter(([k]) => String(k).trim().toLowerCase() !== "cm")
                        .map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{k}</span>
                          <span className="text-xs font-semibold text-gray-900">{Math.round(Number(v) || 0)}</span>
                          </div>
                        ))
                    : <p className="text-sm text-gray-500">{t("adminMonitoring.noData")}</p>}
                </div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold text-gray-700">{t("adminMonitoring.streamWorker")}</p>
                <div className="mt-2 space-y-1 text-sm text-gray-700">
                  {q.data?.retry_queue_sizes?.stream_worker
                    ? Object.entries(q.data.retry_queue_sizes.stream_worker)
                        .filter(([k]) => String(k).trim().toLowerCase() !== "cm")
                        .map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">{k}</span>
                          <span className="text-xs font-semibold text-gray-900">{Math.round(Number(v) || 0)}</span>
                          </div>
                        ))
                    : <p className="text-sm text-gray-500">{t("adminMonitoring.noData")}</p>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </RequireAdmin>
  );
}

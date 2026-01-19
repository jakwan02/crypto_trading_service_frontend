"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getStatusSummary, listStatusIncidents, listStatusMaintenances } from "@/lib/statusClient";

function stateBadge(state: string): string {
  if (state === "ok") return "bg-emerald-100 text-emerald-700";
  if (state === "down") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export default function StatusPage() {
  const { t } = useTranslation();

  const summaryQ = useQuery({
    queryKey: ["status.summary"],
    queryFn: getStatusSummary,
    refetchInterval: 30_000
  });

  const incidentsQ = useInfiniteQuery({
    queryKey: ["status.incidents"],
    queryFn: ({ pageParam }) => listStatusIncidents((pageParam as string | null | undefined) ?? null, 20, "all"),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const maintQ = useInfiniteQuery({
    queryKey: ["status.maintenances"],
    queryFn: ({ pageParam }) => listStatusMaintenances((pageParam as string | null | undefined) ?? null, 20, "all"),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const components = summaryQ.data?.components ?? {};
  const open = summaryQ.data?.open_incidents ?? [];
  const upcoming = summaryQ.data?.upcoming_maintenances ?? [];

  const incidents = (incidentsQ.data?.pages ?? []).flatMap((p) => p.items ?? []);
  const maints = (maintQ.data?.pages ?? []).flatMap((p) => p.items ?? []);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("status.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("status.desc")}</p>
        </header>

        {summaryQ.isError ? (
          <div className="max-w-2xl">
            <ApiErrorView error={summaryQ.error} onRetry={() => summaryQ.refetch()} />
          </div>
        ) : null}

        <section className="grid gap-3 md:grid-cols-5">
          {["api", "ws", "db", "redis", "ingest"].map((k) => (
            <div key={k} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold text-gray-500">{t(`status.component.${k}`)}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${stateBadge(components[k] || "degraded")}`}>
                  {String(components[k] || "degraded").toUpperCase()}
                </span>
                <span className="text-[11px] text-gray-400">
                  {summaryQ.data?.server_time ? String(summaryQ.data.server_time).slice(11, 19) : ""}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {t("status.ingestLag")}{" "}
                {summaryQ.data?.ingest_lag_sec == null ? "-" : `${Math.round(summaryQ.data.ingest_lag_sec)}s`}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("status.openIncidents")}</h2>
            {summaryQ.isLoading ? (
              <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p>
            ) : open.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{t("status.emptyOpen")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {open.map((it) => (
                  <li key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{it.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stateBadge(it.severity === "critical" ? "down" : "degraded")}`}>
                        {it.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {t("status.componentLabel")} {it.component} · {String(it.started_at).slice(0, 19).replace("T", " ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("status.upcomingMaintenances")}</h2>
            {summaryQ.isLoading ? (
              <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p>
            ) : upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{t("status.emptyUpcoming")}</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {upcoming.map((it) => (
                  <li key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{it.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${stateBadge(it.status === "completed" ? "ok" : "degraded")}`}>
                        {it.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">
                      {String(it.start_at).slice(0, 19).replace("T", " ")}
                      {it.end_at ? ` → ${String(it.end_at).slice(0, 19).replace("T", " ")}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("status.historyIncidents")}</h2>
            {incidentsQ.isError ? <div className="mt-3"><ApiErrorView error={incidentsQ.error} onRetry={() => incidentsQ.refetch()} /></div> : null}
            {incidents.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{incidentsQ.isLoading ? t("common.loading") : t("status.emptyHistory")}</p>
            ) : (
              <>
                <ul className="mt-3 space-y-2 text-sm">
                  {incidents.slice(0, 10).map((it) => (
                    <li key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-semibold text-gray-900">{it.title}</p>
                      <p className="mt-1 text-xs text-gray-600">{String(it.started_at).slice(0, 19).replace("T", " ")}</p>
                    </li>
                  ))}
                </ul>
                {incidentsQ.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => void incidentsQ.fetchNextPage()}
                    className="mt-4 inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("common.more")}
                  </button>
                ) : null}
              </>
            )}
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("status.historyMaintenances")}</h2>
            {maintQ.isError ? <div className="mt-3"><ApiErrorView error={maintQ.error} onRetry={() => maintQ.refetch()} /></div> : null}
            {maints.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{maintQ.isLoading ? t("common.loading") : t("status.emptyHistory")}</p>
            ) : (
              <>
                <ul className="mt-3 space-y-2 text-sm">
                  {maints.slice(0, 10).map((it) => (
                    <li key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="font-semibold text-gray-900">{it.title}</p>
                      <p className="mt-1 text-xs text-gray-600">{String(it.start_at).slice(0, 19).replace("T", " ")}</p>
                    </li>
                  ))}
                </ul>
                {maintQ.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => void maintQ.fetchNextPage()}
                    className="mt-4 inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("common.more")}
                  </button>
                ) : null}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}


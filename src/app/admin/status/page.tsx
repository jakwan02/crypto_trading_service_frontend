"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import {
  adminCreateStatusIncident,
  adminCreateStatusMaintenance,
  adminDeleteStatusIncident,
  adminDeleteStatusMaintenance,
  adminListStatusIncidents,
  adminListStatusMaintenances,
  adminPatchStatusIncident
} from "@/lib/statusClient";

export default function AdminStatusPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const incidentsQ = useQuery({ queryKey: ["admin.status.incidents"], queryFn: adminListStatusIncidents });
  const maintQ = useQuery({ queryKey: ["admin.status.maintenances"], queryFn: adminListStatusMaintenances });

  const [incidentForm, setIncidentForm] = useState({ component: "api", severity: "minor", title: "", body_md: "" });
  const [maintForm, setMaintForm] = useState({ status: "scheduled", title: "", body_md: "", start_at: "", end_at: "" });

  const createIncidentM = useMutation({
    mutationFn: async () => await adminCreateStatusIncident({ ...incidentForm, status: "open" }),
    onSuccess: async () => {
      setIncidentForm({ component: "api", severity: "minor", title: "", body_md: "" });
      await qc.invalidateQueries({ queryKey: ["admin.status.incidents"] });
    }
  });

  const resolveIncidentM = useMutation({
    mutationFn: async (id: string) => await adminPatchStatusIncident(id, { status: "resolved" }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.status.incidents"] });
    }
  });

  const deleteIncidentM = useMutation({
    mutationFn: async (id: string) => await adminDeleteStatusIncident(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.status.incidents"] });
    }
  });

  const createMaintM = useMutation({
    mutationFn: async () =>
      await adminCreateStatusMaintenance({
        status: maintForm.status,
        title: maintForm.title,
        body_md: maintForm.body_md,
        start_at: maintForm.start_at,
        end_at: maintForm.end_at || null
      }),
    onSuccess: async () => {
      setMaintForm({ status: "scheduled", title: "", body_md: "", start_at: "", end_at: "" });
      await qc.invalidateQueries({ queryKey: ["admin.status.maintenances"] });
    }
  });

  const deleteMaintM = useMutation({
    mutationFn: async (id: string) => await adminDeleteStatusMaintenance(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.status.maintenances"] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminStatus.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminStatus.desc")}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminStatus.incidentNew")}</h2>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("adminStatus.component")}</label>
                    <input
                      value={incidentForm.component}
                      onChange={(e) => setIncidentForm((p) => ({ ...p, component: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("adminStatus.severity")}</label>
                    <select
                      value={incidentForm.severity}
                      onChange={(e) => setIncidentForm((p) => ({ ...p, severity: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="minor">minor</option>
                      <option value="major">major</option>
                      <option value="critical">critical</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminStatus.titleField")}</label>
                  <input
                    value={incidentForm.title}
                    onChange={(e) => setIncidentForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminStatus.body")}</label>
                  <textarea
                    value={incidentForm.body_md}
                    onChange={(e) => setIncidentForm((p) => ({ ...p, body_md: e.target.value }))}
                    className="mt-2 h-28 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                {createIncidentM.isError ? <ApiErrorView error={createIncidentM.error} /> : null}
                <button
                  type="button"
                  onClick={() => createIncidentM.mutate()}
                  disabled={!incidentForm.title.trim() || !incidentForm.body_md.trim() || createIncidentM.isPending}
                  className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {t("adminStatus.create")}
                </button>
              </div>

              <h2 className="mt-8 text-sm font-semibold text-gray-900">{t("adminStatus.incidentList")}</h2>
              {incidentsQ.isError ? <div className="mt-3"><ApiErrorView error={incidentsQ.error} onRetry={() => incidentsQ.refetch()} /></div> : null}
              <div className="mt-3 space-y-2">
                {(incidentsQ.data?.items ?? []).map((it) => (
                  <div key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{it.title}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {String(it.status || "").toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{it.component} · {it.severity}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => resolveIncidentM.mutate(it.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                      >
                        {t("adminStatus.resolve")}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteIncidentM.mutate(it.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200"
                      >
                        {t("adminStatus.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminStatus.maintNew")}</h2>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("adminStatus.status")}</label>
                    <select
                      value={maintForm.status}
                      onChange={(e) => setMaintForm((p) => ({ ...p, status: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="scheduled">scheduled</option>
                      <option value="in_progress">in_progress</option>
                      <option value="completed">completed</option>
                      <option value="canceled">canceled</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("adminStatus.startAt")}</label>
                    <input
                      value={maintForm.start_at}
                      onChange={(e) => setMaintForm((p) => ({ ...p, start_at: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      placeholder="2026-01-19T12:00:00Z"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminStatus.titleField")}</label>
                  <input
                    value={maintForm.title}
                    onChange={(e) => setMaintForm((p) => ({ ...p, title: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("adminStatus.body")}</label>
                  <textarea
                    value={maintForm.body_md}
                    onChange={(e) => setMaintForm((p) => ({ ...p, body_md: e.target.value }))}
                    className="mt-2 h-28 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                {createMaintM.isError ? <ApiErrorView error={createMaintM.error} /> : null}
                <button
                  type="button"
                  onClick={() => createMaintM.mutate()}
                  disabled={!maintForm.title.trim() || !maintForm.body_md.trim() || !maintForm.start_at.trim() || createMaintM.isPending}
                  className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {t("adminStatus.create")}
                </button>
              </div>

              <h2 className="mt-8 text-sm font-semibold text-gray-900">{t("adminStatus.maintList")}</h2>
              {maintQ.isError ? <div className="mt-3"><ApiErrorView error={maintQ.error} onRetry={() => maintQ.refetch()} /></div> : null}
              <div className="mt-3 space-y-2">
                {(maintQ.data?.items ?? []).map((it) => (
                  <div key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{it.title}</p>
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                        {String(it.status || "").toUpperCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-600">{String(it.start_at).slice(0, 19).replace("T", " ")}</p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => deleteMaintM.mutate(it.id)}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200"
                      >
                        {t("adminStatus.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </RequireAdmin>
  );
}


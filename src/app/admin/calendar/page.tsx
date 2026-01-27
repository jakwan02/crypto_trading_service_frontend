"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminCreateCalendarEvent, adminDeleteCalendarEvent, adminListCalendarEvents } from "@/lib/calendarClient";

export default function AdminCalendarPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["admin.calendar.events"],
    queryFn: async () =>
      await adminListCalendarEvents({ cursor: null, limit: 100, from: null, to: null, type: null, market: null, symbol: null })
  });

  const [form, setForm] = useState({
    type: "economic",
    title: "",
    body_md: "",
    start_at: "",
    end_at: "",
    market: "",
    symbol: "",
    importance: 1
  });

  const createM = useMutation({
    mutationFn: async () =>
      await adminCreateCalendarEvent({
        type: form.type,
        title: form.title,
        body_md: form.body_md || null,
        start_at: form.start_at,
        end_at: form.end_at || null,
        market: form.market || null,
        symbol: form.symbol || null,
        importance: Number(form.importance) || 0,
        source: "admin",
        meta: {}
      }),
    onSuccess: async () => {
      setForm({ type: "economic", title: "", body_md: "", start_at: "", end_at: "", market: "", symbol: "", importance: 1 });
      await qc.invalidateQueries({ queryKey: ["admin.calendar.events"] });
    }
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => await adminDeleteCalendarEvent(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.calendar.events"] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminCalendar.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminCalendar.desc")}</p>
          </header>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("adminCalendar.create")}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.type")}</label>
                <input value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.titleField")}</label>
                <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" />
              </div>
              <div className="md:col-span-3">
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.body")}</label>
                <textarea value={form.body_md} onChange={(e) => setForm((p) => ({ ...p, body_md: e.target.value }))} className="mt-2 h-24 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.startAt")}</label>
                <input value={form.start_at} onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" placeholder="2026-01-19T12:00:00Z" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.endAt")}</label>
                <input value={form.end_at} onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" placeholder="2026-01-19T13:00:00Z" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.importance")}</label>
                <input type="number" value={form.importance} onChange={(e) => setForm((p) => ({ ...p, importance: Number(e.target.value) }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.market")}</label>
                <input
                  value={form.market}
                  onChange={(e) => {
                    const v = String(e.target.value || "").trim().toLowerCase();
                    // 변경 이유: cm 마켓은 관리 심볼이 아니므로 입력/생성 경로에서 제거한다.
                    setForm((p) => ({ ...p, market: v === "cm" ? "" : v }));
                  }}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder="spot|um"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminCalendar.symbol")}</label>
                <input value={form.symbol} onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" placeholder="BTCUSDT" />
              </div>
            </div>
            {createM.isError ? <div className="mt-3"><ApiErrorView error={createM.error} /></div> : null}
            <button
              type="button"
              disabled={!form.title.trim() || !form.start_at.trim() || createM.isPending}
              onClick={() => createM.mutate()}
              className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
            >
              {t("adminCalendar.createBtn")}
            </button>
          </section>

          <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("adminCalendar.events")}</h2>
            {q.isError ? <div className="mt-4"><ApiErrorView error={q.error} onRetry={() => q.refetch()} /></div> : null}
            <div className="mt-4 space-y-2">
              {(q.data?.items ?? []).length === 0 && !q.isFetching ? <p className="text-sm text-gray-500">{t("adminCalendar.empty")}</p> : null}
              {(q.data?.items ?? []).map((ev) => (
                <div key={ev.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{ev.title}</p>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">{ev.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    {ev.start_at ?? "—"} {ev.market ? `· ${ev.market}` : ""} {ev.symbol ? `· ${ev.symbol}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={deleteM.isPending}
                      onClick={() => deleteM.mutate(ev.id)}
                      className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200 disabled:opacity-60"
                    >
                      {t("adminCalendar.delete")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {deleteM.isError ? <div className="mt-4"><ApiErrorView error={deleteM.error} /></div> : null}
          </section>
        </div>
      </main>
    </RequireAdmin>
  );
}

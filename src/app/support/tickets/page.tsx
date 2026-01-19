"use client";

import Link from "next/link";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { createTicket, listMyTickets } from "@/lib/supportClient";

export default function TicketsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const listQ = useInfiniteQuery({
    queryKey: ["support.tickets"],
    queryFn: ({ pageParam }) => listMyTickets((pageParam as string | null | undefined) ?? null, 20),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const items = useMemo(() => (listQ.data?.pages ?? []).flatMap((p) => p.items ?? []), [listQ.data?.pages]);

  const [form, setForm] = useState({ subject: "", category: "general", priority: "normal", body: "" });

  const createM = useMutation({
    mutationFn: async () => await createTicket(form),
    onSuccess: async () => {
      setForm({ subject: "", category: "general", priority: "normal", body: "" });
      await qc.invalidateQueries({ queryKey: ["support.tickets"] });
    }
  });

  const canSubmit = form.subject.trim().length > 0 && form.body.trim().length > 0;

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("supportTickets.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("supportTickets.desc")}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("supportTickets.newTitle")}</h2>
              <div className="mt-4 grid gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("supportTickets.subject")}</label>
                  <input
                    value={form.subject}
                    onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder={t("supportTickets.subjectPh")}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("supportTickets.category")}</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("supportTickets.priority")}</label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="low">{t("supportTickets.priorityLow")}</option>
                      <option value="normal">{t("supportTickets.priorityNormal")}</option>
                      <option value="high">{t("supportTickets.priorityHigh")}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("supportTickets.body")}</label>
                  <textarea
                    value={form.body}
                    onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                    className="mt-2 h-40 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder={t("supportTickets.bodyPh")}
                  />
                </div>
                {createM.isError ? <ApiErrorView error={createM.error} onRetry={() => createM.mutate()} /> : null}
                <button
                  type="button"
                  disabled={!canSubmit || createM.isPending}
                  onClick={() => createM.mutate()}
                  className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {createM.isPending ? t("common.loading") : t("supportTickets.submit")}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("supportTickets.listTitle")}</h2>
              {listQ.isError ? <div className="mt-3"><ApiErrorView error={listQ.error} onRetry={() => listQ.refetch()} /></div> : null}

              {items.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">{listQ.isLoading ? t("common.loading") : t("supportTickets.empty")}</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {items.map((it) => (
                    <Link
                      key={it.id}
                      href={`/support/tickets/${encodeURIComponent(it.id)}`}
                      className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 hover:border-primary/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{it.subject}</p>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                          {String(it.status || "").toUpperCase()}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-600">{t("supportTickets.updated")} {String(it.updated_at).slice(0, 19).replace("T", " ")}</p>
                    </Link>
                  ))}
                  {listQ.hasNextPage ? (
                    <button
                      type="button"
                      onClick={() => void listQ.fetchNextPage()}
                      className="mt-3 inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                    >
                      {t("common.more")}
                    </button>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}


"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminCreateLegal, adminDeleteLegal, adminListLegal } from "@/lib/legalClient";

export default function AdminLegalPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["admin.legal"], queryFn: adminListLegal });
  const items = useMemo(() => (Array.isArray(listQ.data?.items) ? listQ.data?.items ?? [] : []), [listQ.data?.items]);

  const [form, setForm] = useState({
    kind: "terms",
    version: "v1",
    locale: "ko",
    title: "",
    body_md: "",
    effective_at: new Date().toISOString(),
    is_published: false
  });

  const createM = useMutation({
    mutationFn: async () => await adminCreateLegal(form as unknown as Record<string, unknown>),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.legal"] });
    }
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => await adminDeleteLegal(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.legal"] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminLegal.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminLegal.desc")}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminLegal.new")}</h2>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <select
                    value={form.kind}
                    onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value }))}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="terms">terms</option>
                    <option value="privacy">privacy</option>
                    <option value="cookie">cookie</option>
                    <option value="disclaimer">disclaimer</option>
                  </select>
                  <input
                    value={form.version}
                    onChange={(e) => setForm((p) => ({ ...p, version: e.target.value }))}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder="v1"
                  />
                  <input
                    value={form.locale}
                    onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder="ko"
                  />
                </div>
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminLegal.titlePh")}
                />
                <input
                  value={form.effective_at}
                  onChange={(e) => setForm((p) => ({ ...p, effective_at: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder="2026-01-19T00:00:00Z"
                />
                <textarea
                  value={form.body_md}
                  onChange={(e) => setForm((p) => ({ ...p, body_md: e.target.value }))}
                  className="h-40 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminLegal.bodyPh")}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} />
                  {t("adminLegal.published")}
                </label>
                {createM.isError ? <ApiErrorView error={createM.error} /> : null}
                <button
                  type="button"
                  disabled={!form.title.trim() || !form.body_md.trim() || createM.isPending}
                  onClick={() => createM.mutate()}
                  className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {t("adminLegal.create")}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminLegal.list")}</h2>
              {listQ.isError ? <div className="mt-3"><ApiErrorView error={listQ.error} onRetry={() => listQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {items.map((it) => (
                  <div key={String((it as { id?: unknown }).id || "")} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="font-semibold text-gray-900">{String((it as { title?: unknown }).title || "")}</p>
                    <p className="mt-1 text-xs text-gray-600">
                      {String((it as { kind?: unknown }).kind || "")} · {String((it as { version?: unknown }).version || "")} · {String((it as { locale?: unknown }).locale || "")}
                    </p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => deleteM.mutate(String((it as { id?: unknown }).id || ""))}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200"
                      >
                        {t("adminLegal.delete")}
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


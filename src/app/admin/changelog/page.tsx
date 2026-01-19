"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminCreateChangelog, adminDeleteChangelog, adminListChangelog } from "@/lib/changelogClient";

export default function AdminChangelogPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const listQ = useQuery({ queryKey: ["admin.changelog"], queryFn: adminListChangelog });
  const items = useMemo(() => (Array.isArray(listQ.data?.items) ? listQ.data?.items ?? [] : []), [listQ.data?.items]);

  const [form, setForm] = useState({ type: "changelog", slug: "", title: "", summary: "", body_md: "", is_published: false });
  const createM = useMutation({
    mutationFn: async () =>
      await adminCreateChangelog({
        type: form.type,
        slug: form.slug,
        title: form.title,
        summary: form.summary || null,
        body_md: form.body_md,
        is_published: form.is_published
      }),
    onSuccess: async () => {
      setForm({ type: "changelog", slug: "", title: "", summary: "", body_md: "", is_published: false });
      await qc.invalidateQueries({ queryKey: ["admin.changelog"] });
    }
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => await adminDeleteChangelog(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin.changelog"] });
    }
  });

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminChangelog.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminChangelog.desc")}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminChangelog.new")}</h2>
              <div className="mt-4 grid gap-3">
                <select
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="changelog">{t("adminChangelog.typeChangelog")}</option>
                  <option value="notice">{t("adminChangelog.typeNotice")}</option>
                </select>
                <input
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminChangelog.slugPh")}
                />
                <input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminChangelog.titlePh")}
                />
                <input
                  value={form.summary}
                  onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminChangelog.summaryPh")}
                />
                <textarea
                  value={form.body_md}
                  onChange={(e) => setForm((p) => ({ ...p, body_md: e.target.value }))}
                  className="h-36 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminChangelog.bodyPh")}
                />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} />
                  {t("adminChangelog.published")}
                </label>
                {createM.isError ? <ApiErrorView error={createM.error} /> : null}
                <button
                  type="button"
                  disabled={!form.slug.trim() || !form.title.trim() || !form.body_md.trim() || createM.isPending}
                  onClick={() => createM.mutate()}
                  className="inline-flex w-fit rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                >
                  {t("adminChangelog.create")}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("adminChangelog.list")}</h2>
              {listQ.isError ? <div className="mt-3"><ApiErrorView error={listQ.error} onRetry={() => listQ.refetch()} /></div> : null}
              <div className="mt-4 space-y-2">
                {items.map((it) => (
                  <div key={String((it as { id?: unknown }).id || "")} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="font-semibold text-gray-900">{String((it as { title?: unknown }).title || "")}</p>
                    <p className="mt-1 text-xs text-gray-600">{String((it as { slug?: unknown }).slug || "")}</p>
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => deleteM.mutate(String((it as { id?: unknown }).id || ""))}
                        className="inline-flex rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-red-600 hover:border-red-200"
                      >
                        {t("adminChangelog.delete")}
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


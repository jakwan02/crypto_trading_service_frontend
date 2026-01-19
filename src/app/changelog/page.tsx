"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { listChangelog } from "@/lib/changelogClient";

type Tab = "changelog" | "notice";

export default function ChangelogPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>("changelog");

  const q = useInfiniteQuery({
    queryKey: ["changelog", tab],
    queryFn: ({ pageParam }) => listChangelog({ type: tab, cursor: (pageParam as string | null | undefined) ?? null, limit: 20 }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const items = useMemo(() => (q.data?.pages ?? []).flatMap((p) => p.items ?? []), [q.data?.pages]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("changelog.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("changelog.desc")}</p>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("changelog")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "changelog" ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
          >
            {t("changelog.tabChangelog")}
          </button>
          <button
            type="button"
            onClick={() => setTab("notice")}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "notice" ? "bg-primary/10 text-primary" : "border border-gray-200 text-gray-700 hover:border-primary/30 hover:text-primary"}`}
          >
            {t("changelog.tabAnnouncements")}
          </button>
        </div>

        {q.isError ? (
          <div className="max-w-2xl">
            <ApiErrorView error={q.error} onRetry={() => q.refetch()} />
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            {q.isLoading ? t("common.loading") : t("changelog.empty")}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <Link
                key={it.slug}
                href={`/changelog/${encodeURIComponent(it.slug)}`}
                className="block rounded-3xl border border-gray-200 bg-white p-6 shadow-sm hover:border-primary/30"
              >
                <p className="text-xs text-gray-400">{it.published_at ? String(it.published_at).slice(0, 10) : ""}</p>
                <h2 className="mt-2 text-lg font-semibold text-gray-900">{it.title}</h2>
                {it.summary ? <p className="mt-2 text-sm text-gray-600">{it.summary}</p> : null}
              </Link>
            ))}
            {q.hasNextPage ? (
              <button
                type="button"
                onClick={() => void q.fetchNextPage()}
                className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("common.more")}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}


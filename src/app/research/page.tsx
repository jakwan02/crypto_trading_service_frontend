"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { listPosts, listRecommendations } from "@/lib/postsClient";

export default function ResearchPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);

  const postsQ = useQuery({
    queryKey: ["posts", cursor, q, category, tag],
    queryFn: () =>
      listPosts({
        cursor,
        limit: 20,
        q: q.trim() || null,
        category: category.trim() || null,
        tag: tag.trim() || null
      })
  });

  const recoQ = useQuery({
    queryKey: ["content.recommendations"],
    queryFn: () => listRecommendations({ limit: 6 })
  });

  const onLoadMore = useCallback(() => {
    const next = postsQ.data?.cursor_next ?? null;
    if (!next) return;
    setCursor(next);
  }, [postsQ.data?.cursor_next]);

  const items = useMemo(() => postsQ.data?.items ?? [], [postsQ.data?.items]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("research.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("research.desc")}</p>
        </header>

        <div className="mb-6 grid gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:grid-cols-3">
          <input
            type="search"
            value={q}
            onChange={(e) => {
              setCursor(null);
              setQ(e.target.value);
            }}
            placeholder={t("research.searchPlaceholder")}
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
          <input
            value={category}
            onChange={(e) => {
              setCursor(null);
              setCategory(e.target.value);
            }}
            placeholder={t("research.categoryPlaceholder")}
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
          <input
            value={tag}
            onChange={(e) => {
              setCursor(null);
              setTag(e.target.value);
            }}
            placeholder={t("research.tagPlaceholder")}
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
          />
        </div>

        {recoQ.error ? <ApiErrorView error={recoQ.error} onRetry={() => recoQ.refetch()} /> : null}
        {postsQ.error ? <ApiErrorView error={postsQ.error} onRetry={() => postsQ.refetch()} /> : null}

        {(recoQ.data?.items ?? []).length ? (
          <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("research.recommendations")}</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {(recoQ.data?.items ?? []).slice(0, 6).map((p) => (
                <Link
                  key={p.slug}
                  href={`/research/${encodeURIComponent(p.slug)}`}
                  className="rounded-2xl border border-gray-200 bg-white p-4 hover:border-primary/30"
                >
                  <p className="text-xs text-gray-400">{p.published_at ? String(p.published_at).slice(0, 10) : ""}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">{p.title || p.slug}</p>
                  {p.summary ? <p className="mt-1 text-xs text-gray-500 line-clamp-2">{p.summary}</p> : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Link
              key={p.slug}
              href={`/research/${encodeURIComponent(p.slug)}`}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30"
            >
              <p className="text-xs font-semibold text-gray-400">{p.published_at ? String(p.published_at).slice(0, 10) : ""}</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">{p.title || p.slug}</h3>
              <p className="mt-2 text-sm text-gray-500 line-clamp-3">{p.summary || ""}</p>
            </Link>
          ))}
        </div>

        {postsQ.isLoading ? (
          <div className="mt-6 text-sm text-gray-500">{t("common.loading")}</div>
        ) : null}

        {postsQ.data?.cursor_next ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("research.loadMore")}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

"use client";

// 변경 이유: Week6 전역 검색 페이지(/search)에서 CSR 훅(useSearchParams) 없이도 빌드/프리렌더가 가능하도록 클라이언트를 분리

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { useAuth } from "@/contexts/AuthContext";
import { getTrending, searchMyScreeners, searchPublic } from "@/lib/searchClient";

export default function SearchPageClient({ q }: { q: string }) {
  const { t } = useTranslation();
  const { user, sessionReady } = useAuth();

  const query = String(q || "").trim();
  const [tab, setTab] = useState<"symbols" | "posts" | "screeners">("symbols");
  const isAuthed = Boolean(user && sessionReady);

  const trendingQ = useQuery({
    queryKey: ["search.trending"],
    queryFn: () => getTrending({ range: "24h", limit: 15 })
  });

  const publicQ = useQuery({
    queryKey: ["search.public", query],
    queryFn: () => searchPublic({ q: query, types: "symbols,posts", limit: 20 }),
    enabled: Boolean(query)
  });

  const screenersQ = useQuery({
    queryKey: ["search.screeners", query],
    queryFn: () => searchMyScreeners({ q: query, limit: 20 }),
    enabled: Boolean(query && isAuthed)
  });

  const symbols = useMemo(() => publicQ.data?.symbols ?? [], [publicQ.data?.symbols]);
  const posts = useMemo(() => publicQ.data?.posts ?? [], [publicQ.data?.posts]);
  const screeners = useMemo(() => screenersQ.data?.items ?? [], [screenersQ.data?.items]);

  const activeItems = useMemo(() => {
    if (tab === "posts") return posts;
    if (tab === "screeners") return screeners;
    return symbols;
  }, [tab, posts, screeners, symbols]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("search.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("search.desc")}</p>
        </header>

        {!query ? (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("search.trending")}</h2>
            {trendingQ.error ? <ApiErrorView error={trendingQ.error} onRetry={() => trendingQ.refetch()} /> : null}
            {trendingQ.isLoading ? <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p> : null}
            <div className="mt-4 flex flex-wrap gap-2">
              {(trendingQ.data?.items ?? []).map((it) => (
                <Link
                  key={it.keyword}
                  href={`/search?q=${encodeURIComponent(it.keyword)}`}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                >
                  {it.keyword}
                </Link>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500">{t("search.tip")}</p>
          </section>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("symbols")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === "symbols" ? "bg-primary text-ink" : "border border-gray-200 bg-white text-gray-700"
                }`}
              >
                {t("search.tabs.symbols")} ({symbols.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("posts")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === "posts" ? "bg-primary text-ink" : "border border-gray-200 bg-white text-gray-700"
                }`}
              >
                {t("search.tabs.posts")} ({posts.length})
              </button>
              {isAuthed ? (
                <button
                  type="button"
                  onClick={() => setTab("screeners")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${
                    tab === "screeners" ? "bg-primary text-ink" : "border border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  {t("search.tabs.screeners")} ({screeners.length})
                </button>
              ) : null}
            </div>

            {publicQ.error ? <ApiErrorView error={publicQ.error} onRetry={() => publicQ.refetch()} /> : null}
            {screenersQ.error ? <ApiErrorView error={screenersQ.error} onRetry={() => screenersQ.refetch()} /> : null}
            {publicQ.isLoading ? <p className="text-sm text-gray-500">{t("common.loading")}</p> : null}

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              {activeItems.length === 0 ? (
                <p className="text-sm text-gray-500">{t("search.empty")}</p>
              ) : tab === "posts" ? (
                <div className="space-y-3">
                  {posts.map((p) => (
                    <Link
                      key={p.slug}
                      href={`/research/${encodeURIComponent(p.slug)}`}
                      className="block rounded-2xl border border-gray-200 p-4 hover:border-primary/30"
                    >
                      <p className="text-xs text-gray-400">{p.published_at ? String(p.published_at).slice(0, 10) : ""}</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900">{p.title}</p>
                      {p.summary ? <p className="mt-1 text-sm text-gray-500 line-clamp-2">{p.summary}</p> : null}
                    </Link>
                  ))}
                </div>
              ) : tab === "screeners" ? (
                <div className="space-y-2">
                  {screeners.map((s) => (
                    <Link
                      key={s.id}
                      href="/screener"
                      className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4 hover:border-primary/30"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{s.name}</p>
                        <p className="mt-1 text-xs text-gray-500">{String(s.market || "").toUpperCase()}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">{t("search.open")}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {symbols.map((s) => (
                    <Link
                      key={`${s.market}:${s.symbol}`}
                      href={`/chart/${encodeURIComponent(s.symbol)}`}
                      className="rounded-2xl border border-gray-200 p-4 hover:border-primary/30"
                    >
                      <p className="text-sm font-semibold text-gray-900">{s.symbol}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {s.base_asset}/{s.quote_asset} · {String(s.market || "").toUpperCase()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}


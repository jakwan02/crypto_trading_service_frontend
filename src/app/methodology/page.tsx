"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { useAuth } from "@/contexts/AuthContext";
import { patchOnboarding } from "@/lib/onboardingClient";
import { listPosts } from "@/lib/postsClient";

export default function MethodologyPage() {
  const { t } = useTranslation();
  const { user, sessionReady } = useAuth();
  const [cursor, setCursor] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["posts", "methodology", cursor],
    queryFn: () => listPosts({ cursor, limit: 20, category: "methodology", tag: null, q: null })
  });

  const items = useMemo(() => q.data?.items ?? [], [q.data?.items]);
  const onLoadMore = useCallback(() => {
    const next = q.data?.cursor_next ?? null;
    if (!next) return;
    setCursor(next);
  }, [q.data?.cursor_next]);

  useEffect(() => {
    if (!user || !sessionReady) return;
    void (async () => {
      try {
        await patchOnboarding({ step: { methodology_opened: true } });
      } catch {
        // ignore (best-effort)
      }
    })();
  }, [user, sessionReady]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("methodology.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("methodology.desc")}</p>
        </header>

        {q.error ? <ApiErrorView error={q.error} onRetry={() => q.refetch()} /> : null}

        <div className="grid gap-4 md:grid-cols-2">
          {items.map((p) => (
            <Link
              key={p.slug}
              href={`/methodology/${encodeURIComponent(p.slug)}`}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-primary/30"
            >
              <p className="text-xs font-semibold text-gray-400">{p.published_at ? String(p.published_at).slice(0, 10) : ""}</p>
              <h3 className="mt-2 text-lg font-semibold text-gray-900">{p.title || p.slug}</h3>
              <p className="mt-2 text-sm text-gray-500 line-clamp-3">{p.summary || ""}</p>
            </Link>
          ))}
        </div>

        {q.isLoading ? <div className="mt-6 text-sm text-gray-500">{t("common.loading")}</div> : null}

        {q.data?.cursor_next ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("methodology.loadMore")}
            </button>
          </div>
        ) : null}

        {!q.isLoading && items.length === 0 ? <p className="mt-6 text-sm text-gray-500">{t("methodology.empty")}</p> : null}
      </div>
    </main>
  );
}

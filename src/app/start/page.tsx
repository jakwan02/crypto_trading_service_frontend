"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { listPosts } from "@/lib/postsClient";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function StartPage() {
  const { t } = useTranslation();
  const onboarding = useOnboarding();
  const [cursor, setCursor] = useState<string | null>(null);

  const playbooksQ = useQuery({
    queryKey: ["posts", "playbook", cursor],
    queryFn: () => listPosts({ cursor, limit: 20, category: "playbook", tag: null, q: null })
  });

  const items = useMemo(() => playbooksQ.data?.items ?? [], [playbooksQ.data?.items]);
  const nextCursor = playbooksQ.data?.cursor_next ?? null;

  const progress = onboarding.summaryQ.data?.progress ?? null;
  const nextAction = onboarding.nextAction;

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("start.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("start.desc")}</p>
        </header>

        {onboarding.enabled && onboarding.summaryQ.error ? <ApiErrorView error={onboarding.summaryQ.error} onRetry={() => onboarding.summaryQ.refetch()} /> : null}
        {playbooksQ.error ? <ApiErrorView error={playbooksQ.error} onRetry={() => playbooksQ.refetch()} /> : null}

        {onboarding.enabled ? (
          <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("start.progressTitle")}</h2>
            <p className="mt-2 text-sm text-gray-600">
              {t("start.progressMeta", { done: progress?.done ?? 0, total: progress?.total ?? 0, pct: progress?.pct ?? 0 })}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={nextAction?.cta_path || "/onboarding"}
                className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
              >
                {t("start.nextCta")}
              </Link>
              <Link
                href="/onboarding"
                className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("start.viewChecklist")}
              </Link>
            </div>
          </section>
        ) : (
          <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("start.loginTitle")}</h2>
            <p className="mt-2 text-sm text-gray-600">{t("start.loginDesc")}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/login?next=%2Fstart"
                className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
              >
                {t("common.login")}
              </Link>
              <Link
                href="/signup?next=%2Fstart"
                className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("start.signup")}
              </Link>
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">{t("start.playbooksTitle")}</h2>
          <p className="mt-1 text-xs text-gray-500">{t("start.playbooksDesc")}</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
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

          {playbooksQ.isLoading ? <div className="mt-6 text-sm text-gray-500">{t("common.loading")}</div> : null}
          {!playbooksQ.isLoading && items.length === 0 ? <p className="mt-6 text-sm text-gray-500">{t("start.empty")}</p> : null}

          {nextCursor ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setCursor(nextCursor)}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("start.loadMore")}
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}


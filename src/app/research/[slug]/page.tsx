"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import Link from "next/link";
import { getPost, listRecommendations, trackPostView } from "@/lib/postsClient";
import { getMarkdownRenderer } from "@/lib/markdown";

export default function ResearchPostPage() {
  const { t } = useTranslation();
  const params = useParams<{ slug?: string }>();
  const slug = String(params?.slug || "").trim();
  const md = useMemo(() => getMarkdownRenderer(), []);

  const q = useQuery({
    queryKey: ["posts", slug],
    queryFn: () => getPost(slug),
    enabled: !!slug
  });
  const post = q.data;
  const bodyHtml = useMemo(() => md.render(String(post?.body_md || "")), [md, post?.body_md]);

  const recoQ = useQuery({
    queryKey: ["content.recommendations", slug],
    queryFn: () => listRecommendations({ limit: 8 })
  });

  useEffect(() => {
    if (!slug) return;
    if (!post) return;
    const key = "anon_id";
    let anonId = "";
    try {
      anonId = String(window.localStorage.getItem(key) || "").trim();
      if (!anonId) {
        anonId = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
        window.localStorage.setItem(key, anonId);
      }
    } catch {
      anonId = "";
    }
    void trackPostView({ slug, anonId: anonId || null });
  }, [slug, post]);

  if (!slug) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <p className="text-sm text-gray-500">{t("research.invalidSlug")}</p>
        </div>
      </main>
    );
  }

  if (q.error) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-3xl px-4 py-10">
          <ApiErrorView error={q.error} onRetry={() => q.refetch()} />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <header className="mb-6">
          <p className="text-xs text-gray-400">{post?.published_at ? String(post.published_at).slice(0, 10) : ""}</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{post?.title || slug}</h1>
          {post?.summary ? <p className="mt-3 text-sm text-gray-600">{post.summary}</p> : null}
        </header>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div
            className="text-sm leading-7 text-gray-800"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />
        </article>

        {(recoQ.data?.items ?? []).length ? (
          <section className="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("research.related")}</h2>
            {recoQ.error ? <ApiErrorView error={recoQ.error} onRetry={() => recoQ.refetch()} /> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(recoQ.data?.items ?? [])
                .filter((it) => it.slug !== slug)
                .slice(0, 6)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/research/${encodeURIComponent(p.slug)}`}
                    className="rounded-2xl border border-gray-200 p-4 hover:border-primary/30"
                  >
                    <p className="text-xs text-gray-400">{p.published_at ? String(p.published_at).slice(0, 10) : ""}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 line-clamp-2">{p.title || p.slug}</p>
                    {p.summary ? <p className="mt-1 text-xs text-gray-500 line-clamp-2">{p.summary}</p> : null}
                  </Link>
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

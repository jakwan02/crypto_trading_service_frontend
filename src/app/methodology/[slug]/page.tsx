"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getMarkdownRenderer } from "@/lib/markdown";
import { getPost, trackPostView } from "@/lib/postsClient";

export default function MethodologyPostPage() {
  const { t } = useTranslation();
  const params = useParams<{ slug?: string }>();
  const slug = String(params?.slug || "").trim();
  const md = useMemo(() => getMarkdownRenderer(), []);

  const q = useQuery({
    queryKey: ["posts", "methodology", slug],
    queryFn: () => getPost(slug),
    enabled: !!slug
  });

  const post = q.data;
  const bodyHtml = useMemo(() => md.render(String(post?.body_md || "")), [md, post?.body_md]);

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
          <p className="text-sm text-gray-500">{t("methodology.invalidSlug")}</p>
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
          <Link href="/methodology" className="text-xs font-semibold text-primary">
            {t("methodology.back")}
          </Link>
          <p className="mt-3 text-xs text-gray-400">{post?.published_at ? String(post.published_at).slice(0, 10) : ""}</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{post?.title || slug}</h1>
          {post?.summary ? <p className="mt-3 text-sm text-gray-600">{post.summary}</p> : null}
        </header>

        <article className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="text-sm leading-7 text-gray-800" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
        </article>
      </div>
    </main>
  );
}


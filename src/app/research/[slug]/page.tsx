"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getPost } from "@/lib/postsClient";
import MarkdownIt from "markdown-it";

export default function ResearchPostPage() {
  const { t } = useTranslation();
  const params = useParams<{ slug?: string }>();
  const slug = String(params?.slug || "").trim();
  const md = useMemo(() => new MarkdownIt({ html: false, linkify: true, breaks: true }), []);

  const q = useQuery({
    queryKey: ["posts", slug],
    queryFn: () => getPost(slug),
    enabled: !!slug
  });
  const post = q.data;
  const bodyHtml = useMemo(() => md.render(String(post?.body_md || "")), [md, post?.body_md]);

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
      </div>
    </main>
  );
}

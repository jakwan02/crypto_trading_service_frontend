"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getLatestLegal } from "@/lib/legalClient";
import { getMarkdownRenderer } from "@/lib/markdown";

export default function TermsPage() {
  const { t, i18n } = useTranslation();
  const locale = String(i18n.language || "ko").split("-")[0];
  const md = useMemo(() => getMarkdownRenderer(), []);
  const q = useQuery({ queryKey: ["legal.terms", locale], queryFn: () => getLatestLegal("terms", locale), retry: 1 });
  const doc = q.data;
  const bodyHtml = useMemo(() => md.render(String(doc?.body_md || "")), [md, doc?.body_md]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">{doc?.title || t("legal.termsTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("legal.version")} {doc?.version || "-"}</p>
        {q.isError ? (
          <div className="mt-6">
            <ApiErrorView error={q.error} onRetry={() => q.refetch()} />
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            {q.isLoading ? <p>{t("common.loading")}</p> : <div className="leading-7 text-gray-800" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { useAuth } from "@/contexts/AuthContext";
import { listFaqs } from "@/lib/supportClient";

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const faqsQ = useQuery({ queryKey: ["support.faqs"], queryFn: () => listFaqs(null), retry: 1 });
  const items = faqsQ.data?.items ?? [];

  const grouped = useMemo(() => {
    const map = new Map<string, typeof items>();
    for (const it of items) {
      const c = String(it.category || "general");
      const arr = map.get(c) ?? [];
      arr.push(it);
      map.set(c, arr);
    }
    return [...map.entries()];
  }, [items]);

  const ticketHref = user ? "/support/tickets" : `/login?next=${encodeURIComponent("/support/tickets")}`;

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("support.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("support.desc")}</p>
        </header>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href={ticketHref}
            className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
          >
            {t("support.ctaTicket")}
          </Link>
          <Link
            href="/status"
            className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
          >
            {t("support.ctaStatus")}
          </Link>
        </div>

        {faqsQ.isError ? (
          <div className="max-w-2xl">
            <ApiErrorView error={faqsQ.error} onRetry={() => faqsQ.refetch()} />
          </div>
        ) : null}

        {grouped.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            {faqsQ.isLoading ? t("common.loading") : t("support.emptyFaq")}
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map(([cat, catItems]) => (
              <section key={cat} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("support.category")} {cat}</h2>
                <div className="mt-4 space-y-3">
                  {catItems.map((it) => (
                    <details key={it.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-900">{it.question}</summary>
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{it.answer_md}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}


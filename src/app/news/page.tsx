"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const SOURCES = [
  { id: "all", labelKey: "news.sources.all" },
  { id: "coindesk", labelKey: "news.sources.coindesk" },
  { id: "cointelegraph", labelKey: "news.sources.cointelegraph" },
  { id: "bloomberg", labelKey: "news.sources.bloomberg" },
  { id: "theBlock", labelKey: "news.sources.theBlock" }
] as const;

const NEWS = [
  {
    id: "news-1",
    titleKey: "news.items.news1.title",
    sourceId: "coindesk",
    timeKey: "news.items.news1.time",
    tagKey: "news.tags.market"
  },
  {
    id: "news-2",
    titleKey: "news.items.news2.title",
    sourceId: "cointelegraph",
    timeKey: "news.items.news2.time",
    tagKey: "news.tags.alt"
  },
  {
    id: "news-3",
    titleKey: "news.items.news3.title",
    sourceId: "theBlock",
    timeKey: "news.items.news3.time",
    tagKey: "news.tags.exchange"
  },
  {
    id: "news-4",
    titleKey: "news.items.news4.title",
    sourceId: "bloomberg",
    timeKey: "news.items.news4.time",
    tagKey: "news.tags.regulation"
  },
  {
    id: "news-5",
    titleKey: "news.items.news5.title",
    sourceId: "coindesk",
    timeKey: "news.items.news5.time",
    tagKey: "news.tags.onchain"
  }
];

export default function NewsPage() {
  const [source, setSource] = useState<(typeof SOURCES)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NEWS.filter((item) => {
      const matchesSource = source === "all" || item.sourceId === source;
      const title = t(item.titleKey).toLowerCase();
      const matchesQuery = q === "" || title.includes(q);
      return matchesSource && matchesQuery;
    });
  }, [source, query, t]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("news.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("news.desc")}</p>
        </header>

        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {SOURCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSource(item.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  source === item.id ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                }`}
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("news.search")}
            className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none sm:w-64"
          />
        </div>

        <div className="space-y-4">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-500">
                  {t(item.tagKey)}
                </span>
                <span>{t(`news.sources.${item.sourceId}`)}</span>
                <span>·</span>
                <span>{t(item.timeKey)}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">{t(item.titleKey)}</h2>
              <p className="mt-2 text-sm text-gray-500">
                {t("news.summary")}
              </p>
              <button type="button" className="mt-4 text-xs font-semibold text-primary">
                {t("news.viewFull")}
              </button>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

const SOURCES = ["전체", "CoinDesk", "Cointelegraph", "Bloomberg", "The Block"] as const;

const NEWS = [
  {
    id: "news-1",
    title: "비트코인 현물 ETF 자금 유입 확대",
    source: "CoinDesk",
    time: "10분 전",
    tag: "시장"
  },
  {
    id: "news-2",
    title: "알트코인 거래량 급증, 변동성 확대",
    source: "Cointelegraph",
    time: "35분 전",
    tag: "알트"
  },
  {
    id: "news-3",
    title: "거래소 유동성 지표 개선",
    source: "The Block",
    time: "1시간 전",
    tag: "거래소"
  },
  {
    id: "news-4",
    title: "규제 당국, 스테이블코인 가이드라인 발표",
    source: "Bloomberg",
    time: "2시간 전",
    tag: "규제"
  },
  {
    id: "news-5",
    title: "고래 지갑 대규모 이동 감지",
    source: "CoinDesk",
    time: "3시간 전",
    tag: "온체인"
  }
];

export default function NewsPage() {
  const [source, setSource] = useState<(typeof SOURCES)[number]>("전체");
  const [query, setQuery] = useState("");
  const { t } = useTranslation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NEWS.filter((item) => {
      const matchesSource = source === "전체" || item.source === source;
      const matchesQuery = q === "" || item.title.toLowerCase().includes(q);
      return matchesSource && matchesQuery;
    });
  }, [source, query]);

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
                key={item}
                type="button"
                onClick={() => setSource(item)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  source === item ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-600"
                }`}
              >
                {item}
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
                <span className="rounded-full bg-gray-100 px-2 py-1 font-semibold text-gray-500">{item.tag}</span>
                <span>{item.source}</span>
                <span>·</span>
                <span>{item.time}</span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-500">
                주요 내용 요약이 여기에 표시됩니다. 상세 뉴스는 클릭하여 원문으로 이동할 수 있습니다.
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

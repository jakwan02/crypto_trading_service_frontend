"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getBriefing, getLatestBriefing, listBriefings } from "@/lib/briefingsClient";
import { getMarkdownRenderer } from "@/lib/markdown";
import { patchOnboarding } from "@/lib/onboardingClient";
import type { BriefingKind } from "@/types/briefings";

const KINDS: BriefingKind[] = ["daily", "weekly"];

function fmtDate(value?: string | null): string {
  const s = String(value || "").trim();
  if (!s) return "-";
  return s;
}

export default function BriefingPage() {
  const { t } = useTranslation();
  const [kind, setKind] = useState<BriefingKind>("daily");
  const [selectedId, setSelectedId] = useState<string>("");
  const md = useMemo(() => getMarkdownRenderer(), []);

  const latestQ = useQuery({
    queryKey: ["briefings.latest", kind],
    queryFn: () => getLatestBriefing(kind),
    staleTime: 30_000
  });

  const listQ = useInfiniteQuery({
    queryKey: ["briefings.list", kind],
    queryFn: ({ pageParam }) => listBriefings({ kind, cursor: (pageParam as string | null | undefined) ?? null, limit: 20 }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  useEffect(() => {
    if (selectedId) return;
    const id = String(latestQ.data?.id || "").trim();
    if (!id) return;
    queueMicrotask(() => setSelectedId(id));
  }, [latestQ.data?.id, selectedId]);

  useEffect(() => {
    if (!latestQ.data?.id) return;
    void (async () => {
      try {
        await patchOnboarding({ step: { briefing_opened: true } });
      } catch {
        // ignore (best-effort)
      }
    })();
  }, [latestQ.data?.id]);

  const detailEnabled = Boolean(selectedId && selectedId !== String(latestQ.data?.id || ""));
  const detailQ = useQuery({
    queryKey: ["briefings.get", selectedId],
    queryFn: () => getBriefing(selectedId),
    enabled: detailEnabled,
    staleTime: 60_000
  });

  const active = selectedId && selectedId === String(latestQ.data?.id || "") ? latestQ.data : detailQ.data;
  const activeHtml = useMemo(() => md.render(String(active?.md_text || "")), [md, active?.md_text]);

  const items = useMemo(() => (listQ.data?.pages ?? []).flatMap((p) => p.items ?? []), [listQ.data?.pages]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("briefing.title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("briefing.desc")}</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                <span className="font-semibold">{t("briefing.kindLabel")}</span>
                <select
                  value={String(kind)}
                  onChange={(e) => {
                    setSelectedId("");
                    setKind(e.target.value as BriefingKind);
                  }}
                  className="bg-transparent text-xs font-semibold text-gray-800 outline-none"
                >
                  {KINDS.map((k) => (
                    <option key={String(k)} value={String(k)}>
                      {t(`briefing.kind.${k}`)}
                    </option>
                  ))}
                </select>
              </label>
              <Link
                href="/account/settings"
                className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("briefing.settingsCta")}
              </Link>
            </div>
          </header>

          {latestQ.error ? <ApiErrorView error={latestQ.error} onRetry={() => latestQ.refetch()} /> : null}
          {listQ.error ? <ApiErrorView error={listQ.error} onRetry={() => listQ.refetch()} /> : null}
          {detailQ.error ? <ApiErrorView error={detailQ.error} onRetry={() => detailQ.refetch()} /> : null}

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-gray-500">{t("briefing.asOf")}</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{fmtDate(active?.as_of_date)}</p>
                </div>
                <div className="text-xs text-gray-500">{active?.tz ? `${t("briefing.tz")}: ${String(active.tz)}` : ""}</div>
              </div>

              <article className="mt-4 rounded-2xl border border-gray-200 bg-white p-5">
                <div className="text-sm leading-7 text-gray-800" dangerouslySetInnerHTML={{ __html: activeHtml }} />
              </article>

              {latestQ.isLoading || listQ.isLoading || detailQ.isLoading ? (
                <p className="mt-4 text-sm text-gray-500">{t("common.loading")}</p>
              ) : null}
            </section>

            <aside className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("briefing.historyTitle")}</h2>
                <p className="mt-1 text-xs text-gray-500">{t("briefing.historyDesc")}</p>

                <div className="mt-4 space-y-2">
                  {items.map((it) => {
                    const id = String(it.id || "");
                    const isActive = id && id === selectedId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedId(id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          isActive ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-white hover:border-primary/30"
                        }`}
                      >
                        <p className="text-xs font-semibold text-gray-500">{t(`briefing.kind.${String(it.kind || kind)}`)}</p>
                        <p className="mt-1 font-semibold text-gray-900">{fmtDate(it.as_of_date)}</p>
                      </button>
                    );
                  })}
                </div>

                {listQ.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => listQ.fetchNextPage()}
                    className="mt-4 w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("briefing.loadMore")}
                  </button>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

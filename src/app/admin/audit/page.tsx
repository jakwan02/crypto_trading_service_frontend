"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminListAudit } from "@/lib/adminAuditClient";

export default function AdminAuditPage() {
  const { t } = useTranslation();
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");

  const q = useInfiniteQuery({
    queryKey: ["admin.audit", actor, action],
    queryFn: async ({ pageParam }) =>
      await adminListAudit({
        cursor: (pageParam as string | null | undefined) ?? null,
        limit: 100,
        actor: actor.trim() || null,
        action: action.trim() || null,
        from: null,
        to: null
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const items = useMemo(() => {
    const out = [];
    for (const p of q.data?.pages ?? []) out.push(...(p.items ?? []));
    return out;
  }, [q.data]);

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminAudit.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminAudit.desc")}</p>
          </header>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminAudit.actor")}</label>
                <input
                  value={actor}
                  onChange={(e) => setActor(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminAudit.actorPlaceholder")}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminAudit.action")}</label>
                <input
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder="refund.approve"
                />
              </div>
            </div>

            {q.isError ? (
              <div className="mt-4">
                <ApiErrorView error={q.error} onRetry={() => q.refetch()} />
              </div>
            ) : null}

            <div className="mt-5 space-y-2">
              {items.length === 0 && !q.isFetching ? <p className="text-sm text-gray-500">{t("adminAudit.empty")}</p> : null}
              {items.map((e) => (
                <div key={e.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-gray-900">{e.action}</p>
                    <span className="text-xs text-gray-500">{e.created_at ?? "—"}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    actor: {e.actor_user_id} · target: {e.target_type ?? "—"} {e.target_id ?? ""}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-end">
              <button
                type="button"
                disabled={!q.hasNextPage || q.isFetchingNextPage}
                onClick={() => q.fetchNextPage()}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-50"
              >
                {q.hasNextPage ? t("common.more") : t("adminAudit.noMore")}
              </button>
            </div>
          </div>
        </div>
      </main>
    </RequireAdmin>
  );
}


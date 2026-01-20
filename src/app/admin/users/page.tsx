"use client";

import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import RequireAdmin from "@/components/auth/RequireAdmin";
import ApiErrorView from "@/components/common/ApiErrorView";
import { adminListUsers } from "@/lib/adminUsersClient";

export default function AdminUsersPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const [role, setRole] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  const usersQ = useInfiniteQuery({
    queryKey: ["admin.users", q, role, status],
    queryFn: async ({ pageParam }) =>
      await adminListUsers({
        cursor: (pageParam as string | null | undefined) ?? null,
        limit: 50,
        q: q.trim() || null,
        role: role || null,
        status: status || null
      }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const items = useMemo(() => {
    const out = [];
    for (const p of usersQ.data?.pages ?? []) out.push(...(p.items ?? []));
    return out;
  }, [usersQ.data]);

  return (
    <RequireAdmin>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("adminUsers.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("adminUsers.desc")}</p>
          </header>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminUsers.search")}</label>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  placeholder={t("adminUsers.searchPlaceholder")}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminUsers.role")}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="">{t("adminUsers.all")}</option>
                  <option value="user">{t("adminUsers.roleUser")}</option>
                  <option value="admin">{t("adminUsers.roleAdmin")}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("adminUsers.status")}</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <option value="">{t("adminUsers.all")}</option>
                  <option value="active">{t("adminUsers.statusActive")}</option>
                  <option value="inactive">{t("adminUsers.statusInactive")}</option>
                </select>
              </div>
            </div>

            {usersQ.isError ? (
              <div className="mt-4">
                <ApiErrorView error={usersQ.error} onRetry={() => usersQ.refetch()} />
              </div>
            ) : null}

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-[900px] w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs font-semibold text-gray-500">
                    <th className="py-2 pr-4">{t("adminUsers.email")}</th>
                    <th className="py-2 pr-4">{t("adminUsers.role")}</th>
                    <th className="py-2 pr-4">{t("adminUsers.plan")}</th>
                    <th className="py-2 pr-4">{t("adminUsers.createdAt")}</th>
                    <th className="py-2 pr-4">{t("adminUsers.lastLoginAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && !usersQ.isFetching ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-gray-500">
                        {t("adminUsers.empty")}
                      </td>
                    </tr>
                  ) : null}
                  {items.map((u) => (
                    <tr key={u.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4">
                        <Link className="font-semibold text-gray-900 hover:text-primary" href={`/admin/users/${encodeURIComponent(u.id)}`}>
                          {u.email}
                        </Link>
                        <div className="mt-1 text-xs text-gray-500">{u.id}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">
                          {String(u.role || "").toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{String(u.plan || "").toUpperCase()}</td>
                      <td className="py-3 pr-4 text-xs text-gray-600">{u.created_at ? String(u.created_at) : "—"}</td>
                      <td className="py-3 pr-4 text-xs text-gray-600">{u.last_login_at ? String(u.last_login_at) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                {usersQ.isFetching ? t("common.loading") : t("adminUsers.count", { count: items.length })}
              </p>
              <button
                type="button"
                disabled={!usersQ.hasNextPage || usersQ.isFetchingNextPage}
                onClick={() => usersQ.fetchNextPage()}
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-50"
              >
                {usersQ.hasNextPage ? t("common.more") : t("adminUsers.noMore")}
              </button>
            </div>
          </div>
        </div>
      </main>
    </RequireAdmin>
  );
}


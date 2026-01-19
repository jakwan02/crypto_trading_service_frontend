"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getSharedWatchlist } from "@/lib/publicClient";
import { useTranslation } from "react-i18next";

type Props = { token: string };

export default function SharedWatchlistClient({ token }: Props) {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["sharedWatchlist", token],
    queryFn: () => getSharedWatchlist(token),
    enabled: Boolean(token)
  });
  const items = query.data?.items ?? [];

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{t("watchlists.shared.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("watchlists.shared.desc")}</p>
          </div>
          <Link href="/watchlists" className="text-sm font-semibold text-primary">
            {t("watchlists.back")}
          </Link>
        </header>

        {!token ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-600">{t("watchlists.shared.invalidToken")}</p>
          </div>
        ) : query.isLoading ? (
          <p className="text-sm text-gray-500">{t("common.loading")}</p>
        ) : query.isError ? (
          <ApiErrorView error={query.error} onRetry={() => query.refetch()} />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <table className="w-full table-fixed">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold text-gray-600">
                  <th className="px-4 py-3">{t("watchlists.table.market")}</th>
                  <th className="px-4 py-3">{t("watchlists.table.symbol")}</th>
                  <th className="px-4 py-3 text-right">{t("watchlists.shared.chart")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {items.length ? (
                  items.map((it) => (
                    <tr key={`${it.market}:${it.symbol}`} className="bg-white">
                      <td className="px-4 py-3">{String(it.market || "spot").toUpperCase()}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{String(it.symbol || "").toUpperCase()}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/chart/${encodeURIComponent(String(it.symbol || "").toUpperCase())}?market=${encodeURIComponent(
                            String(it.market || "spot")
                          )}`}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary"
                        >
                          {t("watchlists.shared.viewChart")}
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">
                      {t("watchlists.shared.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

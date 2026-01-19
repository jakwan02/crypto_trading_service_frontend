"use client";

import type { WatchlistItem } from "@/types/watchlists";
import { useTranslation } from "react-i18next";

type Props = {
  items: WatchlistItem[];
  onRemove: (market: string, symbol: string) => void;
};

export default function WatchlistTable({ items, onRemove }: Props) {
  const { t } = useTranslation();
  const marketLabel = (raw?: string | null): string => {
    const v = String(raw || "").trim().toLowerCase();
    if (!v) return "-";
    if (v === "spot") return t("watchlists.market.spot");
    if (v === "um") return t("watchlists.market.um");
    if (v === "cm") return t("watchlists.market.cm");
    return String(raw || "").toUpperCase();
  };
  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full table-fixed">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold text-gray-600">
            <th className="px-4 py-3">{t("watchlists.table.market")}</th>
            <th className="px-4 py-3">{t("watchlists.table.symbol")}</th>
            <th className="px-4 py-3 text-right">{t("watchlists.table.remove")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
          {items.length ? (
            items.map((it) => (
              <tr key={`${it.market}:${it.symbol}`} className="bg-white">
                <td className="px-4 py-3">{marketLabel(it.market)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{String(it.symbol || "").toUpperCase()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(String(it.market || "spot"), String(it.symbol || "").toUpperCase())}
                    className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary"
                  >
                    {t("watchlists.table.removeCta")}
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">
                {t("watchlists.table.empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

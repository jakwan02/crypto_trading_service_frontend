"use client";

import type { Watchlist } from "@/types/watchlists";
import { useTranslation } from "react-i18next";

type Props = {
  items: Watchlist[];
  value: string;
  onChange: (id: string) => void;
};

export default function WatchlistPicker({ items, value, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="space-y-2">
      {items.map((w) => {
        const rawName = String(w.name || "");
        const isDefaultFavorites = w.is_default && rawName.trim().toLowerCase() === "favorites";
        const displayName = isDefaultFavorites ? t("watchlists.defaults.favoritesName") : rawName;

        return (
          <button
            key={w.id}
            type="button"
            onClick={() => onChange(String(w.id))}
            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
              value === String(w.id)
                ? "border-primary/40 bg-primary/5"
                : "border-gray-200 bg-white hover:border-primary/30"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              {w.is_default ? (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600">
                  {t("watchlists.badgeDefault")}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-gray-500">{(w.tags ?? []).length ? (w.tags ?? []).join(", ") : "-"}</p>
          </button>
        );
      })}
    </div>
  );
}

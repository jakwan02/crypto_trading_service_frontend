"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import WatchlistTable from "@/components/watchlists/WatchlistTable";
import ShareLink from "@/components/watchlists/ShareLink";
import { addWatchlistItem, deleteWatchlistItem, getWatchlist, shareWatchlist, updateWatchlist } from "@/lib/watchlistsClient";
import { useTranslation } from "react-i18next";

type Props = { id: string };

function parseTags(raw: string): string[] {
  return String(raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function WatchlistDetailClient({ id }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  const [addMarket, setAddMarket] = useState("spot");
  const [addSymbol, setAddSymbol] = useState("");
  const [shareToken, setShareToken] = useState("");

  const detailQuery = useQuery({
    queryKey: ["watchlist", id],
    queryFn: () => getWatchlist(id),
    enabled: Boolean(id),
    staleTime: 5_000
  });

  const displayName = useCallback(
    (raw: string, isDefault?: boolean) => {
      const name = String(raw || "");
      const isDefaultFavorites = Boolean(isDefault) && name.trim().toLowerCase() === "favorites";
      return isDefaultFavorites ? t("watchlists.defaults.favoritesName") : name;
    },
    [t]
  );

  useEffect(() => {
    if (!detailQuery.data) return;
    const name = displayName(String(detailQuery.data.name || ""), detailQuery.data.is_default);
    const tags = (detailQuery.data.tags ?? []).join(", ");
    const tok = String(detailQuery.data.share_token || "");
    queueMicrotask(() => {
      setEditName(name);
      setEditTags(tags);
      setShareToken(tok);
    });
  }, [detailQuery.data, displayName]);

  const updateMutation = useMutation({
    mutationFn: () => updateWatchlist(id, { name: editName.trim() || undefined, tags: parseTags(editTags) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["watchlists"] });
      await qc.invalidateQueries({ queryKey: ["watchlist", id] });
    }
  });

  const shareMutation = useMutation({
    mutationFn: () => shareWatchlist(id),
    onSuccess: async (res) => {
      setShareToken(String(res.share_token || ""));
      await qc.invalidateQueries({ queryKey: ["watchlists"] });
      await qc.invalidateQueries({ queryKey: ["watchlist", id] });
    }
  });

  const addMutation = useMutation({
    mutationFn: () => addWatchlistItem(id, { market: addMarket, symbol: addSymbol.toUpperCase() }),
    onSuccess: async () => {
      setAddSymbol("");
      await qc.invalidateQueries({ queryKey: ["watchlist", id] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (p: { market: string; symbol: string }) => deleteWatchlistItem(id, p.symbol, p.market),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["watchlist", id] });
      await qc.invalidateQueries({ queryKey: ["favorites"] });
    }
  });

  const onRemove = useCallback(
    (market: string, symbol: string) => {
      removeMutation.mutate({ market, symbol });
    },
    [removeMutation]
  );

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-4xl px-4 py-10">
          <header className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("watchlists.detailTitle")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("watchlists.detailDesc")}</p>
            </div>
            <Link href="/watchlists" className="text-sm font-semibold text-primary">
              {t("watchlists.back")}
            </Link>
          </header>

          {!id ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-600">{t("watchlists.invalidId")}</p>
            </div>
          ) : detailQuery.isLoading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : detailQuery.isError ? (
            <ApiErrorView error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
          ) : detailQuery.data ? (
            <>
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900">
                  {displayName(String(detailQuery.data.name || ""), detailQuery.data.is_default)}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {(detailQuery.data.tags ?? []).length ? (detailQuery.data.tags ?? []).join(", ") : "-"}
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("watchlists.editName")}</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("watchlists.editTags")}</label>
                    <input
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateMutation.mutate()}
                    disabled={updateMutation.isPending}
                    className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white disabled:bg-gray-300"
                  >
                    {t("watchlists.updateCta")}
                  </button>
                  <button
                    type="button"
                    onClick={() => shareMutation.mutate()}
                    disabled={shareMutation.isPending}
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    {t("watchlists.share.cta")}
                  </button>
                </div>

                {updateMutation.isError ? <div className="mt-4"><ApiErrorView error={updateMutation.error} /></div> : null}
                {shareMutation.isError ? <div className="mt-4"><ApiErrorView error={shareMutation.error} /></div> : null}

                {shareToken ? (
                  <div className="mt-4">
                    <ShareLink token={shareToken} />
                  </div>
                ) : null}
              </section>

              <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">{t("watchlists.itemsTitle")}</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addMutation.mutate();
                  }}
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                >
                  <select
                    value={addMarket}
                    onChange={(e) => setAddMarket(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="spot">{t("watchlists.market.spot")}</option>
                    <option value="um">{t("watchlists.market.um")}</option>
                    <option value="cm">{t("watchlists.market.cm")}</option>
                  </select>
                  <input
                    value={addSymbol}
                    onChange={(e) => setAddSymbol(e.target.value)}
                    placeholder={t("watchlists.addSymbolPlaceholder")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                  <button
                    type="submit"
                    disabled={addMutation.isPending}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-500"
                  >
                    {t("watchlists.addSymbol")}
                  </button>
                </form>
                {addMutation.isError ? <div className="mt-4"><ApiErrorView error={addMutation.error} /></div> : null}

                <div className="mt-4">
                  <WatchlistTable items={detailQuery.data.items ?? []} onRemove={onRemove} />
                </div>
                {removeMutation.isError ? <div className="mt-4"><ApiErrorView error={removeMutation.error} /></div> : null}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </RequireAuth>
  );
}

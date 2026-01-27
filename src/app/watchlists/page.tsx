"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import WatchlistPicker from "@/components/watchlists/WatchlistPicker";
import WatchlistTable from "@/components/watchlists/WatchlistTable";
import ShareLink from "@/components/watchlists/ShareLink";
import {
  addWatchlistItem,
  createWatchlist,
  deleteWatchlist,
  deleteWatchlistItem,
  getWatchlist,
  listWatchlists,
  shareWatchlist,
  updateWatchlist
} from "@/lib/watchlistsClient";
import { useTranslation } from "react-i18next";

function parseTags(raw: string): string[] {
  return String(raw || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function WatchlistsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["watchlists"],
    queryFn: listWatchlists,
    staleTime: 10_000
  });

  const [selectedId, setSelectedId] = useState<string>("");
  const items = listQuery.data?.items ?? [];

  useEffect(() => {
    if (selectedId) return;
    if (!items.length) return;
    const nextId = String(items[0].id);
    queueMicrotask(() => setSelectedId(nextId));
  }, [items, selectedId]);

  const detailQuery = useQuery({
    queryKey: ["watchlist", selectedId],
    queryFn: () => getWatchlist(selectedId),
    enabled: Boolean(selectedId),
    staleTime: 5_000
  });

  const [createName, setCreateName] = useState("");
  const [createTags, setCreateTags] = useState("");
  const createMutation = useMutation({
    mutationFn: () => createWatchlist({ name: createName, tags: parseTags(createTags), is_public: false }),
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["watchlists"] });
      const id = String(res.id || "").trim();
      if (id) setSelectedId(id);
      setCreateName("");
      setCreateTags("");
    }
  });

  const [editName, setEditName] = useState("");
  const [editTags, setEditTags] = useState("");
  useEffect(() => {
    if (!detailQuery.data) return;
    const name = String(detailQuery.data.name || "");
    const tags = (detailQuery.data.tags ?? []).join(", ");
    queueMicrotask(() => {
      setEditName(name);
      setEditTags(tags);
    });
  }, [detailQuery.data]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateWatchlist(selectedId, {
        name: editName.trim() || undefined,
        tags: parseTags(editTags)
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["watchlists"] });
      await qc.invalidateQueries({ queryKey: ["watchlist", selectedId] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteWatchlist(selectedId),
    onSuccess: async () => {
      setSelectedId("");
      await qc.invalidateQueries({ queryKey: ["watchlists"] });
    }
  });

  const [addMarket, setAddMarket] = useState("spot");
  const [addSymbol, setAddSymbol] = useState("");
  const addMutation = useMutation({
    mutationFn: () => addWatchlistItem(selectedId, { market: addMarket, symbol: addSymbol.toUpperCase() }),
    onSuccess: async () => {
      setAddSymbol("");
      await qc.invalidateQueries({ queryKey: ["watchlist", selectedId] });
    }
  });

  const removeMutation = useMutation({
    mutationFn: (p: { market: string; symbol: string }) => deleteWatchlistItem(selectedId, p.symbol, p.market),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["watchlist", selectedId] });
      await qc.invalidateQueries({ queryKey: ["favorites"] });
    }
  });

  const [shareToken, setShareToken] = useState<string>("");
  const shareMutation = useMutation({
    mutationFn: () => shareWatchlist(selectedId),
    onSuccess: async (res) => {
      const tok = String(res.share_token || "").trim();
      setShareToken(tok);
      await qc.invalidateQueries({ queryKey: ["watchlists"] });
      await qc.invalidateQueries({ queryKey: ["watchlist", selectedId] });
    }
  });

  const onRemove = useCallback(
    (market: string, symbol: string) => {
      removeMutation.mutate({ market, symbol });
    },
    [removeMutation]
  );

  const selectedMeta = useMemo(() => items.find((w) => String(w.id) === String(selectedId)) || null, [items, selectedId]);
  const displaySelectedName = useMemo(() => {
    const rawName = String(detailQuery.data?.name || selectedMeta?.name || "");
    const isDefaultFavorites =
      Boolean(detailQuery.data?.is_default ?? selectedMeta?.is_default) && rawName.trim().toLowerCase() === "favorites";
    return isDefaultFavorites ? t("watchlists.defaults.favoritesName") : rawName;
  }, [detailQuery.data?.is_default, detailQuery.data?.name, selectedMeta?.is_default, selectedMeta?.name, t]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{t("watchlists.title")}</h1>
              <p className="mt-1 text-sm text-gray-500">{t("watchlists.desc")}</p>
            </div>
            <Link href="/upgrade" className="text-sm font-semibold text-primary">
              {t("common.proUpgrade")}
            </Link>
          </header>

          {listQuery.isLoading ? (
            <p className="text-sm text-gray-500">{t("common.loading")}</p>
          ) : listQuery.isError ? (
            <ApiErrorView error={listQuery.error} onRetry={() => listQuery.refetch()} />
          ) : (
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <aside className="space-y-4">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-gray-900">{t("watchlists.listTitle")}</h2>
                  <div className="mt-4">
                    <WatchlistPicker items={items} value={selectedId} onChange={(id) => setSelectedId(id)} />
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createMutation.mutate();
                  }}
                  className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <h2 className="text-sm font-semibold text-gray-900">{t("watchlists.createTitle")}</h2>
                  <div className="mt-4 space-y-3">
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      placeholder={t("watchlists.createNamePlaceholder")}
                      data-testid="watchlists-create-name"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      required
                    />
                    <input
                      value={createTags}
                      onChange={(e) => setCreateTags(e.target.value)}
                      placeholder={t("watchlists.createTagsPlaceholder")}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                    <button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="watchlists-create-submit"
                      className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:bg-gray-200 disabled:text-gray-500"
                    >
                      {t("watchlists.createCta")}
                    </button>
                    {createMutation.isError ? <ApiErrorView error={createMutation.error} /> : null}
                  </div>
                </form>
              </aside>

              <section className="space-y-4">
                {!selectedId ? (
                  <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                    <p className="text-sm text-gray-600">{t("watchlists.pickOne")}</p>
                  </div>
                ) : detailQuery.isLoading ? (
                  <p className="text-sm text-gray-500">{t("common.loading")}</p>
                ) : detailQuery.isError ? (
                  <ApiErrorView error={detailQuery.error} onRetry={() => detailQuery.refetch()} />
                ) : detailQuery.data ? (
                  <>
                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{displaySelectedName}</h2>
                          <p className="mt-1 text-xs text-gray-500">
                            {(detailQuery.data.tags ?? []).length ? (detailQuery.data.tags ?? []).join(", ") : "-"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => shareMutation.mutate()}
                            disabled={shareMutation.isPending}
                            data-testid="watchlists-share"
                            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:bg-gray-50 disabled:text-gray-400"
                          >
                            {t("watchlists.share.cta")}
                          </button>
                          <button
                            type="button"
                            onClick={() => updateMutation.mutate()}
                            disabled={updateMutation.isPending}
                            className="rounded-full bg-gray-900 px-4 py-2 text-xs font-semibold text-white disabled:bg-gray-300"
                          >
                            {t("watchlists.updateCta")}
                          </button>
                          {!selectedMeta?.is_default ? (
                            <button
                              type="button"
                              onClick={() => deleteMutation.mutate()}
                              disabled={deleteMutation.isPending}
                              className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-red-300 hover:text-red-600 disabled:bg-gray-50 disabled:text-gray-400"
                            >
                              {t("watchlists.deleteCta")}
                            </button>
                          ) : null}
                        </div>
                      </div>

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

                      {updateMutation.isError ? <div className="mt-4"><ApiErrorView error={updateMutation.error} /></div> : null}
                      {deleteMutation.isError ? <div className="mt-4"><ApiErrorView error={deleteMutation.error} /></div> : null}
                      {shareMutation.isError ? <div className="mt-4"><ApiErrorView error={shareMutation.error} /></div> : null}

                      {shareToken ? (
                        <div className="mt-4">
                          <ShareLink token={shareToken} />
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
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
                        </select>
                        <input
                          value={addSymbol}
                          onChange={(e) => setAddSymbol(e.target.value)}
                          placeholder={t("watchlists.addSymbolPlaceholder")}
                          data-testid="watchlists-add-symbol"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                        />
                        <button
                          type="submit"
                          disabled={addMutation.isPending}
                          data-testid="watchlists-add-submit"
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
                    </div>
                  </>
                ) : null}
              </section>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}

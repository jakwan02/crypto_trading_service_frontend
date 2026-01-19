"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { createSavedScreener, deleteSavedScreener, listSavedScreeners, patchSavedScreener, runScreener } from "@/lib/screenersClient";
import type {
  ScreenerDslCond,
  ScreenerDslV1,
  ScreenerMetricField,
  ScreenerOp,
  ScreenerWindow,
  SavedScreener
} from "@/types/screener";

const WINDOWS: ScreenerWindow[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
const METRIC_FIELDS: Array<{ id: ScreenerMetricField; labelKey: string }> = [
  { id: "qv", labelKey: "screener.metricField.qv" },
  { id: "volume", labelKey: "screener.metricField.volume" },
  { id: "pct", labelKey: "screener.metricField.pct" },
  { id: "price", labelKey: "screener.metricField.price" }
];
const OPS: ScreenerOp[] = ["gt", "ge", "lt", "le"];

function defaultDsl(market: "spot" | "um"): ScreenerDslV1 {
  return {
    v: 1,
    market,
    universe: { top_by: "qv", window: "1d", limit: 500 },
    op: "and",
    conds: [],
    sort: { by: "qv", window: "1d", dir: "desc" },
    limit: 200
  };
}

function asNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function ScreenerPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const [market, setMarket] = useState<"spot" | "um">("um");
  const [dsl, setDsl] = useState<ScreenerDslV1>(() => defaultDsl("um"));
  const [selectedSaved, setSelectedSaved] = useState<SavedScreener | null>(null);
  const [saveName, setSaveName] = useState("");
  const [runCursor, setRunCursor] = useState<string | null>(null);

  const savedQ = useQuery({
    queryKey: ["screeners.saved"],
    queryFn: listSavedScreeners
  });

  const runM = useMutation({
    mutationFn: async () => {
      const res = await runScreener({ dsl, cursor: runCursor, limit: 200 });
      return res;
    }
  });

  const saveM = useMutation({
    mutationFn: async () => {
      const name = saveName.trim();
      if (!name) throw new Error("missing_name");
      const res = await createSavedScreener({ name, market, dsl });
      return res;
    },
    onSuccess: async () => {
      setSaveName("");
      await qc.invalidateQueries({ queryKey: ["screeners.saved"] });
    }
  });

  const updateM = useMutation({
    mutationFn: async () => {
      if (!selectedSaved) throw new Error("missing_saved");
      return await patchSavedScreener(selectedSaved.id, { dsl });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["screeners.saved"] });
    }
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => await deleteSavedScreener(id),
    onSuccess: async () => {
      setSelectedSaved(null);
      await qc.invalidateQueries({ queryKey: ["screeners.saved"] });
    }
  });

  const addCond = useCallback(() => {
    const next: ScreenerDslCond = { k: "metric", field: "pct", window: "1d", op: "gt", value: 0 };
    setDsl((prev) => ({ ...prev, conds: [...prev.conds, next] }));
  }, []);

  const items = runM.data?.items ?? [];

  const onSelectSaved = useCallback((s: SavedScreener) => {
    setSelectedSaved(s);
    setMarket((String(s.market || "um") as "spot" | "um") || "um");
    setDsl(s.dsl);
    setRunCursor(null);
  }, []);

  const canRun = useMemo(() => dsl && dsl.v === 1, [dsl]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("screener.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("screener.desc")}</p>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">{t("screener.savedTitle")}</h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSaved(null);
                    setDsl(defaultDsl(market));
                    setRunCursor(null);
                  }}
                  className="text-xs font-semibold text-primary"
                >
                  {t("screener.new")}
                </button>
              </div>

              {savedQ.isLoading ? <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p> : null}
              {savedQ.error ? <ApiErrorView error={savedQ.error} onRetry={() => savedQ.refetch()} /> : null}

              <div className="mt-4 space-y-2">
                {(savedQ.data?.items ?? []).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectSaved(s)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                      selectedSaved?.id === s.id
                        ? "border-primary/30 bg-primary/5 text-primary"
                        : "border-gray-200 bg-gray-50 text-gray-700"
                    }`}
                  >
                    <p className="font-semibold">{s.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{String(s.market || "").toUpperCase()}</p>
                  </button>
                ))}
              </div>

              {selectedSaved ? (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => deleteM.mutate(selectedSaved.id)}
                    className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("screener.delete")}
                  </button>
                  {deleteM.error ? <ApiErrorView error={deleteM.error} onRetry={() => deleteM.mutate(selectedSaved.id)} /> : null}
                </div>
              ) : null}
            </aside>

            <section className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("screener.builderTitle")}</h2>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("screener.market")}</label>
                    <select
                      value={market}
                      onChange={(e) => {
                        const m = e.target.value === "spot" ? "spot" : "um";
                        setMarket(m);
                        setDsl((prev) => ({ ...prev, market: m }));
                      }}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                    >
                      <option value="spot">{t("common.marketSpot")}</option>
                      <option value="um">{t("common.marketUm")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("screener.logic")}</label>
                    <select
                      value={dsl.op}
                      onChange={(e) => setDsl((prev) => ({ ...prev, op: e.target.value === "or" ? "or" : "and" }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                    >
                      <option value="and">{t("screener.logicAnd")}</option>
                      <option value="or">{t("screener.logicOr")}</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">{t("screener.conditions")}</p>
                    <button
                      type="button"
                      onClick={addCond}
                      className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-ink hover:bg-primary-dark"
                    >
                      {t("screener.addCondition")}
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {dsl.conds.length === 0 ? (
                      <p className="text-xs text-gray-500">{t("screener.noConditions")}</p>
                    ) : null}
                    {dsl.conds.map((c, idx) => (
                      <div key={idx} className="rounded-xl border border-gray-200 bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={c.k}
                            onChange={(e) => {
                              const k = e.target.value;
                              let next: ScreenerDslCond = c;
                              if (k === "metric") next = { k: "metric", field: "pct", window: "1d", op: "gt", value: 0 };
                              else if (k === "ind")
                                next = { k: "ind", tf: "1h", name: "rsi14", op: "gt", value: 50 };
                              else if (k === "breakout") next = { k: "breakout", tf: "1h", n: 20, buf_pct: 0 };
                              else next = { k: "vol_spike", tf: "15m", n: 20, ratio: 2, min_vol_sma: 0 };
                              setDsl((prev) => {
                                const copy = [...prev.conds];
                                copy[idx] = next;
                                return { ...prev, conds: copy };
                              });
                            }}
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700"
                          >
                            <option value="metric">{t("screener.cond.metric")}</option>
                            <option value="ind">{t("screener.cond.ind")}</option>
                            <option value="breakout">{t("screener.cond.breakout")}</option>
                            <option value="vol_spike">{t("screener.cond.volSpike")}</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              setDsl((prev) => ({ ...prev, conds: prev.conds.filter((_, i) => i !== idx) }))
                            }
                            className="text-xs font-semibold text-gray-500 hover:text-red-600"
                          >
                            {t("screener.remove")}
                          </button>
                        </div>

                        {c.k === "metric" ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-4">
                            <select
                              value={c.field}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, field: e.target.value as ScreenerMetricField };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {METRIC_FIELDS.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {t(f.labelKey)}
                                </option>
                              ))}
                            </select>
                            <select
                              value={c.window}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, window: e.target.value as ScreenerWindow };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {WINDOWS.map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                            <select
                              value={c.op}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, op: e.target.value as ScreenerOp };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {OPS.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={String(c.value)}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, value: asNum(e.target.value) };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700"
                            />
                          </div>
                        ) : null}

                        {c.k === "ind" ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-4">
                            <select
                              value={c.tf}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, tf: e.target.value as ScreenerWindow };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {WINDOWS.map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                            <select
                              value={c.name}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, name: e.target.value as typeof c.name };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {["rsi14", "macd_hist", "bb_upper", "bb_lower", "bb_mid"].map((n) => (
                                <option key={n} value={n}>
                                  {n}
                                </option>
                              ))}
                            </select>
                            <select
                              value={c.op}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, op: e.target.value as ScreenerOp };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {OPS.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={String(c.value)}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, value: asNum(e.target.value) };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700"
                            />
                          </div>
                        ) : null}

                        {c.k === "breakout" ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-3">
                            <select
                              value={c.tf}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, tf: e.target.value as ScreenerWindow };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {WINDOWS.map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-700">
                              N=20
                            </div>
                            <input
                              type="number"
                              step="0.001"
                              value={String(c.buf_pct)}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, buf_pct: asNum(e.target.value) };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700"
                            />
                          </div>
                        ) : null}

                        {c.k === "vol_spike" ? (
                          <div className="mt-3 grid gap-2 sm:grid-cols-4">
                            <select
                              value={c.tf}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, tf: e.target.value as ScreenerWindow };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-sm text-gray-700"
                            >
                              {WINDOWS.map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-2 text-sm text-gray-700">
                              N=20
                            </div>
                            <input
                              type="number"
                              step="0.1"
                              value={String(c.ratio)}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, ratio: asNum(e.target.value) };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700"
                            />
                            <input
                              type="number"
                              step="0.1"
                              value={String(c.min_vol_sma ?? 0)}
                              onChange={(e) =>
                                setDsl((prev) => {
                                  const copy = [...prev.conds];
                                  const cur = copy[idx] as typeof c;
                                  copy[idx] = { ...cur, min_vol_sma: asNum(e.target.value) };
                                  return { ...prev, conds: copy };
                                })
                              }
                              className="rounded-lg border border-gray-200 px-2 py-2 text-sm text-gray-700"
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder={t("screener.saveNamePlaceholder")}
                    className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                  />
                  <div className="flex gap-2">
                    {selectedSaved ? (
                      <button
                        type="button"
                        onClick={() => updateM.mutate()}
                        className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                      >
                        {t("screener.update")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => saveM.mutate()}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
                    >
                      {t("screener.save")}
                    </button>
                  </div>
                </div>
                {saveM.error ? <ApiErrorView error={saveM.error} onRetry={() => saveM.mutate()} /> : null}
                {updateM.error ? <ApiErrorView error={updateM.error} onRetry={() => updateM.mutate()} /> : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!canRun || runM.isPending}
                    onClick={() => {
                      setRunCursor(null);
                      runM.mutate();
                    }}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                  >
                    {t("screener.run")}
                  </button>
                  {runM.data?.cursor_next ? (
                    <button
                      type="button"
                      onClick={() => {
                        setRunCursor(runM.data?.cursor_next ?? null);
                        runM.mutate();
                      }}
                      className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                    >
                      {t("screener.loadMore")}
                    </button>
                  ) : null}
                </div>
                {runM.error ? <ApiErrorView error={runM.error} onRetry={() => runM.mutate()} /> : null}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("screener.resultsTitle")}</h2>
                <p className="mt-1 text-xs text-gray-500">
                  {t("screener.resultsMeta", { n: items.length, t: runM.data?.meta?.t_server_ms ?? 0 })}
                </p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500">
                        <th className="py-2 pr-3">{t("screener.colSymbol")}</th>
                        <th className="py-2 pr-3">{t("screener.colPrice")}</th>
                        <th className="py-2 pr-3">{t("screener.colPct")}</th>
                        <th className="py-2 pr-3">{t("screener.colQv")}</th>
                        <th className="py-2 pr-3">{t("screener.colVolume")}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {items.map((it) => {
                        const w = String(dsl.universe.window || "1d");
                        const m = it.metrics && it.metrics[w];
                        return (
                          <tr key={it.symbol} className="border-t border-gray-100">
                            <td className="py-2 pr-3 font-semibold text-gray-900">{it.symbol}</td>
                            <td className="py-2 pr-3">{typeof m?.price === "number" ? m.price.toFixed(6) : "-"}</td>
                            <td className="py-2 pr-3">{typeof m?.pct === "number" ? m.pct.toFixed(2) : "-"}</td>
                            <td className="py-2 pr-3">{typeof m?.qv === "number" ? m.qv.toFixed(0) : "-"}</td>
                            <td className="py-2 pr-3">{typeof m?.volume === "number" ? m.volume.toFixed(0) : "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

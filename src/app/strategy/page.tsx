"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import { patchOnboarding } from "@/lib/onboardingClient";
import { createStrategy, createStrategyRun, deleteStrategy, getStrategy, getStrategyRun, listStrategies, patchStrategy } from "@/lib/strategyClient";
import type { StrategyClause, StrategyExpr, StrategyMarket, StrategyTf } from "@/types/strategy";

const TFS: StrategyTf[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];
const MARKETS: Array<{ id: StrategyMarket; labelKey: string }> = [
  { id: "um", labelKey: "common.marketUm" },
  { id: "spot", labelKey: "common.marketSpot" }
];
const IND_FIELDS = [
  "rsi14",
  "macd",
  "macd_signal",
  "macd_hist",
  "bb_mid",
  "bb_upper",
  "bb_lower",
  "donch_high_20",
  "vol_sma_20",
  "vol_ratio_20"
] as const;
const CMPS: Array<StrategyClause["cmp"]> = ["gt", "ge", "lt", "le"];

function parseSymbols(input: string): string[] {
  return String(input || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 200);
}

function joinSymbols(symbols: string[]): string {
  return (symbols || []).join(", ");
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.trunc(Number(value));
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function buildDefaultExpr(kind: "entry" | "exit"): StrategyExpr {
  if (kind === "entry") {
    return { op: "and", clauses: [{ kind: "indicator", name: "rsi14", cmp: "lt", value: 30 }] };
  }
  return { op: "and", clauses: [{ kind: "indicator", name: "rsi14", cmp: "gt", value: 70 }] };
}

function normalizeExpr(raw: StrategyExpr | null | undefined): StrategyExpr {
  const op = String(raw?.op || "and").toLowerCase() === "or" ? "or" : "and";
  const clausesRaw = Array.isArray(raw?.clauses) ? raw?.clauses ?? [] : [];
  const clauses: StrategyClause[] = [];
  for (const c of clausesRaw) {
    if (!c || typeof c !== "object") continue;
    const rec = c as Record<string, unknown>;
    const kind = String(rec.kind || "indicator").toLowerCase() === "price" ? "price" : "indicator";
    const name = kind === "price" ? "close" : String(rec.name || "rsi14").toLowerCase();
    const cmp = CMPS.includes(String(rec.cmp || "").toLowerCase() as StrategyClause["cmp"])
      ? (String(rec.cmp || "").toLowerCase() as StrategyClause["cmp"])
      : "gt";
    const value = Number(rec.value);
    clauses.push({ kind, name, cmp, value: Number.isFinite(value) ? value : 0 });
  }
  return { op, clauses: clauses.length ? clauses : buildDefaultExpr("entry").clauses };
}

function ExprEditor({
  title,
  value,
  onChange
}: {
  title: string;
  value: StrategyExpr;
  onChange: (next: StrategyExpr) => void;
}) {
  const { t } = useTranslation();
  const expr = value;

  const updateClause = useCallback(
    (idx: number, patch: Partial<StrategyClause>) => {
      const next = { ...expr, clauses: expr.clauses.map((c, i) => (i === idx ? { ...c, ...patch } : c)) };
      onChange(next);
    },
    [expr, onChange]
  );

  const addClause = useCallback(() => {
    const next: StrategyExpr = {
      ...expr,
      clauses: expr.clauses.concat({ kind: "indicator", name: "rsi14", cmp: "gt", value: 50 })
    };
    onChange(next);
  }, [expr, onChange]);

  const removeClause = useCallback(
    (idx: number) => {
      const nextClauses = expr.clauses.filter((_, i) => i !== idx);
      const next = { ...expr, clauses: nextClauses.length ? nextClauses : buildDefaultExpr("entry").clauses };
      onChange(next);
    },
    [expr, onChange]
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">{title}</p>
        <div className="flex items-center gap-2">
          <select
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
            value={String(expr.op || "and")}
            onChange={(e) => onChange({ ...expr, op: e.target.value === "or" ? "or" : "and" })}
          >
            <option value="and">{t("strategy.op.and")}</option>
            <option value="or">{t("strategy.op.or")}</option>
          </select>
          <button
            type="button"
            onClick={addClause}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
          >
            {t("strategy.addClause")}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {expr.clauses.map((c, idx) => (
          <div key={idx} className="grid gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 md:grid-cols-[0.9fr_1.2fr_0.7fr_0.9fr_auto]">
            <select
              value={String(c.kind)}
              onChange={(e) => {
                const k = e.target.value === "price" ? "price" : "indicator";
                updateClause(idx, { kind: k, name: k === "price" ? "close" : "rsi14" });
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700"
            >
              <option value="indicator">{t("strategy.kind.indicator")}</option>
              <option value="price">{t("strategy.kind.price")}</option>
            </select>

            {c.kind === "price" ? (
              <input
                value="close"
                readOnly
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-500"
              />
            ) : (
              <select
                value={String(c.name)}
                onChange={(e) => updateClause(idx, { name: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700"
              >
                {IND_FIELDS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            )}

            <select
              value={String(c.cmp)}
              onChange={(e) => updateClause(idx, { cmp: e.target.value as StrategyClause["cmp"] })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700"
            >
              {CMPS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>

            <input
              type="number"
              value={Number.isFinite(c.value) ? String(c.value) : "0"}
              onChange={(e) => updateClause(idx, { value: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700"
            />

            <button
              type="button"
              onClick={() => removeClause(idx)}
              className="rounded-full px-2 py-1 text-xs font-semibold text-gray-500 hover:text-red-600"
            >
              {t("strategy.remove")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StrategyPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const listQ = useQuery({ queryKey: ["strategies"], queryFn: listStrategies, staleTime: 10_000 });
  const items = useMemo(() => listQ.data?.items ?? [], [listQ.data?.items]);

  const [selectedId, setSelectedId] = useState<string>("");
  useEffect(() => {
    if (selectedId) return;
    const first = items[0]?.id;
    if (!first) return;
    queueMicrotask(() => setSelectedId(String(first)));
  }, [items, selectedId]);

  const detailQ = useQuery({
    queryKey: ["strategy", selectedId],
    queryFn: () => getStrategy(selectedId),
    enabled: Boolean(selectedId),
    staleTime: 10_000
  });

  const [draftName, setDraftName] = useState("");
  const [draftMarket, setDraftMarket] = useState<StrategyMarket>("um");
  const [draftTf, setDraftTf] = useState<StrategyTf>("1h");
  const [draftSymbolsText, setDraftSymbolsText] = useState("BTCUSDT,ETHUSDT");
  const [draftEntry, setDraftEntry] = useState<StrategyExpr>(() => buildDefaultExpr("entry"));
  const [draftExit, setDraftExit] = useState<StrategyExpr>(() => buildDefaultExpr("exit"));

  const [mode, setMode] = useState<"create" | "edit">("create");

  useEffect(() => {
    if (!detailQ.data) return;
    const s = detailQ.data;
    setMode("edit");
    queueMicrotask(() => {
      setDraftName(String(s.name || ""));
      setDraftMarket(String(s.market || "um") as StrategyMarket);
      setDraftTf(String(s.tf || "1h") as StrategyTf);
      setDraftSymbolsText(joinSymbols((s.universe?.symbols ?? []) as string[]));
      setDraftEntry(normalizeExpr(s.entry));
      setDraftExit(normalizeExpr(s.exit));
    });
  }, [detailQ.data]);

  const symbols = useMemo(() => parseSymbols(draftSymbolsText), [draftSymbolsText]);

  const createM = useMutation({
    mutationFn: async () => {
      return await createStrategy({
        name: String(draftName || "").trim() || "Strategy",
        market: draftMarket,
        tf: draftTf,
        universe: { symbols },
        entry: normalizeExpr(draftEntry),
        exit: normalizeExpr(draftExit)
      });
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ["strategies"] });
      const id = String(res.id || "").trim();
      if (id) setSelectedId(id);
      try {
        await patchOnboarding({ step: { strategy_created: true } });
      } catch {
        // ignore (best-effort)
      }
    }
  });

  const saveM = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("missing_strategy_id");
      return await patchStrategy(selectedId, {
        name: String(draftName || "").trim() || "Strategy",
        tf: draftTf,
        universe: { symbols },
        entry: normalizeExpr(draftEntry),
        exit: normalizeExpr(draftExit)
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["strategies"] });
      await qc.invalidateQueries({ queryKey: ["strategy", selectedId] });
    }
  });

  const deleteM = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("missing_strategy_id");
      return await deleteStrategy(selectedId);
    },
    onSuccess: async () => {
      const prev = selectedId;
      setSelectedId("");
      await qc.invalidateQueries({ queryKey: ["strategies"] });
      await qc.invalidateQueries({ queryKey: ["strategy", prev] });
    }
  });

  const [runDays, setRunDays] = useState(30);
  const [runId, setRunId] = useState<string>("");
  const runCreateM = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("missing_strategy_id");
      return await createStrategyRun(selectedId, { days: clampInt(runDays, 1, 3650, 30) });
    },
    onSuccess: (res) => {
      const id = String(res.id || "").trim();
      if (id) setRunId(id);
    }
  });

  const runQ = useQuery({
    queryKey: ["strategyRun", runId],
    queryFn: () => getStrategyRun(runId),
    enabled: Boolean(runId),
    refetchInterval: (q) => {
      const status = String(q.state.data?.status || "");
      if (status === "queued" || status === "running") return 2000;
      return false;
    }
  });

  const runStatus = String(runQ.data?.status || "");
  const trades = runQ.data?.trades ?? [];

  const startCreate = useCallback(() => {
    setMode("create");
    setSelectedId("");
    setRunId("");
    queueMicrotask(() => {
      setDraftName("");
      setDraftMarket("um");
      setDraftTf("1h");
      setDraftSymbolsText("BTCUSDT,ETHUSDT");
      setDraftEntry(buildDefaultExpr("entry"));
      setDraftExit(buildDefaultExpr("exit"));
    });
  }, []);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("strategy.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("strategy.desc")}</p>
          </header>

          {listQ.error ? <ApiErrorView error={listQ.error} onRetry={() => listQ.refetch()} /> : null}
          {detailQ.error ? <ApiErrorView error={detailQ.error} onRetry={() => detailQ.refetch()} /> : null}
          {(createM.error || saveM.error || deleteM.error || runCreateM.error || runQ.error) ? (
            <ApiErrorView error={createM.error || saveM.error || deleteM.error || runCreateM.error || runQ.error} />
          ) : null}

          <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
            <aside className="space-y-4">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-900">{t("strategy.listTitle")}</h2>
                  <button
                    type="button"
                    onClick={startCreate}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("strategy.new")}
                  </button>
                </div>

                <div className="mt-4 space-y-2">
                  {(items ?? []).map((s) => {
                    const id = String(s.id || "");
                    const isActive = id && id === selectedId;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setMode("edit");
                          setRunId("");
                          setSelectedId(id);
                        }}
                        className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                          isActive ? "border-primary/30 bg-primary/5" : "border-gray-200 bg-white hover:border-primary/30"
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{String(s.name || "Strategy")}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {String(s.market || "").toUpperCase()} · {String(s.tf || "")} · {(s.universe?.symbols ?? []).length} {t("strategy.symbols")}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {!items.length && !listQ.isLoading ? <p className="mt-4 text-sm text-gray-500">{t("strategy.empty")}</p> : null}
              </div>
            </aside>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-sm font-semibold text-gray-900">{mode === "create" ? t("strategy.createTitle") : t("strategy.editTitle")}</h2>
                {mode === "edit" ? (
                  <button type="button" onClick={() => deleteM.mutate()} className="text-xs font-semibold text-gray-500 hover:text-red-600">
                    {t("strategy.delete")}
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">{t("strategy.fieldName")}</span>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder={t("strategy.namePlaceholder")}
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">{t("strategy.fieldTf")}</span>
                  <select
                    value={String(draftTf)}
                    onChange={(e) => setDraftTf(e.target.value as StrategyTf)}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    {TFS.map((tf) => (
                      <option key={String(tf)} value={String(tf)}>
                        {String(tf)}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-semibold text-gray-600">{t("strategy.fieldMarket")}</span>
                  <select
                    value={String(draftMarket)}
                    onChange={(e) => setDraftMarket(e.target.value as StrategyMarket)}
                    disabled={mode === "edit"}
                    className={`mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm ${
                      mode === "edit" ? "text-gray-400" : "text-gray-700"
                    }`}
                  >
                    {MARKETS.map((m) => (
                      <option key={String(m.id)} value={String(m.id)}>
                        {t(m.labelKey)}
                      </option>
                    ))}
                  </select>
                  {mode === "edit" ? <p className="mt-1 text-xs text-gray-400">{t("strategy.marketLocked")}</p> : null}
                </label>

                <label className="block md:col-span-2">
                  <span className="text-xs font-semibold text-gray-600">{t("strategy.fieldUniverse")}</span>
                  <input
                    value={draftSymbolsText}
                    onChange={(e) => setDraftSymbolsText(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    placeholder={t("strategy.symbolsPlaceholder")}
                  />
                  <p className="mt-1 text-xs text-gray-500">{t("strategy.universeHint", { n: symbols.length })}</p>
                </label>
              </div>

              <div className="mt-6 grid gap-4">
                <ExprEditor title={t("strategy.entryTitle")} value={draftEntry} onChange={setDraftEntry} />
                <ExprEditor title={t("strategy.exitTitle")} value={draftExit} onChange={setDraftExit} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {mode === "create" ? (
                  <button
                    type="button"
                    onClick={() => createM.mutate()}
                    disabled={createM.isPending || symbols.length === 0}
                    className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                  >
                    {t("strategy.create")}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => saveM.mutate()}
                    disabled={saveM.isPending || !selectedId || symbols.length === 0}
                    className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
                  >
                    {t("strategy.save")}
                  </button>
                )}
              </div>

              <div className="mt-8 rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t("strategy.runTitle")}</p>
                    <p className="mt-1 text-xs text-gray-500">{t("strategy.runDesc")}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={String(runDays)}
                      onChange={(e) => setRunDays(clampInt(e.target.value, 1, 3650, 30))}
                      className="w-28 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    />
                    <button
                      type="button"
                      onClick={() => runCreateM.mutate()}
                      disabled={!selectedId || runCreateM.isPending}
                      className="inline-flex rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
                    >
                      {t("strategy.run")}
                    </button>
                  </div>
                </div>

                {runId ? (
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-500">
                        {t("strategy.runId")}: <span className="font-mono text-[11px] text-gray-700">{runId}</span>
                      </p>
                      <p className="text-xs font-semibold text-gray-700">
                        {t("strategy.status")}: {runStatus || "-"}
                      </p>
                    </div>

                    {runQ.data?.err ? <p className="mt-2 text-xs text-red-600">{t("strategy.runError")}</p> : null}

                    <div className="mt-3 overflow-x-auto">
                      <table className="min-w-full text-left text-xs">
                        <thead className="text-gray-500">
                          <tr>
                            <th className="px-2 py-2">{t("strategy.colSymbol")}</th>
                            <th className="px-2 py-2">{t("strategy.colEntry")}</th>
                            <th className="px-2 py-2">{t("strategy.colExit")}</th>
                            <th className="px-2 py-2">{t("strategy.colPnl")}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {trades.slice(0, 200).map((tr, idx) => {
                            const entryTs = new Date(Number(tr.entry_ts_ms || 0));
                            const exitTs = tr.exit_ts_ms ? new Date(Number(tr.exit_ts_ms)) : null;
                            const entryText = Number.isFinite(entryTs.getTime()) ? entryTs.toLocaleString() : "-";
                            const exitText = exitTs && Number.isFinite(exitTs.getTime()) ? exitTs.toLocaleString() : "-";
                            const pnl = typeof tr.pnl_pct === "number" ? tr.pnl_pct : NaN;
                            const pnlText = Number.isFinite(pnl) ? `${pnl.toFixed(2)}%` : "-";
                            return (
                              <tr key={`${String(tr.symbol)}:${idx}`} className="text-gray-700">
                                <td className="px-2 py-2 font-semibold text-gray-900 whitespace-nowrap">{String(tr.symbol || "")}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{entryText}</td>
                                <td className="px-2 py-2 whitespace-nowrap">{exitText}</td>
                                <td className={`px-2 py-2 whitespace-nowrap font-semibold ${pnl >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                  {pnlText}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {runQ.isFetching ? <p className="mt-3 text-sm text-gray-500">{t("strategy.running")}</p> : null}
                  </div>
                ) : null}
              </div>

              {(listQ.isLoading || detailQ.isLoading) ? <p className="mt-4 text-sm text-gray-500">{t("common.loading")}</p> : null}
            </section>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

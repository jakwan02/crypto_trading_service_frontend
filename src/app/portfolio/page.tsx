"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import {
  createPortfolioCash,
  createPortfolioTx,
  deletePortfolioCash,
  deletePortfolioTx,
  getPortfolio,
  getPortfolioPerf,
  listPortfolioCash,
  listPortfolioTx
} from "@/lib/portfolioClient";
import type { PortfolioCashCreateRequest, PortfolioTxCreateRequest } from "@/types/portfolio";

function asNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function PortfolioPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const portfolioQ = useQuery({ queryKey: ["portfolio"], queryFn: getPortfolio });
  const perfQ = useQuery({ queryKey: ["portfolio.perf"], queryFn: getPortfolioPerf });
  const txQ = useQuery({
    queryKey: ["portfolio.tx"],
    queryFn: () => listPortfolioTx(null, 50)
  });
  const cashQ = useQuery({
    queryKey: ["portfolio.cash"],
    queryFn: () => listPortfolioCash(null, 50)
  });

  const [txForm, setTxForm] = useState<PortfolioTxCreateRequest>({
    market: "um",
    symbol: "BTCUSDT",
    pos_side: "long",
    side: "buy",
    qty: 0.001,
    price: 0,
    leverage: 1,
    fee: 0,
    slip: 0,
    funding: 0,
    note: ""
  });
  const [cashForm, setCashForm] = useState<PortfolioCashCreateRequest>({
    ccy: "USD",
    direction: "deposit",
    amount: 0,
    note: ""
  });

  const createTxM = useMutation({
    mutationFn: async () => await createPortfolioTx(txForm),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["portfolio"] }),
        qc.invalidateQueries({ queryKey: ["portfolio.tx"] }),
        qc.invalidateQueries({ queryKey: ["portfolio.perf"] })
      ]);
    }
  });
  const deleteTxM = useMutation({
    mutationFn: async (id: string) => await deletePortfolioTx(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["portfolio"] }),
        qc.invalidateQueries({ queryKey: ["portfolio.tx"] }),
        qc.invalidateQueries({ queryKey: ["portfolio.perf"] })
      ]);
    }
  });

  const createCashM = useMutation({
    mutationFn: async () => await createPortfolioCash(cashForm),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["portfolio.cash"] }),
        qc.invalidateQueries({ queryKey: ["portfolio.perf"] })
      ]);
    }
  });
  const deleteCashM = useMutation({
    mutationFn: async (id: string) => await deletePortfolioCash(id),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["portfolio.cash"] }),
        qc.invalidateQueries({ queryKey: ["portfolio.perf"] })
      ]);
    }
  });

  const baseCcy = portfolioQ.data?.base_ccy || perfQ.data?.base_ccy || "USD";
  const equityLatest = useMemo(() => {
    const curve = perfQ.data?.equity_curve ?? [];
    if (!curve.length) return null;
    return curve[curve.length - 1]?.equity ?? null;
  }, [perfQ.data?.equity_curve]);

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("portfolio.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("portfolio.desc")}</p>
          </header>

          {(portfolioQ.error || perfQ.error) ? (
            <ApiErrorView error={portfolioQ.error || perfQ.error} onRetry={() => { void portfolioQ.refetch(); void perfQ.refetch(); }} />
          ) : null}

          <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t("portfolio.baseCcy")}</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">{baseCcy}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t("portfolio.equity")}</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {typeof equityLatest === "number" ? equityLatest.toFixed(2) : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t("portfolio.mdd")}</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {typeof perfQ.data?.risk?.mdd === "number" ? `${(perfQ.data?.risk?.mdd * 100).toFixed(2)}%` : "-"}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-gray-500">{t("portfolio.sharpe")}</p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {typeof perfQ.data?.risk?.sharpe === "number" ? perfQ.data?.risk?.sharpe.toFixed(2) : "-"}
              </p>
            </div>
          </section>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("portfolio.positions")}</h2>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="text-xs font-semibold text-gray-500">
                        <th className="py-2 pr-3">{t("portfolio.colSymbol")}</th>
                        <th className="py-2 pr-3">{t("portfolio.colSide")}</th>
                        <th className="py-2 pr-3">{t("portfolio.colQty")}</th>
                        <th className="py-2 pr-3">{t("portfolio.colAvg")}</th>
                        <th className="py-2 pr-3">{t("portfolio.colMark")}</th>
                        <th className="py-2 pr-3">{t("portfolio.colPnl")}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-700">
                      {(portfolioQ.data?.positions ?? []).map((p) => (
                        <tr key={`${p.market}:${p.symbol}:${p.pos_side}`} className="border-t border-gray-100">
                          <td className="py-2 pr-3 font-semibold text-gray-900">{p.symbol}</td>
                          <td className="py-2 pr-3">{String(p.pos_side || "").toUpperCase()}</td>
                          <td className="py-2 pr-3">{Number(p.qty_open || 0).toFixed(6)}</td>
                          <td className="py-2 pr-3">{typeof p.avg_entry === "number" ? p.avg_entry.toFixed(6) : "-"}</td>
                          <td className="py-2 pr-3">{typeof p.mark === "number" ? p.mark.toFixed(6) : "-"}</td>
                          <td className="py-2 pr-3">{typeof p.net_pnl_quote === "number" ? p.net_pnl_quote.toFixed(2) : "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {portfolioQ.isLoading ? <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p> : null}
                </div>
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("portfolio.assumptionsTitle")}</h2>
                <p className="mt-2 text-sm text-gray-600">{t("portfolio.assumptionsDesc")}</p>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("portfolio.addTx")}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldMarket")}</label>
                    <select
                      value={String(txForm.market || "um")}
                      onChange={(e) => setTxForm((p) => ({ ...p, market: e.target.value as "spot" | "um" }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="spot">{t("common.marketSpot")}</option>
                      <option value="um">{t("common.marketUm")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldSymbol")}</label>
                    <input
                      value={String(txForm.symbol || "")}
                      onChange={(e) => setTxForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldPosSide")}</label>
                    <select
                      value={String(txForm.pos_side || "long")}
                      onChange={(e) => setTxForm((p) => ({ ...p, pos_side: e.target.value as "long" | "short" }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="long">LONG</option>
                      <option value="short">SHORT</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldSide")}</label>
                    <select
                      value={String(txForm.side || "buy")}
                      onChange={(e) => setTxForm((p) => ({ ...p, side: e.target.value as "buy" | "sell" }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="buy">BUY</option>
                      <option value="sell">SELL</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldQty")}</label>
                    <input
                      type="number"
                      value={String(txForm.qty)}
                      onChange={(e) => setTxForm((p) => ({ ...p, qty: asNum(e.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldPrice")}</label>
                    <input
                      type="number"
                      value={String(txForm.price)}
                      onChange={(e) => setTxForm((p) => ({ ...p, price: asNum(e.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldLeverage")}</label>
                    <input
                      type="number"
                      value={String(txForm.leverage ?? 1)}
                      onChange={(e) => setTxForm((p) => ({ ...p, leverage: asNum(e.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldFee")}</label>
                    <input
                      type="number"
                      value={String(txForm.fee ?? 0)}
                      onChange={(e) => setTxForm((p) => ({ ...p, fee: asNum(e.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldNote")}</label>
                    <input
                      value={String(txForm.note || "")}
                      onChange={(e) => setTxForm((p) => ({ ...p, note: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => createTxM.mutate()}
                  className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
                >
                  {t("portfolio.submitTx")}
                </button>
                {createTxM.error ? <ApiErrorView error={createTxM.error} onRetry={() => createTxM.mutate()} /> : null}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("portfolio.cashTitle")}</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.cashDirection")}</label>
                    <select
                      value={String(cashForm.direction)}
                      onChange={(e) => setCashForm((p) => ({ ...p, direction: e.target.value as "deposit" | "withdraw" }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      <option value="deposit">{t("portfolio.cashDeposit")}</option>
                      <option value="withdraw">{t("portfolio.cashWithdraw")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.cashAmount")}</label>
                    <input
                      type="number"
                      value={String(cashForm.amount)}
                      onChange={(e) => setCashForm((p) => ({ ...p, amount: asNum(e.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">{t("portfolio.fieldNote")}</label>
                    <input
                      value={String(cashForm.note || "")}
                      onChange={(e) => setCashForm((p) => ({ ...p, note: e.target.value }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => createCashM.mutate()}
                  className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
                >
                  {t("portfolio.submitCash")}
                </button>
                {createCashM.error ? <ApiErrorView error={createCashM.error} onRetry={() => createCashM.mutate()} /> : null}
              </div>
            </aside>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("portfolio.txHistory")}</h2>
              {txQ.error ? <ApiErrorView error={txQ.error} onRetry={() => txQ.refetch()} /> : null}
              <div className="mt-4 space-y-2">
                {(txQ.data?.items ?? []).map((tx) => (
                  <div key={tx.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">{tx.symbol}</p>
                      <button
                        type="button"
                        onClick={() => deleteTxM.mutate(tx.id)}
                        className="text-xs font-semibold text-gray-500 hover:text-red-600"
                      >
                        {t("portfolio.delete")}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {String(tx.market).toUpperCase()} · {String(tx.pos_side).toUpperCase()} · {String(tx.qty)} @ {String(tx.price)}
                    </p>
                  </div>
                ))}
              </div>
              {deleteTxM.error ? <ApiErrorView error={deleteTxM.error} onRetry={() => {}} /> : null}
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("portfolio.cashHistory")}</h2>
              {cashQ.error ? <ApiErrorView error={cashQ.error} onRetry={() => cashQ.refetch()} /> : null}
              <div className="mt-4 space-y-2">
                {(cashQ.data?.items ?? []).map((c) => (
                  <div key={c.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900">
                        {String(c.direction).toUpperCase()} · {Number(c.amount || 0).toFixed(2)} {String(c.ccy || "")}
                      </p>
                      <button
                        type="button"
                        onClick={() => deleteCashM.mutate(c.id)}
                        className="text-xs font-semibold text-gray-500 hover:text-red-600"
                      >
                        {t("portfolio.delete")}
                      </button>
                    </div>
                    {c.note ? <p className="mt-1 text-xs text-gray-500">{c.note}</p> : null}
                  </div>
                ))}
              </div>
              {deleteCashM.error ? <ApiErrorView error={deleteCashM.error} onRetry={() => {}} /> : null}
            </section>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

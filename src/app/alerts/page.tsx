"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import ApiErrorView from "@/components/common/ApiErrorView";
import PushGate from "@/components/push/PushGate";
import TelegramGate from "@/components/telegram/TelegramGate";
import { createAlertRule, deleteAlertRule, listAlertEvents, listAlertRules, patchAlertRule } from "@/lib/alertsClient";
import type { AlertRuleCreateRequest, AlertWindow } from "@/types/alerts";

const WINDOWS: AlertWindow[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

function asNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function AlertsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const rulesQ = useQuery({ queryKey: ["alerts.rules"], queryFn: listAlertRules });
  const eventsQ = useInfiniteQuery({
    queryKey: ["alerts.events"],
    queryFn: ({ pageParam }) => listAlertEvents((pageParam as string | null | undefined) ?? null, 50),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.cursor_next ?? undefined
  });

  const [form, setForm] = useState<AlertRuleCreateRequest>({
    market: "um",
    symbol: "BTCUSDT",
    type: "pct",
    window: "1h",
    op: "gt",
    value: 5,
    ind_name: "rsi14",
    repeat: "cooldown",
    cooldown_sec: 600,
    channels: { push: true, email: false, telegram: false },
    is_active: true
  });

  const createM = useMutation({
    mutationFn: async () => await createAlertRule(form),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["alerts.rules"] });
    }
  });

  const toggleM = useMutation({
    mutationFn: async (arg: { id: string; is_active: boolean }) => await patchAlertRule(arg.id, { is_active: arg.is_active }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["alerts.rules"] });
    }
  });

  const deleteM = useMutation({
    mutationFn: async (id: string) => await deleteAlertRule(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["alerts.rules"] });
    }
  });

  const showWindow = form.type !== "price";
  const showIndicator = form.type === "indicator";
  const showCooldown = form.repeat !== "once";

  const channelOk = !!(form.channels?.push || form.channels?.email || form.channels?.telegram);

  const rules = useMemo(() => rulesQ.data?.items ?? [], [rulesQ.data?.items]);
  const events = useMemo(
    () => (eventsQ.data?.pages ?? []).flatMap((p) => (p.items ?? []) as Array<Record<string, unknown>>),
    [eventsQ.data?.pages]
  );

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("alerts.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("alerts.desc")}</p>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <PushGate />
            <TelegramGate />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("alerts.newRule")}</h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldMarket")}</label>
                  <select
                    value={String(form.market || "um")}
                    onChange={(e) => setForm((p) => ({ ...p, market: e.target.value as "spot" | "um" }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="spot">{t("common.marketSpot")}</option>
                    <option value="um">{t("common.marketUm")}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldSymbol")}</label>
                  <input
                    value={String(form.symbol || "")}
                    onChange={(e) => setForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldType")}</label>
                  <select
                    value={String(form.type)}
                    onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as AlertRuleCreateRequest["type"] }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="price">{t("alerts.type.price")}</option>
                    <option value="pct">{t("alerts.type.pct")}</option>
                    <option value="volume">{t("alerts.type.volume")}</option>
                    <option value="indicator">{t("alerts.type.indicator")}</option>
                  </select>
                </div>
                {showWindow ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldWindow")}</label>
                    <select
                      value={String(form.window || "1h")}
                      onChange={(e) => setForm((p) => ({ ...p, window: e.target.value as AlertWindow }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      {WINDOWS.map((w) => (
                        <option key={w} value={w}>
                          {w}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldOp")}</label>
                  <select
                    value={String(form.op)}
                    onChange={(e) => setForm((p) => ({ ...p, op: e.target.value as AlertRuleCreateRequest["op"] }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    {["gt", "ge", "lt", "le", "cross_up", "cross_down"].map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldValue")}</label>
                  <input
                    type="number"
                    value={String(form.value)}
                    onChange={(e) => setForm((p) => ({ ...p, value: asNum(e.target.value) }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>

                {showIndicator ? (
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldIndicator")}</label>
                    <select
                      value={String(form.ind_name || "rsi14")}
                      onChange={(e) => setForm((p) => ({ ...p, ind_name: e.target.value as AlertRuleCreateRequest["ind_name"] }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      {["rsi14", "macd_hist", "bb_upper", "bb_lower", "bb_mid"].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldRepeat")}</label>
                  <select
                    value={String(form.repeat || "cooldown")}
                    onChange={(e) => setForm((p) => ({ ...p, repeat: e.target.value as AlertRuleCreateRequest["repeat"] }))}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <option value="once">{t("alerts.repeat.once")}</option>
                    <option value="cooldown">{t("alerts.repeat.cooldown")}</option>
                  </select>
                </div>
                {showCooldown ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldCooldownSec")}</label>
                    <input
                      type="number"
                      value={String(form.cooldown_sec ?? 600)}
                      onChange={(e) => setForm((p) => ({ ...p, cooldown_sec: asNum(e.target.value) }))}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </div>
                ) : null}

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">{t("alerts.fieldChannels")}</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(["push", "email", "telegram"] as const).map((ch) => (
                      <label
                        key={ch}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                          (form.channels?.[ch] ? true : false) ? "border-primary/30 bg-primary/5 text-primary" : "border-gray-200 bg-gray-50 text-gray-600"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={!!form.channels?.[ch]}
                          onChange={(e) =>
                            setForm((p) => ({
                              ...p,
                              channels: { ...(p.channels || {}), [ch]: e.target.checked }
                            }))
                          }
                        />
                        {t(`alerts.channel.${ch}`)}
                      </label>
                    ))}
                  </div>
                  {!channelOk ? <p className="mt-2 text-xs text-red-600">{t("alerts.channelsRequired")}</p> : null}
                </div>
              </div>

              <button
                type="button"
                disabled={!channelOk || createM.isPending}
                onClick={() => createM.mutate()}
                data-testid="alerts-create"
                className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
              >
                {t("alerts.create")}
              </button>
              {createM.error ? <ApiErrorView error={createM.error} onRetry={() => createM.mutate()} /> : null}
            </section>

            <aside className="space-y-6">
              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("alerts.rules")}</h2>
                {rulesQ.error ? <ApiErrorView error={rulesQ.error} onRetry={() => rulesQ.refetch()} /> : null}
                <div className="mt-4 space-y-2 text-sm text-gray-700" data-testid="alerts-rules">
                  {rules.map((r) => (
                    <div key={r.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900">{r.symbol}</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleM.mutate({ id: r.id, is_active: !r.is_active })}
                            className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                              r.is_active ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {r.is_active ? t("alerts.on") : t("alerts.off")}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteM.mutate(r.id)}
                            className="text-xs font-semibold text-gray-500 hover:text-red-600"
                          >
                            {t("alerts.delete")}
                          </button>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {String(r.market).toUpperCase()} · {r.type}
                        {r.window ? `(${r.window})` : ""} · {r.op} {r.value}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {Object.entries(r.channels || {})
                          .filter(([, v]) => !!v)
                          .map(([k]) => k)
                          .join(", ")}
                        {r.repeat === "cooldown" ? ` · cooldown=${r.cooldown_sec}s` : " · once"}
                      </p>
                    </div>
                  ))}
                </div>
                {(toggleM.error || deleteM.error) ? <ApiErrorView error={toggleM.error || deleteM.error} /> : null}
              </div>

              <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("alerts.history")}</h2>
                {eventsQ.error ? <ApiErrorView error={eventsQ.error} onRetry={() => eventsQ.refetch()} /> : null}
                <div className="mt-4 space-y-2">
                  {events.map((ev) => (
                    <div key={String(ev.id)} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <p className="font-semibold text-gray-900">{String(ev.symbol || "")}</p>
                      <p className="mt-1">
                        {String(ev.type || "")} {String(ev.window || "")} · {String(ev.channel || "")} · {String(ev.status || "")}
                      </p>
                    </div>
                  ))}
                </div>
                {eventsQ.isLoading ? <p className="mt-3 text-sm text-gray-500">{t("common.loading")}</p> : null}
                {eventsQ.hasNextPage ? (
                  <button
                    type="button"
                    onClick={() => eventsQ.fetchNextPage()}
                    className="mt-4 w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
                  >
                    {t("alerts.loadMore")}
                  </button>
                ) : null}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

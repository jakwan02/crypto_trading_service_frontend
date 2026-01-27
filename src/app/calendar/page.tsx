"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { useAuth } from "@/contexts/AuthContext";
import { getCalendarSubscription, listPublicCalendar, putCalendarSubscription } from "@/lib/calendarClient";

export default function CalendarPage() {
  const { t } = useTranslation();
  const { user, sessionReady } = useAuth();
  const qc = useQueryClient();

  const [type, setType] = useState("");
  const [market, setMarket] = useState("");
  const [symbol, setSymbol] = useState("");

  const eventsQ = useQuery({
    queryKey: ["calendar.events", type, market, symbol],
    queryFn: async () =>
      await listPublicCalendar({ from: null, to: null, type: type || null, market: market || null, symbol: symbol || null, limit: 200 })
  });

  const subQ = useQuery({
    queryKey: ["calendar.subscription"],
    queryFn: getCalendarSubscription,
    enabled: Boolean(user)
  });

  const persistedEmailEnabled = useMemo(() => {
    const ch = subQ.data?.subscription?.channels;
    if (!ch || typeof ch !== "object") return true;
    const rec = ch as Record<string, unknown>;
    if (typeof rec.email === "boolean") return rec.email;
    return true;
  }, [subQ.data?.subscription?.channels]);
  const persistedCooldownSec = useMemo(() => {
    const v = Number(subQ.data?.subscription?.cooldown_sec ?? 300);
    return Number.isFinite(v) && v >= 0 ? v : 300;
  }, [subQ.data?.subscription?.cooldown_sec]);

  const [emailEnabled, setEmailEnabled] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const emailValue = emailTouched ? emailEnabled : persistedEmailEnabled;

  const [cooldownSec, setCooldownSec] = useState(300);
  const [cooldownTouched, setCooldownTouched] = useState(false);
  const cooldownValue = cooldownTouched ? cooldownSec : persistedCooldownSec;

  const saveSubM = useMutation({
    mutationFn: async () =>
      await putCalendarSubscription({
        filters: {
          ...(type ? { types: [type] } : {}),
          ...(market ? { markets: [market] } : {}),
          ...(symbol ? { symbols: [symbol.toUpperCase()] } : {})
        },
        channels: { email: emailValue },
        cooldown_sec: cooldownValue
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["calendar.subscription"] });
    }
  });

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("calendar.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("calendar.desc")}</p>
        </header>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">{t("calendar.filters")}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("calendar.type")}</label>
              <input value={type} onChange={(e) => setType(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" placeholder="economic" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("calendar.market")}</label>
              <input
                value={market}
                onChange={(e) => {
                  const v = String(e.target.value || "").trim().toLowerCase();
                  // 변경 이유: cm 마켓은 관리 심볼이 아니므로 필터로도 입력되지 않게 한다.
                  setMarket(v === "cm" ? "" : v);
                }}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                placeholder="spot|um"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("calendar.symbol")}</label>
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700" placeholder="BTCUSDT" />
            </div>
          </div>
          {eventsQ.isError ? <div className="mt-4"><ApiErrorView error={eventsQ.error} onRetry={() => eventsQ.refetch()} /></div> : null}
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">{t("calendar.events")}</h2>
          <div className="mt-4 space-y-2">
            {(eventsQ.data?.items ?? []).length === 0 && !eventsQ.isFetching ? <p className="text-sm text-gray-500">{t("calendar.empty")}</p> : null}
            {(eventsQ.data?.items ?? []).map((ev) => (
              <div key={ev.id} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{ev.title}</p>
                  <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-700">{ev.type}</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {ev.start_at ?? "—"} {ev.market ? `· ${ev.market}` : ""} {ev.symbol ? `· ${ev.symbol}` : ""} · {t("calendar.importance")}: {ev.importance}
                </p>
                {ev.body_md ? <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{ev.body_md}</p> : null}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">{t("calendar.subscribe")}</h2>
          {!sessionReady ? (
            <p className="mt-2 text-sm text-gray-500">{t("common.loading")}</p>
          ) : !user ? (
            <p className="mt-2 text-sm text-gray-500">{t("calendar.loginToSubscribe")}</p>
          ) : (
            <>
              {subQ.isError ? <div className="mt-4"><ApiErrorView error={subQ.error} onRetry={() => subQ.refetch()} /></div> : null}
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{t("calendar.channelEmail")}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={emailValue}
                      onChange={(e) => {
                        setEmailTouched(true);
                        setEmailEnabled(e.target.checked);
                      }}
                      className="h-4 w-4"
                    />
                    <span className="text-sm text-gray-700">{emailValue ? t("calendar.enabled") : t("calendar.disabled")}</span>
                  </div>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500">{t("calendar.cooldownSec")}</p>
                  <input
                    type="number"
                    value={cooldownValue}
                    onChange={(e) => {
                      setCooldownTouched(true);
                      setCooldownSec(Number(e.target.value));
                    }}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>
              </div>
              {saveSubM.isError ? <div className="mt-4"><ApiErrorView error={saveSubM.error} /></div> : null}
              <button
                type="button"
                disabled={saveSubM.isPending}
                onClick={() => saveSubM.mutate()}
                className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark disabled:opacity-60"
              >
                {t("calendar.saveSubscription")}
              </button>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

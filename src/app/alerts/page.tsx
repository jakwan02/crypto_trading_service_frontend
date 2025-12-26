"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";
import { useAuth } from "@/contexts/AuthContext";

type AlertItem = {
  id: string;
  symbol: string;
  condition: "priceUp" | "priceDown" | "changeSpike" | "volumeSpike" | "newsKeyword";
  value: string;
  window: string;
  enabled: boolean;
};

const INITIAL_ALERTS: AlertItem[] = [
  { id: "a1", symbol: "BTCUSDT", condition: "priceUp", value: "5%", window: "1h", enabled: true },
  { id: "a2", symbol: "ETHUSDT", condition: "volumeSpike", value: "2x", window: "24h", enabled: true }
];

const MAX_FREE_ALERTS = 5;
const CONDITION_OPTIONS = [
  { id: "priceUp", labelKey: "alertsPage.conditions.priceUp" },
  { id: "priceDown", labelKey: "alertsPage.conditions.priceDown" },
  { id: "changeSpike", labelKey: "alertsPage.conditions.changeSpike" },
  { id: "volumeSpike", labelKey: "alertsPage.conditions.volumeSpike" },
  { id: "newsKeyword", labelKey: "alertsPage.conditions.newsKeyword" }
] as const;

export default function AlertsPage() {
  const { supported, permission, requestPermission } = useNotificationPermission();
  const { isPro } = useAuth();
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [form, setForm] = useState<{
    symbol: string;
    condition: AlertItem["condition"];
    value: string;
    window: string;
  }>({
    symbol: "BTCUSDT",
    condition: "priceUp",
    value: "5%",
    window: "1h"
  });
  const [status, setStatus] = useState("");
  const { t } = useTranslation();

  const canAdd = isPro || alerts.length < MAX_FREE_ALERTS;
  const permissionMessage = useMemo(() => {
    if (!supported) return t("alertsPage.permissionUnsupported");
    if (permission === "granted") return t("alertsPage.permissionGranted");
    if (permission === "denied") return t("alertsPage.permissionDenied");
    return t("alertsPage.permissionDefault");
  }, [permission, supported, t]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAdd) {
      setStatus(t("alertsPage.statusLimit"));
      return;
    }
    const next: AlertItem = {
      id: `a-${Date.now()}`,
      symbol: form.symbol,
      condition: form.condition,
      value: form.value,
      window: form.window,
      enabled: true
    };
    setAlerts((prev) => [next, ...prev]);
    setStatus(t("alertsPage.statusSaved"));
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("alertsPage.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("alertsPage.desc")}</p>
        </header>

        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
          <p>{permissionMessage}</p>
          {supported && permission !== "granted" ? (
            <button
              type="button"
              onClick={() => requestPermission()}
              className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              {t("alertsPage.permissionCta")}
            </button>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-sm font-semibold text-gray-900">{t("alertsPage.newAlert")}</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("alertsPage.fields.symbol")}</label>
                <input
                  value={form.symbol}
                  onChange={(event) => setForm((prev) => ({ ...prev, symbol: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("alertsPage.fields.condition")}</label>
                <select
                  value={form.condition}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, condition: event.target.value as AlertItem["condition"] }))
                  }
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                >
                  {CONDITION_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("alertsPage.fields.value")}</label>
                <input
                  value={form.value}
                  onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("alertsPage.fields.window")}</label>
                <select
                  value={form.window}
                  onChange={(event) => setForm((prev) => ({ ...prev, window: event.target.value }))}
                  className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                >
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                  <option value="1d">1d</option>
                  <option value="1w">1w</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              {t("alertsPage.save")}
            </button>
            {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
          </form>

          <aside className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("alertsPage.summary")}</h2>
            <p className="mt-2 text-xs text-gray-500">
              {isPro ? t("alertsPage.proUnlimited") : t("alertsPage.freeLimit")}
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {alerts.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{item.symbol}</p>
                    <button
                      type="button"
                      onClick={() =>
                        setAlerts((prev) =>
                          prev.map((alert) => (alert.id === item.id ? { ...alert, enabled: !alert.enabled } : alert))
                        )
                      }
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                        item.enabled ? "bg-emerald-100 text-emerald-600" : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {item.enabled ? t("alertsPage.on") : t("alertsPage.off")}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t(`alertsPage.conditions.${item.condition}`)} · {item.value} · {item.window}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

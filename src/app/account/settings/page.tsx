"use client";

import { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import { ThemeContext, type ThemeMode } from "@/app/providers";
import i18n, { ensureLocaleResources } from "@/i18n/i18n";

type Prefs = {
  market_default: "spot" | "um";
  sort_default: "qv" | "volume" | "price" | "pct" | "symbol" | "time";
  tf_default: "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
  ccy_default: "KRW" | "USD" | "JPY" | "EUR";
  lang: "ko" | "en" | "ja" | "de";
  theme: "light" | "dark";
  tz: string;
  updated_at: string;
};

type Notify = {
  alert_email: boolean;
  alert_sms: boolean;
  alert_push: boolean;
  mkt_email: boolean;
  mkt_sms: boolean;
  mkt_push: boolean;
  quiet_enabled: boolean;
  quiet_start: string; // HH:MM:SS
  quiet_end: string; // HH:MM:SS
  weekly_digest_enabled: boolean;
  weekly_digest_dow: number; // 0..6
  weekly_digest_hour: number; // 0..23
  updated_at: string;
};

type AccountSettings = {
  prefs: Prefs;
  notify: Notify;
};

function getAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) throw new Error("Missing access token.");
  return { Authorization: `Bearer ${token}` };
}

function detectTimezone(): string {
  if (typeof Intl === "undefined") return "";
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
}

function toTimeInput(value: string): string {
  const v = String(value || "");
  if (v.length >= 5) return v.slice(0, 5);
  return "00:00";
}

function fromTimeInput(value: string): string {
  const v = String(value || "").trim();
  if (!v) return "00:00:00";
  if (v.length === 5) return `${v}:00`;
  return v;
}

async function fetchSettings(): Promise<AccountSettings> {
  const tz = detectTimezone();
  const headers: HeadersInit = {
    ...getAuthHeaders()
  };
  if (tz) {
    (headers as Record<string, string>)["X-Timezone"] = tz;
  }
  return await apiRequest<AccountSettings>("/account/settings", {
    method: "GET",
    headers
  });
}

async function updateSettings(payload: Record<string, unknown>): Promise<AccountSettings> {
  return await apiRequest<AccountSettings>("/account/settings", {
    method: "PUT",
    headers: getAuthHeaders(),
    json: payload as Record<string, unknown>
  });
}

export default function AccountSettingsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setTheme } = useContext(ThemeContext);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["accountSettings"],
    queryFn: fetchSettings,
    staleTime: 60_000
  });

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [notify, setNotify] = useState<Notify | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    setPrefs(data.prefs);
    setNotify(data.notify);
  }, [data?.prefs?.updated_at, data?.notify?.updated_at]);

  const applyPrefsRuntime = useCallback(
    async (next: Prefs) => {
      const base = String(next.lang || "").split("-")[0];
      if (base && ["ko", "en", "ja", "de"].includes(base) && i18n.language !== base) {
        await ensureLocaleResources(base);
        i18n.changeLanguage(base);
      }
      const theme = (String(next.theme || "light").toLowerCase() as ThemeMode) || "light";
      if (theme === "light" || theme === "dark") {
        setTheme(theme);
        if (typeof window !== "undefined") window.localStorage.setItem("theme", theme);
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("tz", String(next.tz || ""));
      }
    },
    [setTheme]
  );

  const putMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async (next) => {
      queryClient.setQueryData(["accountSettings"], next);
      setPrefs(next.prefs);
      setNotify(next.notify);
      setSavedAt(Date.now());
      await applyPrefsRuntime(next.prefs);
    }
  });

  const isDirty = useMemo(() => {
    if (!data || !prefs || !notify) return false;
    const p0 = { ...data.prefs, updated_at: "" };
    const p1 = { ...prefs, updated_at: "" };
    const n0 = { ...data.notify, updated_at: "" };
    const n1 = { ...notify, updated_at: "" };
    return JSON.stringify(p0) !== JSON.stringify(p1) || JSON.stringify(n0) !== JSON.stringify(n1);
  }, [data, prefs, notify]);

  const onSave = useCallback(() => {
    if (!prefs || !notify) return;
    const payload: Record<string, unknown> = {
      prefs: {
        market_default: prefs.market_default,
        sort_default: prefs.sort_default,
        tf_default: prefs.tf_default,
        ccy_default: prefs.ccy_default,
        lang: prefs.lang,
        theme: prefs.theme,
        tz: prefs.tz
      },
      notify: {
        alert_email: notify.alert_email,
        alert_sms: notify.alert_sms,
        alert_push: notify.alert_push,
        quiet_enabled: notify.quiet_enabled,
        quiet_start: notify.quiet_start,
        quiet_end: notify.quiet_end,
        weekly_digest_enabled: notify.weekly_digest_enabled,
        weekly_digest_dow: notify.weekly_digest_dow,
        weekly_digest_hour: notify.weekly_digest_hour
      }
    };
    putMutation.mutate(payload);
  }, [prefs, notify, putMutation]);

  const onToggleMarketing = useCallback(
    (key: "mkt_email" | "mkt_sms" | "mkt_push", value: boolean) => {
      if (!notify) return;
      setNotify({ ...notify, [key]: value });
      putMutation.mutate({ notify: { [key]: value } });
    },
    [notify, putMutation]
  );

  const saving = putMutation.isPending;
  const saveOk = savedAt && Date.now() - savedAt < 2000;

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-6xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("accountSettings.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("accountSettings.desc")}</p>
          </header>

          {isLoading ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">{t("common.loading")}</p>
            </div>
          ) : isError ? (
            <div className="rounded-3xl border border-red-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-red-600">{t("accountSettings.loadFailed")}</p>
              <p className="mt-2 text-xs text-gray-500">{String((error as Error)?.message || "")}</p>
            </div>
          ) : !prefs || !notify ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">{t("accountSettings.empty")}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("accountSettings.sectionTrade")}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.marketDefault")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={prefs.market_default}
                      onChange={(e) => setPrefs({ ...prefs, market_default: e.target.value as Prefs["market_default"] })}
                    >
                      <option value="spot">spot</option>
                      <option value="um">um</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.sortDefault")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={prefs.sort_default}
                      onChange={(e) => setPrefs({ ...prefs, sort_default: e.target.value as Prefs["sort_default"] })}
                    >
                      <option value="qv">qv</option>
                      <option value="volume">volume</option>
                      <option value="price">price</option>
                      <option value="pct">pct</option>
                      <option value="symbol">symbol</option>
                      <option value="time">time</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.tfDefault")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={prefs.tf_default}
                      onChange={(e) => setPrefs({ ...prefs, tf_default: e.target.value as Prefs["tf_default"] })}
                    >
                      {["1m", "5m", "15m", "1h", "4h", "1d", "1w"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("accountSettings.sectionDisplay")}</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.currency")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={prefs.ccy_default}
                      onChange={(e) => setPrefs({ ...prefs, ccy_default: e.target.value as Prefs["ccy_default"] })}
                    >
                      {["KRW", "USD", "JPY", "EUR"].map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.language")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={prefs.lang}
                      onChange={(e) => setPrefs({ ...prefs, lang: e.target.value as Prefs["lang"] })}
                    >
                      <option value="ko">ko</option>
                      <option value="en">en</option>
                      <option value="ja">ja</option>
                      <option value="de">de</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.theme")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={prefs.theme}
                      onChange={(e) => setPrefs({ ...prefs, theme: e.target.value as Prefs["theme"] })}
                    >
                      <option value="light">{t("accountSettings.themeLight")}</option>
                      <option value="dark">{t("accountSettings.themeDark")}</option>
                    </select>
                  </label>

                  <label className="block md:col-span-3">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.timezone")}</span>
                    <div className="mt-2 flex gap-2">
                      <input
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        value={prefs.tz}
                        onChange={(e) => setPrefs({ ...prefs, tz: e.target.value })}
                        placeholder="Asia/Seoul"
                      />
                      <button
                        type="button"
                        className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                        onClick={() => setPrefs({ ...prefs, tz: detectTimezone() || prefs.tz })}
                      >
                        {t("accountSettings.detectTz")}
                      </button>
                    </div>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("accountSettings.sectionNotify")}</h2>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.alertEmail")}</span>
                    <input
                      type="checkbox"
                      checked={notify.alert_email}
                      onChange={(e) => setNotify({ ...notify, alert_email: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.alertPush")}</span>
                    <input
                      type="checkbox"
                      checked={notify.alert_push}
                      onChange={(e) => setNotify({ ...notify, alert_push: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 opacity-60">
                    <span className="text-sm text-gray-700">{t("accountSettings.alertSms")}</span>
                    <input type="checkbox" checked={notify.alert_sms} disabled />
                  </label>
                  <p className="text-xs text-gray-500 md:col-span-3">{t("accountSettings.smsDisabled")}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.quietEnabled")}</span>
                    <input
                      type="checkbox"
                      checked={notify.quiet_enabled}
                      onChange={(e) => setNotify({ ...notify, quiet_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.quietStart")}</span>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={toTimeInput(notify.quiet_start)}
                      onChange={(e) => setNotify({ ...notify, quiet_start: fromTimeInput(e.target.value) })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.quietEnd")}</span>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={toTimeInput(notify.quiet_end)}
                      onChange={(e) => setNotify({ ...notify, quiet_end: fromTimeInput(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.weeklyDigest")}</span>
                    <input
                      type="checkbox"
                      checked={notify.weekly_digest_enabled}
                      onChange={(e) => setNotify({ ...notify, weekly_digest_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.weeklyDigestDow")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={String(notify.weekly_digest_dow)}
                      onChange={(e) => setNotify({ ...notify, weekly_digest_dow: Number(e.target.value) })}
                    >
                      {[0, 1, 2, 3, 4, 5, 6].map((x) => (
                        <option key={x} value={String(x)}>
                          {t(`accountSettings.dow.${x}`)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.weeklyDigestHour")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={String(notify.weekly_digest_hour)}
                      onChange={(e) => setNotify({ ...notify, weekly_digest_hour: Number(e.target.value) })}
                    >
                      {Array.from({ length: 24 }).map((_, idx) => (
                        <option key={idx} value={String(idx)}>
                          {idx}:00
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">{t("accountSettings.sectionMarketing")}</h2>
                <p className="mt-2 text-xs text-gray-500">{t("accountSettings.marketingDesc")}</p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.mktEmail")}</span>
                    <input
                      type="checkbox"
                      checked={notify.mkt_email}
                      onChange={(e) => onToggleMarketing("mkt_email", e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 opacity-60">
                    <span className="text-sm text-gray-700">{t("accountSettings.mktSms")}</span>
                    <input type="checkbox" checked={notify.mkt_sms} disabled />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.mktPush")}</span>
                    <input
                      type="checkbox"
                      checked={notify.mkt_push}
                      onChange={(e) => onToggleMarketing("mkt_push", e.target.checked)}
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-gray-500">{t("accountSettings.marketingImmediate")}</p>
              </section>

              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {saveOk ? t("accountSettings.saved") : isDirty ? t("accountSettings.unsaved") : t("accountSettings.synced")}
                </p>
                <button
                  type="button"
                  disabled={!isDirty || saving}
                  onClick={onSave}
                  className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? t("accountSettings.saving") : t("accountSettings.save")}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </RequireAuth>
  );
}


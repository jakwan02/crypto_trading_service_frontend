"use client";

import { useCallback, useEffect, useMemo, useState, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RequireAuth from "@/components/auth/RequireAuth";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import { ThemeContext, type ThemeMode } from "@/app/providers";
import i18n, { ensureLocaleResources } from "@/i18n/i18n";
import { useSymbolsStore } from "@/store/useSymbolStore";

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

  const [draftPrefs, setDraftPrefs] = useState<Prefs | null>(null);
  const [draftNotify, setDraftNotify] = useState<Notify | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (!data) return;
    // 변경 이유: server state(React Query)와 draft state(편집 중)를 분리해 마케팅 토글/부분 저장이 draft를 초기화하지 않도록 함
    setDraftPrefs((prev) => prev ?? data.prefs);
    setDraftNotify((prev) => prev ?? data.notify);
  }, [data]);

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
      useSymbolsStore.getState().applyAccountPrefs(next);
    },
    [setTheme]
  );

  const saveMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: async (next) => {
      queryClient.setQueryData(["accountSettings"], next);
      setDraftPrefs(next.prefs);
      setDraftNotify(next.notify);
      setSavedAt(Date.now());
      await applyPrefsRuntime(next.prefs);
    }
  });

  const marketingMutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (next, variables) => {
      // 변경 이유: 마케팅 토글은 즉시 저장되지만, 다른 draft(미저장 변경)는 유지해야 함
      queryClient.setQueryData<AccountSettings | undefined>(["accountSettings"], (prev) => {
        if (!prev) return next;
        return {
          ...prev,
          notify: {
            ...prev.notify,
            mkt_email: next.notify.mkt_email,
            mkt_sms: next.notify.mkt_sms,
            mkt_push: next.notify.mkt_push,
            updated_at: next.notify.updated_at
          }
        };
      });
      setDraftNotify((prev) => {
        if (!prev) return next.notify;
        return {
          ...prev,
          mkt_email: next.notify.mkt_email,
          mkt_sms: next.notify.mkt_sms,
          mkt_push: next.notify.mkt_push,
          updated_at: next.notify.updated_at
        };
      });
      setSavedAt(Date.now());
      void variables;
    }
  });

  const isDirty = useMemo(() => {
    if (!data || !draftPrefs || !draftNotify) return false;
    const p0 = { ...data.prefs, updated_at: "" };
    const p1 = { ...draftPrefs, updated_at: "" };
    const n0 = { ...data.notify, updated_at: "" };
    const n1 = { ...draftNotify, updated_at: "" };
    return JSON.stringify(p0) !== JSON.stringify(p1) || JSON.stringify(n0) !== JSON.stringify(n1);
  }, [data, draftPrefs, draftNotify]);

  const onSave = useCallback(() => {
    if (!draftPrefs || !draftNotify) return;
    const payload: Record<string, unknown> = {
      prefs: {
        market_default: draftPrefs.market_default,
        sort_default: draftPrefs.sort_default,
        tf_default: draftPrefs.tf_default,
        ccy_default: draftPrefs.ccy_default,
        lang: draftPrefs.lang,
        theme: draftPrefs.theme,
        tz: draftPrefs.tz
      },
      notify: {
        alert_email: draftNotify.alert_email,
        alert_sms: draftNotify.alert_sms,
        alert_push: draftNotify.alert_push,
        quiet_enabled: draftNotify.quiet_enabled,
        quiet_start: draftNotify.quiet_start,
        quiet_end: draftNotify.quiet_end,
        weekly_digest_enabled: draftNotify.weekly_digest_enabled,
        weekly_digest_dow: draftNotify.weekly_digest_dow,
        weekly_digest_hour: draftNotify.weekly_digest_hour
      }
    };
    saveMutation.mutate(payload);
  }, [draftPrefs, draftNotify, saveMutation]);

  const onToggleMarketing = useCallback(
    (key: "mkt_email" | "mkt_sms" | "mkt_push", value: boolean) => {
      if (!draftNotify) return;
      const prev = Boolean(draftNotify[key]);
      setDraftNotify({ ...draftNotify, [key]: value });
      marketingMutation.mutate(
        { notify: { [key]: value } },
        {
          onError: () => {
            setDraftNotify((cur) => (cur ? { ...cur, [key]: prev } : cur));
          }
        }
      );
    },
    [draftNotify, marketingMutation]
  );

  const saving = saveMutation.isPending;
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
          ) : !draftPrefs || !draftNotify ? (
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
                      value={draftPrefs.market_default}
                      onChange={(e) =>
                        setDraftPrefs({
                          ...draftPrefs,
                          market_default: e.target.value as Prefs["market_default"]
                        })
                      }
                    >
                      <option value="spot">spot</option>
                      <option value="um">um</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.sortDefault")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={draftPrefs.sort_default}
                      onChange={(e) =>
                        setDraftPrefs({
                          ...draftPrefs,
                          sort_default: e.target.value as Prefs["sort_default"]
                        })
                      }
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
                      value={draftPrefs.tf_default}
                      onChange={(e) =>
                        setDraftPrefs({
                          ...draftPrefs,
                          tf_default: e.target.value as Prefs["tf_default"]
                        })
                      }
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
                      value={draftPrefs.ccy_default}
                      onChange={(e) =>
                        setDraftPrefs({
                          ...draftPrefs,
                          ccy_default: e.target.value as Prefs["ccy_default"]
                        })
                      }
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
                      value={draftPrefs.lang}
                      onChange={(e) =>
                        setDraftPrefs({
                          ...draftPrefs,
                          lang: e.target.value as Prefs["lang"]
                        })
                      }
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
                      value={draftPrefs.theme}
                      onChange={(e) =>
                        setDraftPrefs({
                          ...draftPrefs,
                          theme: e.target.value as Prefs["theme"]
                        })
                      }
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
                        value={draftPrefs.tz}
                        onChange={(e) => setDraftPrefs({ ...draftPrefs, tz: e.target.value })}
                        placeholder="Asia/Seoul"
                      />
                      <button
                        type="button"
                        className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
                        onClick={() => setDraftPrefs({ ...draftPrefs, tz: detectTimezone() || draftPrefs.tz })}
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
                      checked={draftNotify.alert_email}
                      onChange={(e) => setDraftNotify({ ...draftNotify, alert_email: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.alertPush")}</span>
                    <input
                      type="checkbox"
                      checked={draftNotify.alert_push}
                      onChange={(e) => setDraftNotify({ ...draftNotify, alert_push: e.target.checked })}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 opacity-60">
                    <span className="text-sm text-gray-700">{t("accountSettings.alertSms")}</span>
                    <input type="checkbox" checked={draftNotify.alert_sms} disabled />
                  </label>
                  <p className="text-xs text-gray-500 md:col-span-3">{t("accountSettings.smsDisabled")}</p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.quietEnabled")}</span>
                    <input
                      type="checkbox"
                      checked={draftNotify.quiet_enabled}
                      onChange={(e) => setDraftNotify({ ...draftNotify, quiet_enabled: e.target.checked })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.quietStart")}</span>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={toTimeInput(draftNotify.quiet_start)}
                      onChange={(e) => setDraftNotify({ ...draftNotify, quiet_start: fromTimeInput(e.target.value) })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.quietEnd")}</span>
                    <input
                      type="time"
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={toTimeInput(draftNotify.quiet_end)}
                      onChange={(e) => setDraftNotify({ ...draftNotify, quiet_end: fromTimeInput(e.target.value) })}
                    />
                  </label>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.weeklyDigest")}</span>
                    <input
                      type="checkbox"
                      checked={draftNotify.weekly_digest_enabled}
                      onChange={(e) =>
                        setDraftNotify({ ...draftNotify, weekly_digest_enabled: e.target.checked })
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-gray-700">{t("accountSettings.weeklyDigestDow")}</span>
                    <select
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                      value={String(draftNotify.weekly_digest_dow)}
                      onChange={(e) => setDraftNotify({ ...draftNotify, weekly_digest_dow: Number(e.target.value) })}
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
                      value={String(draftNotify.weekly_digest_hour)}
                      onChange={(e) => setDraftNotify({ ...draftNotify, weekly_digest_hour: Number(e.target.value) })}
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
                      checked={draftNotify.mkt_email}
                      onChange={(e) => onToggleMarketing("mkt_email", e.target.checked)}
                    />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3 opacity-60">
                    <span className="text-sm text-gray-700">{t("accountSettings.mktSms")}</span>
                    <input type="checkbox" checked={draftNotify.mkt_sms} disabled />
                  </label>

                  <label className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                    <span className="text-sm text-gray-700">{t("accountSettings.mktPush")}</span>
                    <input
                      type="checkbox"
                      checked={draftNotify.mkt_push}
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

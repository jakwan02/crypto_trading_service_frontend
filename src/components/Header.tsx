"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Bell, ChevronDown, Crown, Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import Navigation from "./Navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";

const NOTIFICATIONS = [
  {
    id: "n1",
    titleKey: "common.notifications.item1.title",
    timeKey: "common.notifications.item1.time",
    href: "/chart/BTCUSDT"
  },
  {
    id: "n2",
    titleKey: "common.notifications.item2.title",
    timeKey: "common.notifications.item2.time",
    href: "/chart/ETHUSDT"
  },
  {
    id: "n3",
    titleKey: "common.notifications.item3.title",
    timeKey: "common.notifications.item3.time",
    href: "/alerts"
  }
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const { user, signInWithGoogle, signOut, isPro } = useAuth();
  const { t } = useTranslation();
  const displayName = useMemo(() => {
    if (!user) return t("common.guest");
    return (
      String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
      String(user.email || t("common.user"))
    );
  }, [user, t]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-white shadow-sm">
            CD
          </span>
          <div className="leading-tight">
            <span className="block text-base font-semibold text-gray-900">{t("common.appName")}</span>
            <span className="block text-xs text-secondary">{t("common.tagline")}</span>
          </div>
        </Link>

        <Navigation className="hidden items-center gap-2 md:flex" />

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />

          <div className="relative">
            <button
              type="button"
              onClick={() => setNoticeOpen((prev) => !prev)}
              className="relative rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:text-gray-900"
              aria-label={t("common.notifications.label")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            </button>
              {noticeOpen ? (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                <p className="text-xs font-semibold text-gray-500">{t("common.recentAlerts")}</p>
                <div className="mt-3 space-y-2">
                  {NOTIFICATIONS.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setNoticeOpen(false)}
                      className="block rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <p className="font-medium text-gray-900">{t(item.titleKey)}</p>
                      <p className="mt-1 text-[11px] text-gray-400">{t(item.timeKey)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {!isPro ? (
            <Link
              href="/upgrade"
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/20"
            >
              <Crown className="h-4 w-4" />
              {t("common.proUpgrade")}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white">
              <Crown className="h-4 w-4" />
              {t("common.pro")}
            </span>
          )}

          {!user ? (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
            >
              {t("common.loginGoogle")}
            </button>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
              >
                {displayName}
                <ChevronDown className="h-4 w-4" />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 mt-2 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.account")}
                  </Link>
                  <Link
                    href="/alerts"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.alerts")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      signOut();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
          className="rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:border-gray-300 hover:text-gray-900 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div
        className={`fixed inset-0 z-50 transition ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/30 transition ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-80 transform bg-white shadow-xl transition ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            <span className="text-sm font-semibold text-gray-900">{t("common.navigation")}</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
              className="rounded-full border border-gray-200 p-2 text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-4 px-4 py-6">
            <Navigation className="flex flex-col items-start gap-2" onNavigate={() => setMobileOpen(false)} />
            <div className="flex flex-col gap-4 border-t border-gray-200 pt-4">
              <LanguageSwitcher />
              {!isPro ? (
                <Link
                  href="/upgrade"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary"
                >
                  {t("common.proUpgrade")}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-white">
                  <Crown className="h-4 w-4" />
                  {t("common.pro")}
                </span>
              )}

              {!user ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    signInWithGoogle();
                  }}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  {t("common.loginGoogle")}
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    {t("common.account")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      signOut();
                    }}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </header>
  );
}

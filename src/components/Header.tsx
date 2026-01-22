"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Crown, Menu, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { NAV_FEATURES, NAV_MORE, NAV_PRIMARY, NavigationList } from "./Navigation";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { getTrending } from "@/lib/searchClient";
import { useOnboarding } from "@/hooks/useOnboarding";

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
  const [portalReady, setPortalReady] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const { user, signOut, isPro, isAdmin, sessionReady } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const onboarding = useOnboarding();
  const accountWrapRef = useRef<HTMLDivElement | null>(null);
  const noticeWrapRef = useRef<HTMLDivElement | null>(null);
  const searchWrapRef = useRef<HTMLDivElement | null>(null);
  const featuresWrapRef = useRef<HTMLDivElement | null>(null);
  const moreWrapRef = useRef<HTMLDivElement | null>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobilePanelRef = useRef<HTMLElement | null>(null);
  const prevMobileOpenRef = useRef(false);
  const searchInlineInputRef = useRef<HTMLInputElement | null>(null);
  const searchPanelInputRef = useRef<HTMLInputElement | null>(null);
  const displayName = useMemo(() => {
    if (!user) return t("common.guest");
    return String(user.name || "").trim() || String(user.email || t("common.user"));
  }, [user, t]);

  // 변경 이유: 알림/계정 드롭다운이 바깥 클릭/ESC로 닫히지 않아 UX가 불편한 문제를 해결
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setAccountOpen(false);
      setNoticeOpen(false);
      setSearchOpen(false);
      setFeaturesOpen(false);
      setMoreOpen(false);
      setMobileOpen(false);
    }

    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (accountOpen && accountWrapRef.current && !accountWrapRef.current.contains(target)) {
        setAccountOpen(false);
      }
      if (noticeOpen && noticeWrapRef.current && !noticeWrapRef.current.contains(target)) {
        setNoticeOpen(false);
      }
      if (searchOpen && searchWrapRef.current && !searchWrapRef.current.contains(target)) {
        setSearchOpen(false);
      }
      if (featuresOpen && featuresWrapRef.current && !featuresWrapRef.current.contains(target)) {
        setFeaturesOpen(false);
      }
      if (moreOpen && moreWrapRef.current && !moreWrapRef.current.contains(target)) {
        setMoreOpen(false);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("touchstart", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("touchstart", onPointerDown, true);
    };
  }, [accountOpen, noticeOpen, searchOpen, featuresOpen, moreOpen]);

  const trendingQ = useQuery({
    queryKey: ["search.trending.header"],
    queryFn: () => getTrending({ range: "24h", limit: 10 }),
    enabled: searchOpen || mobileOpen,
    staleTime: 60_000
  });

  // 변경 이유: Portal 기반 드로어는 hydration 직후에만 mount되어야 하므로, 첫 렌더(SSR/CSR) 결과를 동일하게 유지
  useEffect(() => {
    const timer = window.setTimeout(() => setPortalReady(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  // 변경 이유: 모바일 드로어가 열린 동안 바디 스크롤이 남아 UX가 어색해지는 문제를 방지
  useEffect(() => {
    if (!mobileOpen) return;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPadRight = body.style.paddingRight;
    const sbw = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (sbw > 0) body.style.paddingRight = `${sbw}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPadRight;
    };
  }, [mobileOpen]);

  // 변경 이유: 모바일 드로어 열림/닫힘 시 포커스 이동(열림: 닫기 버튼, 닫힘: 햄버거 버튼)으로 접근성/UX를 개선
  useEffect(() => {
    const wasOpen = prevMobileOpenRef.current;
    prevMobileOpenRef.current = mobileOpen;
    if (mobileOpen) {
      window.setTimeout(() => mobileCloseButtonRef.current?.focus(), 0);
      return;
    }
    if (wasOpen) {
      window.setTimeout(() => mobileMenuButtonRef.current?.focus(), 0);
    }
  }, [mobileOpen]);

  // 변경 이유: 모바일 드로어에서 ESC 닫기 + 최소 포커스 트랩으로 dialog 밖으로 포커스가 새지 않도록 보장
  useEffect(() => {
    if (!mobileOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const container = mobilePanelRef.current;
      if (!container) return;
      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (!active || active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
        return;
      }
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  // 변경 이유: 검색(아이콘/패널) 오픈 시 즉시 입력 포커스를 제공해 지연이 덜 느껴지도록 개선
  useEffect(() => {
    if (!searchOpen) return;
    window.setTimeout(() => {
      if (searchInlineInputRef.current) {
        searchInlineInputRef.current.focus();
        return;
      }
      if (searchPanelInputRef.current) {
        searchPanelInputRef.current.focus();
      }
    }, 0);
  }, [searchOpen]);

  const showOnboardingBanner = Boolean(
    user &&
      sessionReady &&
      !onboarding.completed &&
      pathname &&
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/login") &&
      !pathname.startsWith("/signup")
  );

  const normalizedPath = pathname || "/";
  const featuresActive = NAV_FEATURES.some((link) => (link.href === "/" ? normalizedPath === "/" : normalizedPath.startsWith(link.href)));
  const moreActive = NAV_MORE.some((link) => link.href !== "/" && (link.href === "/" ? normalizedPath === "/" : normalizedPath.startsWith(link.href)));
  const mobileTopLinks = useMemo(() => [...NAV_PRIMARY], []);

  const mobileDrawerPortal = portalReady
    ? createPortal(
          <div
            className={`fixed inset-0 z-[120] transition ${mobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}
            aria-hidden={!mobileOpen}
          >
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity ${mobileOpen ? "opacity-100" : "opacity-0"}`}
              onClick={() => setMobileOpen(false)}
            />
            <aside
              ref={mobilePanelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("common.navigation")}
              className={`fixed left-0 top-0 h-[100dvh] w-[86vw] max-w-sm transform bg-white shadow-xl transition-transform duration-200 ease-out sm:max-w-md ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <div className="flex h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
                <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
                  <span className="text-sm font-semibold text-gray-900">{t("common.navigation")}</span>
                  <button
                    ref={mobileCloseButtonRef}
                    type="button"
                    aria-label="Close menu"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                  <div className="flex flex-col gap-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-3">
                      <div className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 shadow-sm focus-within:border-primary/30">
                        <Search className="h-4 w-4 text-gray-400" />
                        <input
                          value={searchText}
                          onChange={(e) => setSearchText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key !== "Enter") return;
                            const q = searchText.trim();
                            if (!q) return;
                            setMobileOpen(false);
                            router.push(`/search?q=${encodeURIComponent(q)}`);
                          }}
                          placeholder={t("search.placeholder")}
                          className="h-full w-full bg-transparent text-sm text-gray-700 outline-none"
                        />
                      </div>
                      <div className="mt-3">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t("search.trending")}</p>
                        {trendingQ.isLoading ? <p className="mt-2 text-xs text-gray-500">{t("common.loading")}</p> : null}
                        {!trendingQ.isLoading && (trendingQ.data?.items ?? []).length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {(trendingQ.data?.items ?? []).slice(0, 8).map((it) => (
                              <button
                                key={it.keyword}
                                type="button"
                                onClick={() => {
                                  setSearchText(it.keyword);
                                  setMobileOpen(false);
                                  router.push(`/search?q=${encodeURIComponent(it.keyword)}`);
                                }}
                                className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              >
                                {it.keyword}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <nav aria-label="Main navigation">
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                          <NavigationList as="div" dense links={mobileTopLinks} onNavigate={() => setMobileOpen(false)} />
                        </div>

                        <details className="rounded-2xl border border-gray-200 bg-white">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                            <span>{t("nav.features")}</span>
                            <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
                          </summary>
                          <div className="flex flex-col gap-1 border-t border-gray-100 p-2">
                            <NavigationList as="div" dense links={NAV_FEATURES} onNavigate={() => setMobileOpen(false)} />
                          </div>
                        </details>

                        <details className="rounded-2xl border border-gray-200 bg-white">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
                            <span>{t("nav.more")}</span>
                            <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
                          </summary>
                          <div className="flex flex-col gap-1 border-t border-gray-100 p-2">
                            <NavigationList as="div" dense links={NAV_MORE} onNavigate={() => setMobileOpen(false)} />
                          </div>
                        </details>
                      </div>
                    </nav>

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
                        <span className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-2 text-xs font-semibold text-ink">
                          <Crown className="h-4 w-4" />
                          {t("common.pro")}
                        </span>
                      )}

                      {!sessionReady ? (
                        <div className="h-10 w-full animate-pulse rounded-full bg-gray-200" />
                      ) : !user ? (
                        <Link
                          href="/login"
                          onClick={() => setMobileOpen(false)}
                          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink"
                        >
                          {t("common.login")}
                        </Link>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Link
                            href="/account"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.account")}
                          </Link>
                          <Link
                            href="/rankings"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.rankings")}
                          </Link>
                          <Link
                            href="/calendar"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.calendar")}
                          </Link>
                          <Link
                            href="/referral"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.referral")}
                          </Link>
                          <Link
                            href="/developer"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.developer")}
                          </Link>
                          {isAdmin ? (
                            <>
                              <Link
                                href="/admin"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navDashboard")}
                              </Link>
                              <Link
                                href="/admin/users"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navUsers")}
                              </Link>
                              <Link
                                href="/admin/billing"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navBilling")}
                              </Link>
                              <Link
                                href="/admin/monitoring"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navMonitoring")}
                              </Link>
                              <Link
                                href="/admin/growth"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navGrowth")}
                              </Link>
                              <Link
                                href="/admin/calendar"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navCalendar")}
                              </Link>
                              <Link
                                href="/admin/audit"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navAudit")}
                              </Link>
                              <Link
                                href="/admin/support"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navSupport")}
                              </Link>
                              <Link
                                href="/admin/content"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navContent")}
                              </Link>
                              <Link
                                href="/admin/changelog"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navChangelog")}
                              </Link>
                              <Link
                                href="/admin/legal"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navLegal")}
                              </Link>
                              <Link
                                href="/admin/status"
                                onClick={() => setMobileOpen(false)}
                                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                              >
                                {t("admin.navStatus")}
                              </Link>
                            </>
                          ) : null}
                          <Link
                            href="/billing"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.billing")}
                          </Link>
                          <Link
                            href="/usage"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.usage")}
                          </Link>
                          <Link
                            href="/watchlists"
                            onClick={() => setMobileOpen(false)}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.watchlists")}
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setMobileOpen(false);
                              signOut();
                            }}
                            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:text-primary"
                          >
                            {t("common.logout")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )
    : null;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      {/* 변경 이유: 상단(로고+우측 액션) 1줄 고정 + 데스크탑 네비 2줄 분리로 줄바꿈/겹침/세로 정렬 문제를 근본적으로 방지 */}
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-sm font-semibold text-ink shadow-sm">
            CD
          </span>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-base font-semibold text-gray-900">{t("common.appName")}</span>
            <span className="hidden truncate text-xs text-secondary xl:block">{t("common.tagline")}</span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            <div ref={searchWrapRef} className="relative">
              <div className="hidden h-10 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 shadow-sm focus-within:border-primary/30 xl:flex">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  ref={searchInlineInputRef}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    const q = searchText.trim();
                    if (!q) return;
                    setSearchOpen(false);
                    router.push(`/search?q=${encodeURIComponent(q)}`);
                  }}
                  placeholder={t("search.placeholder")}
                  className="h-full w-56 bg-transparent text-sm text-gray-700 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearchOpen((prev) => !prev);
                  setAccountOpen(false);
                  setNoticeOpen(false);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 xl:hidden"
                aria-label={t("search.openPage")}
                aria-expanded={searchOpen}
              >
                <Search className="h-4 w-4" />
              </button>

	              {searchOpen ? (
	                <div className="fade-up absolute right-0 z-[210] mt-2 w-80 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                  <div className="xl:hidden">
                    <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-primary/30">
                      <Search className="h-4 w-4 text-gray-400" />
                      <input
                        ref={searchPanelInputRef}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const q = searchText.trim();
                          if (!q) return;
                          setSearchOpen(false);
                          router.push(`/search?q=${encodeURIComponent(q)}`);
                        }}
                        placeholder={t("search.placeholder")}
                        className="w-full bg-transparent text-sm text-gray-700 outline-none"
                      />
                    </div>
                    <div className="mt-3 border-t border-gray-100 pt-3" />
                  </div>

                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{t("search.trending")}</p>
                  {trendingQ.isLoading ? <p className="mt-2 text-xs text-gray-500">{t("common.loading")}</p> : null}
                  {!trendingQ.isLoading && (trendingQ.data?.items ?? []).length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(trendingQ.data?.items ?? []).map((it) => (
                        <button
                          key={it.keyword}
                          type="button"
                          onClick={() => {
                            setSearchText(it.keyword);
                            setSearchOpen(false);
                            router.push(`/search?q=${encodeURIComponent(it.keyword)}`);
                          }}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                        >
                          {it.keyword}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 border-t border-gray-100 pt-3">
                    <Link
                      href={searchText.trim() ? `/search?q=${encodeURIComponent(searchText.trim())}` : "/search"}
                      onClick={() => setSearchOpen(false)}
                      className="text-sm font-semibold text-primary-dark hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      {t("search.openPage")}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

                      <LanguageSwitcher variant="drawer" />

            <div ref={noticeWrapRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNoticeOpen((prev) => !prev);
                setAccountOpen(false);
              }}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={t("common.notifications.label")}
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" />
            </button>
            {noticeOpen ? (
              <div className="absolute right-0 z-[210] mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-3 shadow-lg">
                <p className="text-xs font-semibold text-gray-500">{t("common.recentAlerts")}</p>
                <div className="mt-3 space-y-2">
                  {NOTIFICATIONS.map((item) => (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setNoticeOpen(false)}
                      className="block rounded-xl border border-gray-100 px-3 py-2 text-xs text-gray-700 transition hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
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
              className="inline-flex h-10 items-center gap-2 rounded-full bg-primary/10 px-4 text-xs font-semibold text-primary-dark transition hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Crown className="h-4 w-4" />
              {t("common.proUpgrade")}
            </Link>
          ) : (
            <span className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-3 text-xs font-semibold text-ink">
              <Crown className="h-4 w-4" />
              {t("common.pro")}
            </span>
          )}

          {!sessionReady ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-gray-200" />
          ) : !user ? (
            <Link
              href="/login"
              className="inline-flex h-10 items-center rounded-full bg-primary px-4 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {t("common.login")}
            </Link>
          ) : (
            <div ref={accountWrapRef} className="relative">
	              <button
	                type="button"
	                onClick={() => {
	                  setAccountOpen((prev) => !prev);
	                  setNoticeOpen(false);
	                }}
	                className="flex h-10 max-w-56 min-w-0 items-center gap-2 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
	              >
	                <span className="min-w-0 truncate">{displayName}</span>
	                <ChevronDown className="h-4 w-4" />
	              </button>
              {accountOpen ? (
                <div className="absolute right-0 z-[210] mt-2 w-44 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/account"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.account")}
                  </Link>
                  <Link
                    href="/rankings"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.rankings")}
                  </Link>
                  <Link
                    href="/calendar"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.calendar")}
                  </Link>
                  <Link
                    href="/referral"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.referral")}
                  </Link>
                  <Link
                    href="/developer"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.developer")}
                  </Link>
                  <Link
                    href="/billing"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.billing")}
                  </Link>
                  <Link
                    href="/usage"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.usage")}
                  </Link>
                  <Link
                    href="/watchlists"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.watchlists")}
                  </Link>
                  <Link
                    href="/screener"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.screener")}
                  </Link>
                  <Link
                    href="/portfolio"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.portfolio")}
                  </Link>
                  <Link
                    href="/alerts"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.alerts")}
                  </Link>
                  <Link
                    href="/research"
                    onClick={() => setAccountOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.research")}
                  </Link>
                  {isAdmin ? (
                    <>
                      <div className="my-1 border-t border-gray-200" />
                      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {t("admin.navTitle")}
                      </p>
                      <Link
                        href="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navDashboard")}
                      </Link>
                      <Link
                        href="/admin/users"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navUsers")}
                      </Link>
                      <Link
                        href="/admin/billing"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navBilling")}
                      </Link>
                      <Link
                        href="/admin/monitoring"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navMonitoring")}
                      </Link>
                      <Link
                        href="/admin/growth"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navGrowth")}
                      </Link>
                      <Link
                        href="/admin/calendar"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navCalendar")}
                      </Link>
                      <Link
                        href="/admin/audit"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navAudit")}
                      </Link>
                      <div className="my-1 border-t border-gray-200" />
                      <Link
                        href="/admin/support"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navSupport")}
                      </Link>
                      <Link
                        href="/admin/content"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navContent")}
                      </Link>
                      <Link
                        href="/admin/changelog"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navChangelog")}
                      </Link>
                      <Link
                        href="/admin/legal"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navLegal")}
                      </Link>
                      <Link
                        href="/admin/status"
                        onClick={() => setAccountOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                      >
                        {t("admin.navStatus")}
                      </Link>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountOpen(false);
                      signOut();
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-primary/5 hover:text-primary"
                  >
                    {t("common.logout")}
                  </button>
                </div>
              ) : null}
            </div>
          )}
          </div>
          <button
            ref={mobileMenuButtonRef}
            type="button"
            aria-label="Open menu"
            onClick={() => {
              setMobileOpen(true);
              setAccountOpen(false);
              setNoticeOpen(false);
              setSearchOpen(false);
              setFeaturesOpen(false);
              setMoreOpen(false);
            }}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-primary/30 hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="hidden border-t border-gray-100 bg-white/70 lg:block">
        <div className="mx-auto flex h-12 w-full max-w-6xl items-center px-4">
          <nav className="flex w-full min-w-0 items-center justify-start gap-2" aria-label="Main navigation">
            <NavigationList as="div" links={NAV_PRIMARY} />

            <div ref={featuresWrapRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setFeaturesOpen((prev) => !prev);
                  setMoreOpen(false);
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  featuresActive || featuresOpen
                    ? "bg-primary/15 text-primary-dark ring-1 ring-primary/25"
                    : "text-gray-700 hover:bg-primary/10 hover:text-primary-dark hover:ring-1 hover:ring-primary/15"
                }`}
                aria-expanded={featuresOpen}
                aria-haspopup="menu"
              >
                {t("nav.features")}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>

              {featuresOpen ? (
                <div className="fade-up absolute left-0 top-full z-[210] mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <div role="menu" aria-label={t("nav.features")} className="flex flex-col gap-1">
                    <NavigationList as="div" dense links={NAV_FEATURES} onNavigate={() => setFeaturesOpen(false)} />
                  </div>
                  {!user ? (
                    <div className="mt-2 border-t border-gray-100 pt-2">
                      <Link
                        href={`/login?next=${encodeURIComponent(normalizedPath)}`}
                        className="block rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary-dark hover:bg-primary/15"
                      >
                        {t("common.login")}
                      </Link>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div ref={moreWrapRef} className="relative">
              <button
                type="button"
                onClick={() => {
                  setMoreOpen((prev) => !prev);
                  setFeaturesOpen(false);
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                  moreActive || moreOpen
                    ? "bg-primary/15 text-primary-dark ring-1 ring-primary/25"
                    : "text-gray-700 hover:bg-primary/10 hover:text-primary-dark hover:ring-1 hover:ring-primary/15"
                }`}
                aria-expanded={moreOpen}
                aria-haspopup="menu"
              >
                {t("nav.more")}
                <ChevronDown className="h-4 w-4" aria-hidden />
              </button>

              {moreOpen ? (
                <div className="fade-up absolute left-0 top-full z-[210] mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
                  <div role="menu" aria-label={t("nav.more")} className="flex flex-col gap-1">
                    <NavigationList as="div" dense links={NAV_MORE} onNavigate={() => setMoreOpen(false)} />
                  </div>
                </div>
              ) : null}
            </div>
          </nav>
        </div>
      </div>

	      {showOnboardingBanner ? (
	        <div className="border-t border-gray-100 bg-white/70">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2">
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">{t("onboarding.bannerTitle")}</span>{" "}
              <span className="text-gray-500">
                ({onboarding.summaryQ.data?.progress?.pct ?? 0}%)
              </span>
            </p>
            <Link
              href={onboarding.nextAction?.cta_path || "/onboarding"}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary hover:bg-primary/15"
            >
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        </div>
      ) : null}

      {mobileDrawerPortal}
    </header>
  );
}

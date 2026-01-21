"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { href: "/", labelKey: "nav.home" },
  { href: "/pricing", labelKey: "nav.pricing" },
  { href: "/status", labelKey: "nav.status" },
  { href: "/market", labelKey: "nav.market" },
  { href: "/rankings", labelKey: "nav.rankings" },
  { href: "/calendar", labelKey: "nav.calendar" },
  { href: "/chart", labelKey: "nav.charts" },
  { href: "/screener", labelKey: "nav.screener" },
  { href: "/portfolio", labelKey: "nav.portfolio" },
  { href: "/research", labelKey: "nav.research" },
  { href: "/watchlists", labelKey: "nav.watchlists" },
  { href: "/usage", labelKey: "nav.usage" },
  { href: "/billing", labelKey: "nav.billing" },
  { href: "/indicators", labelKey: "nav.ai", pro: true },
  { href: "/news", labelKey: "nav.news" },
  { href: "/alerts", labelKey: "nav.alerts" },
  { href: "/changelog", labelKey: "nav.changelog" },
  { href: "/support", labelKey: "nav.support" }
];

const PRIMARY_HREFS = ["/market", "/chart", "/rankings", "/calendar", "/news"];
const WORK_HREFS = ["/screener", "/portfolio", "/research", "/watchlists", "/alerts", "/usage", "/billing", "/indicators"];
const MORE_HREFS = ["/pricing", "/status", "/changelog", "/support"];

const AUTH_REQUIRED_PREFIXES = ["/watchlists", "/alerts", "/portfolio", "/research", "/screener", "/usage", "/billing", "/indicators"];

type Props = {
  className?: string;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
};

export default function Navigation({ className = "", onNavigate, variant = "desktop" }: Props) {
  const pathname = usePathname() || "/";
  const { isPro, user } = useAuth();
  const { t } = useTranslation();

  const [workOpen, setWorkOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const workWrapRef = useRef<HTMLDivElement | null>(null);
  const moreWrapRef = useRef<HTMLDivElement | null>(null);

  const groups = useMemo(() => {
    const byHref = new Map(NAV_LINKS.map((it) => [it.href, it]));
    const pick = (hrefs: string[]) => hrefs.map((href) => byHref.get(href)).filter(Boolean) as typeof NAV_LINKS;
    return {
      primary: pick(PRIMARY_HREFS),
      work: pick(WORK_HREFS),
      more: pick(MORE_HREFS),
      all: NAV_LINKS
    };
  }, []);

  const workActive = groups.work.some((link) => (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)));
  const moreActive = groups.more.some((link) => (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)));

  const isAuthRequired = (href: string) => AUTH_REQUIRED_PREFIXES.some((prefix) => href.startsWith(prefix));
  const getHref = (href: string) => {
    if (user) return href;
    if (!isAuthRequired(href)) return href;
    return `/login?next=${encodeURIComponent(href)}`;
  };

  // 변경 이유: 헤더 네비 드롭다운이 열린 채로 남아 반응형 전환 시 UI가 꼬이지 않도록, 바깥 클릭/ESC로 닫힘 처리
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setWorkOpen(false);
      setMoreOpen(false);
    }
    function onPointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (workOpen && workWrapRef.current && !workWrapRef.current.contains(target)) setWorkOpen(false);
      if (moreOpen && moreWrapRef.current && !moreWrapRef.current.contains(target)) setMoreOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown, true);
    document.addEventListener("touchstart", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown, true);
      document.removeEventListener("touchstart", onPointerDown, true);
    };
  }, [workOpen, moreOpen]);

  const baseLink =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  const activeLink = "bg-primary/15 text-primary-dark ring-1 ring-primary/25";
  const idleLink = "text-gray-700 hover:bg-primary/10 hover:text-primary-dark hover:ring-1 hover:ring-primary/15";

  const renderLink = (link: (typeof NAV_LINKS)[number], { dense }: { dense?: boolean } = {}) => {
    const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
    const href = getHref(link.href);
    const showLock = !user && isAuthRequired(link.href);
    const base = dense
      ? "flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      : baseLink;
    const active = dense ? "bg-primary/10 text-primary-dark" : activeLink;
    const idle = dense ? "text-gray-700 hover:bg-primary/5 hover:text-primary-dark" : idleLink;

    return (
      <Link
        key={link.href}
        href={href}
        onClick={() => {
          setWorkOpen(false);
          setMoreOpen(false);
          onNavigate?.();
        }}
        className={`${base} ${isActive ? active : idle}`}
        aria-current={isActive ? "page" : undefined}
      >
        <span className="min-w-0 truncate">{t(link.labelKey)}</span>
        <span className="flex items-center gap-2">
          {showLock ? <Lock className="h-3.5 w-3.5 text-gray-400" aria-hidden /> : null}
          {link.pro ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                isPro ? "bg-primary/15 text-primary-dark" : "bg-gray-100 text-gray-500"
              }`}
            >
              PRO
            </span>
          ) : null}
        </span>
      </Link>
    );
  };

  const dropdownButtonBase =
    "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";
  const dropdownButtonActive = "bg-primary/15 text-primary-dark ring-1 ring-primary/25";
  const dropdownButtonIdle = "text-gray-700 hover:bg-primary/10 hover:text-primary-dark hover:ring-1 hover:ring-primary/15";

  if (variant === "mobile") {
    return (
      <nav className={className} aria-label="Main navigation">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            {([NAV_LINKS[0], ...groups.primary] as typeof NAV_LINKS).map((link) => renderLink(link, { dense: true }))}
          </div>

          <details className="rounded-2xl border border-gray-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <span>{t("nav.work")}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
            </summary>
            <div className="flex flex-col gap-1 border-t border-gray-100 p-2">{groups.work.map((link) => renderLink(link, { dense: true }))}</div>
          </details>

          <details className="rounded-2xl border border-gray-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm font-semibold text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
              <span>{t("nav.more")}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" aria-hidden />
            </summary>
            <div className="flex flex-col gap-1 border-t border-gray-100 p-2">{groups.more.map((link) => renderLink(link, { dense: true }))}</div>
          </details>
        </div>
      </nav>
    );
  }

  return (
    <nav className={className} aria-label="Main navigation">
      <div className="flex min-w-0 items-center gap-2">
        {groups.primary.map((link) => renderLink(link))}

        <div ref={workWrapRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setWorkOpen((prev) => !prev);
              setMoreOpen(false);
            }}
            className={`${dropdownButtonBase} ${workActive || workOpen ? dropdownButtonActive : dropdownButtonIdle}`}
            aria-expanded={workOpen}
            aria-haspopup="menu"
          >
            {t("nav.work")}
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          {workOpen ? (
            <div className="fade-up absolute left-0 top-full mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
              <div className="flex flex-col gap-1">{groups.work.map((link) => renderLink(link, { dense: true }))}</div>
              {!user ? (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  <Link
                    href={`/login?next=${encodeURIComponent(pathname)}`}
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
              setWorkOpen(false);
            }}
            className={`${dropdownButtonBase} ${moreActive || moreOpen ? dropdownButtonActive : dropdownButtonIdle}`}
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            {t("nav.more")}
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
          {moreOpen ? (
            <div className="fade-up absolute left-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 bg-white p-2 shadow-lg">
              <div className="flex flex-col gap-1">{groups.more.map((link) => renderLink(link, { dense: true }))}</div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

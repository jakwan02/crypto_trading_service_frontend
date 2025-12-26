"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Market" },
  { href: "/chart", label: "Charts" },
  { href: "/indicators", label: "AI Insights", pro: true },
  { href: "/news", label: "News" },
  { href: "/alerts", label: "Alerts" }
];

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export default function Navigation({ className = "", onNavigate }: Props) {
  const pathname = usePathname() || "/";
  const { isPro } = useAuth();

  return (
    <nav className={className} aria-label="Main navigation">
      {NAV_LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const base = "rounded-full px-3 py-1 text-sm font-medium transition inline-flex items-center gap-2";
        const active = "bg-primary/10 text-primary";
        const idle = "text-gray-600 hover:text-gray-900";

        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`${base} ${isActive ? active : idle}`}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
            {link.pro ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide ${
                  isPro ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-500"
                }`}
              >
                PRO
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

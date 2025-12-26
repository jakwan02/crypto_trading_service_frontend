"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/market", label: "Market" },
  { href: "/education", label: "Education" },
  { href: "/account", label: "Account" }
];

type Props = {
  className?: string;
  onNavigate?: () => void;
};

export default function Navigation({ className = "", onNavigate }: Props) {
  const pathname = usePathname() || "/";

  return (
    <nav className={className} aria-label="Main navigation">
      {NAV_LINKS.map((link) => {
        const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const base = "rounded-full px-3 py-1 text-sm font-medium transition";
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
          </Link>
        );
      })}
    </nav>
  );
}

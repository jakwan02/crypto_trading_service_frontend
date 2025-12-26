"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import Navigation from "./Navigation";

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const user: { name: string } | null = null;

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm">
              CD
            </span>
            <div className="leading-tight">
              <span className="block text-base font-semibold text-gray-900">CoinDash</span>
              <span className="block text-xs text-secondary">Crypto trading hub</span>
            </div>
          </Link>
        </div>

        <Navigation className="hidden items-center gap-2 md:flex" />

        <div className="hidden items-center gap-2 md:flex">
          {!user ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-full border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-gray-300"
              >
                {user.name}
                <ChevronDown className="h-4 w-4" />
              </button>
              {accountOpen ? (
                <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                  <Link
                    href="/account"
                    className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Account
                  </Link>
                  <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Logout
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
          className="rounded-full border border-gray-200 p-2 text-gray-600 transition hover:border-gray-300 hover:text-gray-900 md:hidden"
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
          className={`absolute left-0 top-0 h-full w-72 transform bg-white shadow-xl transition ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
            <span className="text-sm font-semibold text-gray-900">Menu</span>
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
            <Navigation
              className="flex flex-col items-start gap-2"
              onNavigate={() => setMobileOpen(false)}
            />
            <div className="border-t border-gray-200 pt-4">
              {!user ? (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white"
                  >
                    Sign Up
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/account"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    Account
                  </Link>
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    Logout
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

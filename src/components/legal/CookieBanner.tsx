"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import ApiErrorView from "@/components/common/ApiErrorView";
import { acceptLegal, getLatestLegal } from "@/lib/legalClient";

type StoredConsent = { version: string; choice: "necessary" | "all"; at: string };

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const target = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const p of parts) {
    if (!p.startsWith(target)) continue;
    return decodeURIComponent(p.slice(target.length));
  }
  return "";
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  const base = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${Math.max(1, maxAgeSec)}; SameSite=Lax`;
  document.cookie = base;
}

function safeParseConsent(raw: string): StoredConsent | null {
  try {
    const obj = JSON.parse(raw) as StoredConsent;
    if (!obj || typeof obj !== "object") return null;
    if (!obj.version || !obj.choice) return null;
    if (obj.choice !== "necessary" && obj.choice !== "all") return null;
    return obj;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const { t, i18n } = useTranslation();
  const { user, sessionReady } = useAuth();
  const locale = useMemo(() => String(i18n.language || "ko").split("-")[0], [i18n.language]);

  const latestQ = useQuery({
    queryKey: ["legal.cookie.latest", locale],
    queryFn: () => getLatestLegal("cookie", locale),
    retry: 1
  });

  const [dismissed, setDismissed] = useState(false);
  const stored = useMemo(() => {
    const fromCookie = readCookie("cookie_consent");
    if (fromCookie) return safeParseConsent(fromCookie);
    try {
      const fromLs = typeof window !== "undefined" ? String(window.localStorage.getItem("cookie_consent") || "") : "";
      return safeParseConsent(fromLs);
    } catch {
      return null;
    }
  }, []);

  const latestVersion = String(latestQ.data?.version || "").trim();
  const shouldShow = useMemo(() => {
    if (dismissed) return false;
    if (stored && latestVersion && stored.version === latestVersion) return false;
    return true;
  }, [dismissed, stored, latestVersion]);

  async function persist(choice: "necessary" | "all") {
    const v = latestVersion || "unknown";
    const payload: StoredConsent = { version: v, choice, at: new Date().toISOString() };
    const raw = JSON.stringify(payload);
    try {
      writeCookie("cookie_consent", raw, 365 * 24 * 3600);
    } catch {
      try {
        window.localStorage.setItem("cookie_consent", raw);
      } catch {
        // ignore
      }
    }
    setDismissed(true);

    if (!sessionReady || !user || !latestVersion) return;
    try {
      await acceptLegal({ kind: "cookie", version: latestVersion, locale });
    } catch {
      // ignore
    }
  }

  if (!shouldShow) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-50 px-4">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-gray-200 bg-white/95 p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-gray-700">
            <p className="font-semibold text-gray-900">{t("cookie.title")}</p>
            <p className="mt-1 text-xs text-gray-600">
              {t("cookie.desc")}{" "}
              <Link href="/cookies" className="font-semibold text-primary hover:underline">
                {t("cookie.learnMore")}
              </Link>
            </p>
            {latestQ.isError ? (
              <div className="mt-3">
                <ApiErrorView error={latestQ.error} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void persist("necessary")}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("cookie.onlyNecessary")}
            </button>
            <button
              type="button"
              onClick={() => void persist("all")}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("cookie.acceptAll")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

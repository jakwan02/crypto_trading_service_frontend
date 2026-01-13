"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

type DeletedInfo = {
  email: string;
  days: number | null;
};

function parseDeletedInfo(search: string): DeletedInfo {
  const params = new URLSearchParams(search || "");
  const email = params.get("email") || "";
  const rawDays = params.get("days") || "";
  const parsedDays = rawDays ? Number(rawDays) : NaN;
  const days = Number.isFinite(parsedDays) ? parsedDays : null;
  return { email, days };
}

export default function AccountDeletedPage() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const [info, setInfo] = useState<DeletedInfo>({ email: "", days: null });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setInfo(parseDeletedInfo(window.location.search));
    update();
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  useEffect(() => {
    void signOut();
  }, [signOut]);

  const loginHref = useMemo(() => {
    if (!info.email) return "/login";
    return `/login?email=${encodeURIComponent(info.email)}`;
  }, [info.email]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">{t("security.deletedTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("security.deletedDesc")}</p>

          {info.days !== null ? (
            <p className="mt-4 text-sm text-gray-700">{t("security.deletedPurgeAfter", { days: info.days })}</p>
          ) : null}
          <p className="mt-2 text-xs text-gray-500">{t("security.deletedRejoinHint")}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={loginHref}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink"
            >
              {t("security.deletedCtaLogin")}
            </Link>
            <Link
              href="/signup"
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
            >
              {t("security.deletedCtaSignup")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

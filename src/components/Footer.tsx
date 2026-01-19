"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 text-xs text-gray-500">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-900">{t("footer.company")}</p>
            <p>{t("footer.businessNumber")}</p>
            <p>{t("footer.ceo")}</p>
            <p>{t("footer.address")}</p>
            <p>{t("footer.email")}</p>
          </div>
          <div className="grid gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {t("footer.policy")}
            </span>
            <Link href="/pricing" className="hover:text-gray-700">
              {t("footer.pricing")}
            </Link>
            <Link href="/status" className="hover:text-gray-700">
              {t("footer.status")}
            </Link>
            <Link href="/changelog" className="hover:text-gray-700">
              {t("footer.changelog")}
            </Link>
            <Link href="/support" className="hover:text-gray-700">
              {t("footer.support")}
            </Link>
            <Link href="/terms" className="hover:text-gray-700">
              {t("footer.terms")}
            </Link>
            <Link href="/privacy" className="hover:text-gray-700">
              {t("footer.privacy")}
            </Link>
            <Link href="/cookies" className="hover:text-gray-700">
              {t("footer.cookies")}
            </Link>
            <Link href="/disclaimer" className="hover:text-gray-700">
              {t("footer.disclaimer")}
            </Link>
            <Link href="/account" className="hover:text-gray-700">
              {t("footer.subscription")}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-gray-400">{t("footer.copyright")}</p>
      </div>
    </footer>
  );
}

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
            <p>사업자등록번호: 123-45-67890</p>
            <p>대표자: 홍길동</p>
            <p>주소: 서울특별시 강남구 테헤란로 123</p>
            <p>이메일: support@coindash.com</p>
          </div>
          <div className="grid gap-2 text-xs">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              {t("footer.policy")}
            </span>
            <Link href="/terms" className="hover:text-gray-700">
              {t("footer.terms")}
            </Link>
            <Link href="/privacy" className="hover:text-gray-700">
              {t("footer.privacy")}
            </Link>
            <Link href="/account" className="hover:text-gray-700">
              {t("footer.subscription")}
            </Link>
          </div>
        </div>
        <p className="mt-6 text-[11px] text-gray-400">
          (c) 2025 CoinDash Labs. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

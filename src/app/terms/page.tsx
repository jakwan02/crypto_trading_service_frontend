"use client";

import { useTranslation } from "react-i18next";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">{t("legal.termsTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("legal.termsDesc")}</p>
        <div className="mt-6 space-y-4 rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p>{t("legal.termsItems.item1")}</p>
          <p>{t("legal.termsItems.item2")}</p>
          <p>{t("legal.termsItems.item3")}</p>
          <p>{t("legal.termsItems.item4")}</p>
        </div>
      </div>
    </main>
  );
}

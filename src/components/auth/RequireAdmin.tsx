"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

type Props = {
  children: React.ReactNode;
};

export default function RequireAdmin({ children }: Props) {
  const { t } = useTranslation();
  const { user, sessionReady, isAdmin } = useAuth();

  if (!sessionReady) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto flex w-full max-w-md items-center justify-center px-4 py-24">
          <p className="text-sm text-gray-500">{t("common.loading")}</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">{t("errors.unauthorized.title")}</h1>
            <p className="mt-2 text-sm text-gray-600">{t("errors.unauthorized.desc")}</p>
            <div className="mt-4">
              <Link
                href="/login"
                className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
              >
                {t("common.login")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-lg font-semibold text-gray-900">{t("admin.forbiddenTitle")}</h1>
            <p className="mt-2 text-sm text-gray-600">{t("admin.forbiddenDesc")}</p>
            <div className="mt-4">
              <Link
                href="/"
                className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("admin.goHome")}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}


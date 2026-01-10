"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  "upgrade.features.item1",
  "upgrade.features.item2",
  "upgrade.features.item3",
  "upgrade.features.item4"
];

export default function UpgradePage() {
  const { isPro } = useAuth();
  const [status, setStatus] = useState("");
  const { t } = useTranslation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(t("upgrade.statusPending"));
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("upgrade.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("upgrade.desc")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t("upgrade.planTitle")}</h2>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              {FEATURES.map((item) => (
                <li key={item} className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2">
                  {t(item)}
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-sm font-semibold text-gray-900">{t("upgrade.price")}</p>
              <p className="mt-1 text-xs text-gray-500">{t("upgrade.priceNote")}</p>
            </div>
          </section>

          <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">{t("upgrade.payTitle")}</h2>
            <div className="mt-4 space-y-3 text-sm text-gray-600">
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("upgrade.cardNumber")}</label>
                <input
                  required
                  placeholder={t("upgrade.cardNumberPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("upgrade.cardExpiry")}</label>
                  <input
                    required
                    placeholder={t("upgrade.cardExpiryPlaceholder")}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("upgrade.cvc")}</label>
                  <input
                    required
                    placeholder={t("upgrade.cvcPlaceholder")}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("upgrade.cta")}
            </button>
            {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
            {isPro ? (
              <p className="mt-3 text-xs text-emerald-600">{t("upgrade.active")}</p>
            ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}

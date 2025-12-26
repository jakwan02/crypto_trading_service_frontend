"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  "전체 심볼 실시간 업데이트",
  "무제한 알림 및 즉시 푸시",
  "AI 인사이트 리포트 전체 공개",
  "광고 제거 및 고급 지표 제공"
];

export default function UpgradePage() {
  const { isPro, setPlan } = useAuth();
  const [status, setStatus] = useState("");
  const { t } = useTranslation();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPlan("pro");
    setStatus("Pro 구독이 활성화되었습니다. 계정 페이지에서 상태를 확인하세요.");
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
                  {item}
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
                <label className="text-xs font-semibold text-gray-600">카드 번호</label>
                <input
                  required
                  placeholder="1234 5678 9012 3456"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-gray-600">만료일</label>
                  <input
                    required
                    placeholder="MM/YY"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-600">CVC</label>
                  <input
                    required
                    placeholder="123"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
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

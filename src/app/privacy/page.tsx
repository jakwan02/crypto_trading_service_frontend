"use client";

import { useTranslation } from "react-i18next";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold text-gray-900">{t("legal.privacyTitle")}</h1>
        <p className="mt-2 text-sm text-gray-500">{t("legal.privacyDesc")}</p>
        <div className="mt-6 space-y-4 rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
          <p>1. 이메일, 로그인 정보는 서비스 제공 목적에 한해 처리됩니다.</p>
          <p>2. 결제 정보는 승인 과정에서 암호화되어 저장 및 전송됩니다.</p>
          <p>3. 사용자는 언제든지 개인정보 열람 및 수정 요청을 할 수 있습니다.</p>
          <p>4. 자세한 정책은 고객센터를 통해 안내드립니다.</p>
        </div>
      </div>
    </main>
  );
}

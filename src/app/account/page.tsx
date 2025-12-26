"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AccountPage() {
  const { user, isPro } = useAuth();
  const displayName = useMemo(() => {
    if (!user) return "게스트";
    return (
      String(user.user_metadata?.full_name || user.user_metadata?.name || "").trim() ||
      String(user.email || "사용자")
    );
  }, [user]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Account</h1>
          <p className="mt-1 text-sm text-gray-500">프로필, 구독, 보안 설정을 한 곳에서 관리하세요.</p>
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">프로필</h2>
            <dl className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <dt>이름</dt>
                <dd className="font-medium text-gray-900">{displayName}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>이메일</dt>
                <dd className="font-medium text-gray-900">{user?.email || "로그인 필요"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>가입일</dt>
                <dd>2025-02-01</dd>
              </div>
            </dl>
            <button type="button" className="mt-4 text-xs font-semibold text-primary">
              프로필 편집
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">구독 상태</h2>
            <p className="mt-3 text-sm text-gray-600">
              현재 플랜:{" "}
              <span className={`font-semibold ${isPro ? "text-primary" : "text-gray-700"}`}>
                {isPro ? "Pro" : "Free"}
              </span>
            </p>
            <p className="mt-2 text-xs text-gray-500">
              {isPro ? "다음 결제일: 2025-12-31" : "Pro로 업그레이드하면 모든 지표를 확인할 수 있습니다."}
            </p>
            <Link
              href="/upgrade"
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white"
            >
              {isPro ? "구독 관리" : "Pro 업그레이드"}
            </Link>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">보안</h2>
            <p className="mt-3 text-sm text-gray-600">
              2FA, 로그인 알림, 세션 관리 기능을 설정하세요.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              보안 설정 관리
            </button>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">결제 수단</h2>
            <p className="mt-2 text-sm text-gray-600">등록된 카드: **** 4242</p>
            <p className="mt-1 text-xs text-gray-500">다음 결제일: 2025-12-31</p>
            <button
              type="button"
              className="mt-4 rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              결제 수단 변경
            </button>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">알림 설정</h2>
            <p className="mt-2 text-sm text-gray-600">웹 푸시 · 이메일 · 앱 알림 채널을 관리하세요.</p>
            <Link
              href="/alerts"
              className="mt-4 inline-flex rounded-full border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700"
            >
              알림 관리 이동
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

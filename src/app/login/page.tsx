"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [status, setStatus] = useState<string>("");
  const { signInWithGoogle } = useAuth();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Google로 로그인</h1>
          <p className="mt-2 text-sm text-gray-500">
            간편한 소셜 로그인을 통해 즉시 서비스에 접근할 수 있습니다.
          </p>

          <button
            type="button"
            onClick={async () => {
              setStatus("Google 로그인으로 이동합니다.");
              await signInWithGoogle();
            }}
            className="mt-6 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            Google로 계속하기
          </button>

          {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <Link href="/signup" className="font-medium text-primary hover:text-primary-dark">
              처음 방문하셨나요? 가입 안내
            </Link>
            <a href="mailto:support@coindash.com" className="hover:text-gray-700">
              로그인 도움말
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            로그인을 진행하면 서비스 약관과 개인정보 처리방침에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}

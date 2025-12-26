"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const [status, setStatus] = useState<string>("");
  const { signInWithGoogle } = useAuth();

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">가입 안내</h1>
          <p className="mt-2 text-sm text-gray-500">
            CoinDash는 Google 소셜 로그인만 제공합니다. 클릭 한 번으로 계정이 생성됩니다.
          </p>

          <button
            type="button"
            onClick={async () => {
              setStatus("Google 로그인으로 이동합니다.");
              await signInWithGoogle();
            }}
            className="mt-6 w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
          >
            Google로 가입하기
          </button>

          {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}

          <div className="mt-6 text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              로그인
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

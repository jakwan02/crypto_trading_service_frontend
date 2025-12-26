"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {
  const [status, setStatus] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
      confirmPassword: String(formData.get("confirmPassword") || ""),
      acceptedTerms: Boolean(formData.get("terms"))
    };

    console.log("signup_submit", payload);
    // TODO: POST /api/signup 연동 시 아래 로직을 연결하세요.
    // await fetch("/api/signup", { method: "POST", body: JSON.stringify(payload) });

    setStatus("회원가입 요청이 전송되었습니다. 이메일을 확인해주세요.");
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Sign Up</h1>
          <p className="mt-2 text-sm text-gray-500">간단한 정보 입력으로 계정을 만들어보세요.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="name">
                Name (Optional)
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              서비스 약관 및 개인정보 처리방침에 동의합니다.
            </label>

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
            >
              Create Account
            </button>
          </form>

          {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}

          <div className="mt-6 text-sm text-gray-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary hover:text-blue-600">
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

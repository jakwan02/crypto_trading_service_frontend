"use client";

import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const [status, setStatus] = useState<string>("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || "")
    };
    console.log("login_submit", payload);
    setStatus("로그인 요청이 전송되었습니다. 곧 안내를 확인해주세요.");
  };

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">Login</h1>
          <p className="mt-2 text-sm text-gray-500">
            계정 정보를 입력하고 즉시 거래 준비를 완료하세요.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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

            <button
              type="submit"
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-600"
            >
              Login
            </button>
          </form>

          {status ? <p className="mt-4 text-xs text-primary">{status}</p> : null}

          <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
            <Link href="/signup" className="font-medium text-primary hover:text-blue-600">
              계정이 없으신가요? Sign Up
            </Link>
            <a href="mailto:support@coindash.com" className="hover:text-gray-700">
              비밀번호 찾기
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            KYC 및 보안 설정은 로그인 후 계정 메뉴에서 진행할 수 있습니다.
          </p>
        </div>
      </div>
    </main>
  );
}

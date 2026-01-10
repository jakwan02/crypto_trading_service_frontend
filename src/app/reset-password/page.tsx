"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/appClient";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();
  const [token, setToken] = useState("");

  useEffect(() => {
    /* # 변경 이유: Next prerender 시 useSearchParams 사용으로 빌드 오류가 발생해, 클라이언트에서만 token 파라미터를 파싱 */
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setStatus("");
    if (!token) {
      setError(t("auth.resetMissingToken"));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/auth/password/reset", {
        method: "POST",
        json: { token, password }
      });
      setStatus(t("auth.resetSuccess"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.loginFailed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.resetTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.resetDesc")}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.passwordLabel")}</label>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.passwordConfirmLabel")}</label>
              <input
                required
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder={t("auth.passwordConfirmPlaceholder")}
                autoComplete="new-password"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("auth.resetCta")}
            </button>
          </form>

          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaTicket, setMfaTicket] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signInWithGoogle, login } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = useMemo(() => {
    const next = searchParams?.get("next");
    if (next && next.startsWith("/")) return next;
    return "/market";
  }, [searchParams]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const result = await login(email, password, mfaRequired ? { otpCode, mfaTicket } : undefined);
      if (result.mfaRequired) {
        setMfaRequired(true);
        setMfaTicket(result.mfaTicket || "");
        setStatus(t("auth.mfaPrompt"));
        return;
      }
      router.replace(nextPath);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.loginFailed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (submitting) return;
    setError("");
    setStatus(t("auth.redirecting"));
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace(nextPath);
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
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.loginTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.loginDesc")}</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.emailLabel")}</label>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.passwordLabel")}</label>
              <input
                required
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="current-password"
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
            {mfaRequired ? (
              <div>
                <label className="text-xs font-semibold text-gray-600">{t("auth.otpLabel")}</label>
                <input
                  required
                  inputMode="numeric"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value)}
                  placeholder={t("auth.otpPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {mfaRequired ? t("auth.otpCta") : t("auth.loginButton")}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <Link href="/forgot-password" className="hover:text-gray-700">
              {t("auth.forgotLink")}
            </Link>
            <Link href="/signup" className="font-medium text-primary hover:text-primary-dark">
              {t("auth.signupLink")}
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">{t("auth.or")}</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={submitting}
            className="mt-4 w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
          >
            {t("auth.googleCta")}
          </button>

          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}

          <p className="mt-6 text-xs text-gray-400">{t("auth.agreement")}</p>
        </div>
      </div>
    </main>
  );
}

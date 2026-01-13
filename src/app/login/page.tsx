"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { buildAuthMessage, parseAuthError } from "@/lib/auth/authErrors";
import { resolveNextPath } from "@/lib/auth/redirect";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState("/market");
  const [lockUntil, setLockUntil] = useState("");
  const [retryAfterSec, setRetryAfterSec] = useState<number | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const { signInWithGoogleIdToken, login } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    /* # 변경 이유: Next prerender 시 useSearchParams 사용으로 빌드 오류가 발생해, 클라이언트에서만 next 파라미터를 파싱 */
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const next = resolveNextPath(window.location.search, "/market");
    const nextEmail = params.get("email");
    if (nextEmail) setEmail(nextEmail);
    setNextPath(next);
  }, []);

  useEffect(() => {
    if (retryAfterSec === null) return;
    setRemainingSec(retryAfterSec);
    const timer = window.setInterval(() => {
      setRemainingSec((prev) => {
        if (prev === null) return null;
        return Math.max(0, prev - 1);
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAfterSec]);

  const isLocked = retryAfterSec !== null && (remainingSec ?? retryAfterSec) > 0;

  const formatRemaining = (value: number | null) => {
    if (value === null) return "";
    const min = Math.floor(value / 60);
    const sec = value % 60;
    return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setErrorDetail("");
    setEmailNotVerified(false);
    setStatus("");
    setSubmitting(true);
    try {
      const result = await login(email, password, mfaRequired ? { mfaCode: otpCode } : undefined);
      if (result.mfaRequired) {
        setMfaRequired(true);
        setStatus(t("auth.mfaPrompt"));
        return;
      }
      setRetryAfterSec(null);
      setRemainingSec(null);
      setLockUntil("");
      router.replace(nextPath);
    } catch (err) {
      const info = parseAuthError(err);
      if (info) {
        const message = buildAuthMessage(info, t);
        setError(message.message);
        setErrorDetail(message.detail || "");
        if (info.code === "email_not_verified") {
          setEmailNotVerified(true);
        } else if (info.code === "account_locked") {
          setLockUntil(message.lockUntil || "");
          setRetryAfterSec(message.retryAfterSec ?? null);
          setStatus(t("auth.lockedCtaHint"));
        }
      } else {
        const fallback = err instanceof Error ? err.message : t("auth.loginFailed");
        setError(fallback);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleIdToken = async (idToken: string) => {
    if (submitting) return;
    setError("");
    setStatus(t("auth.redirecting"));
    setSubmitting(true);
    try {
      await signInWithGoogleIdToken(idToken);
      router.replace(nextPath);
    } catch (err) {
      const info = parseAuthError(err);
      if (info) {
        const message = buildAuthMessage(info, t);
        setError(message.message);
      } else {
        const message = err instanceof Error ? err.message : t("auth.loginFailed");
        setError(message);
      }
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

          {/* # 변경 이유: 로그인 폼의 예시 텍스트(placeholder)를 제거해 입력 UX를 단순화 */}
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.emailLabel")}</label>
              <input
                required
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                  className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
                />
              </div>
            ) : null}
            <button
              type="submit"
              disabled={submitting || isLocked}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
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

          <div className="mt-4">
            {/* # 변경 이유: One Tap(prompt) 대신 공식 Google 버튼(renderButton)으로 기업형 로그인 UX 제공 */}
            <GoogleSignInButton
              onIdToken={handleGoogleIdToken}
              disabled={submitting}
              onError={setError}
              showInlineError={false}
            />
          </div>

          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {errorDetail ? <p className="mt-2 text-xs text-rose-500">{errorDetail}</p> : null}
          {emailNotVerified ? (
            <Link
              href={`/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`}
              className="mt-3 inline-flex text-xs font-semibold text-primary"
            >
              {t("auth.verifyNowCta")}
            </Link>
          ) : null}
          {isLocked ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
              <p>{t("auth.lockedUntil", { time: lockUntil ? new Date(lockUntil).toLocaleString() : "-" })}</p>
              <p>{t("auth.lockedRemaining", { remain: formatRemaining(remainingSec) })}</p>
              <Link
                href={`/forgot-password?email=${encodeURIComponent(email || "")}`}
                className="mt-3 inline-flex rounded-full border border-amber-200 px-3 py-2 text-[11px] font-semibold text-amber-700"
              >
                {t("auth.lockedResetCta")}
              </Link>
            </div>
          ) : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}

          <p className="mt-6 text-xs text-gray-400">{t("auth.agreement")}</p>
        </div>
      </div>
    </main>
  );
}

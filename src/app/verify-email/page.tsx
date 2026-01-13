"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/appClient";
import { buildAuthMessage, parseAuthError } from "@/lib/auth/authErrors";
import { resolveNextPath } from "@/lib/auth/redirect";

type VerifyState = "idle" | "verifying" | "verified" | "already_verified" | "expired" | "invalid";

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"email" | "token">("email");
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [cooldown, setCooldown] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [nextPath, setNextPath] = useState("/market");

  useEffect(() => {
    /* # 변경 이유: Next prerender 시 useSearchParams 사용으로 빌드 오류가 발생해, 클라이언트에서만 query 파라미터를 파싱 */
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextEmail = params.get("email") || "";
    const nextToken = params.get("token") || "";
    const next = resolveNextPath(window.location.search, "/market");
    setEmail(nextEmail);
    setToken(nextToken);
    setMode(nextToken ? "token" : "email");
    setNextPath(next);
    if (nextEmail && !nextToken) setStatus(t("auth.signupSuccess"));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!token) return;
    setVerifyState("verifying");
    setStatus("");
    setError("");
    setSubmitting(true);
    void (async () => {
      try {
        const res = await apiRequest<{ ok: boolean; state?: string; email?: string }>("/auth/email/verify", {
          method: "POST",
          json: { token }
        });
        if (res?.email && !email) setEmail(res.email);
        if (res?.state === "already_verified") {
          setVerifyState("already_verified");
          setStatus(t("auth.verifyAlready"));
        } else {
          setVerifyState("verified");
          setStatus(t("auth.verifySuccess"));
        }
      } catch (err) {
        const info = parseAuthError(err);
        if (info?.code === "expired_token") {
          setVerifyState("expired");
          setError(t("auth.verifyExpired"));
        } else if (info?.code === "invalid_token") {
          setVerifyState("invalid");
          setError(t("auth.verifyInvalid"));
        } else {
          setVerifyState("invalid");
          setError(info ? buildAuthMessage(info, t).message : t("auth.loginFailed"));
        }
      } finally {
        setSubmitting(false);
      }
    })();
  }, [email, t, token]);

  useEffect(() => {
    if (verifyState !== "verified" && verifyState !== "already_verified") return;
    const timer = window.setTimeout(() => {
      const target = `/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(nextPath)}`;
      router.replace(target);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [email, nextPath, router, verifyState]);

  const handleResend = async () => {
    if (submitting) return;
    setError("");
    setStatus("");
    if (!email) {
      setError(t("auth.verifyMissingEmail"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest<{ ok: boolean; cooldown_seconds?: number }>("/auth/email/resend", {
        method: "POST",
        json: { email }
      });
      if (res?.cooldown_seconds) setCooldown(res.cooldown_seconds);
      setStatus(t("auth.verifySent"));
    } catch (err) {
      const info = parseAuthError(err);
      setError(info ? buildAuthMessage(info, t).message : t("auth.loginFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const showResend = mode === "email" || verifyState === "expired" || verifyState === "invalid";
  const emailReadonly = Boolean(email) || mode === "token";

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.verifyTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.verifyDesc")}</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.emailLabel")}</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("auth.emailPlaceholder")}
                autoComplete="email"
                readOnly={emailReadonly}
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none read-only:bg-gray-50 read-only:text-gray-500"
              />
            </div>
            {showResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={submitting || cooldown > 0 || !email}
                className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
              >
                {cooldown > 0 ? t("auth.verifyResendCooldown", { seconds: cooldown }) : t("auth.verifyResend")}
              </button>
            ) : null}
          </div>

          {verifyState === "verifying" ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-500">
              <span className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-primary" />
              <span>{t("auth.verifyChecking")}</span>
            </div>
          ) : null}
          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
          {verifyState === "verified" || verifyState === "already_verified" ? (
            <p className="mt-2 text-xs text-gray-400">{t("auth.verifyAutoRedirect")}</p>
          ) : null}

          <div className="mt-6 text-sm text-gray-500">
            {verifyState === "verified" ? (
              <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                {t("auth.verifyCtaLogin")}
              </Link>
            ) : verifyState === "already_verified" ? (
              <Link href="/" className="font-medium text-primary hover:text-primary-dark">
                {t("auth.verifyCtaHome")}
              </Link>
            ) : (
              <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
                {t("auth.loginLink")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

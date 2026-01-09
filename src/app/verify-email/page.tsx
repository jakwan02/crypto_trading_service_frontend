"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/appClient";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState(() => searchParams?.get("email") || "");

  const token = useMemo(() => searchParams?.get("token") || "", [searchParams]);

  const handleVerify = async () => {
    if (submitting) return;
    setError("");
    setStatus("");
    const payload: Record<string, string> = {};
    if (token) payload.token = token;
    if (email) payload.email = email;
    if (!payload.token && !payload.email) {
      setError(t("auth.verifyMissing"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/auth/email/verify", {
        method: "POST",
        json: payload
      });
      setStatus(t("auth.verifySuccess"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.loginFailed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (submitting) return;
    setError("");
    setStatus("");
    if (!email) {
      setError(t("auth.verifyMissing"));
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest("/auth/email/resend", {
        method: "POST",
        json: { email }
      });
      setStatus(t("auth.verifySent"));
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
                className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-primary focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleVerify}
              disabled={submitting}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("auth.verifyCta")}
            </button>
            <button
              type="button"
              onClick={handleResend}
              disabled={submitting}
              className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("auth.verifyResend")}
            </button>
          </div>

          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}

          <div className="mt-6 text-sm text-gray-500">
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              {t("auth.loginLink")}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

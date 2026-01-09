"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiRequest } from "@/lib/appClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      await apiRequest("/auth/password/forgot", {
        method: "POST",
        json: { email }
      });
      setStatus(t("auth.forgotSuccess"));
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
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.forgotTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.forgotDesc")}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("auth.forgotCta")}
            </button>
          </form>

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

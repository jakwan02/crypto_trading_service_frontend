"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/appClient";
import { buildAuthMessage, parseAuthError } from "@/lib/auth/authErrors";
import { resolveNextPath } from "@/lib/auth/redirect";
import { requestGoogleIdToken } from "@/lib/googleOidc";
import { getAcc } from "@/lib/token";
import { useTranslation } from "react-i18next";

function getAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) {
    throw new Error("Missing access token.");
  }
  return { Authorization: `Bearer ${token}` };
}

export default function PasswordSetPage() {
  const PASSWORD_MIN_LENGTH = 12;
  const { user, refresh } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const [nextPath, setNextPath] = useState("/account/security");
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const mfaEnabled = Boolean(user?.mfa_enabled);
  const hasPassword = Boolean(user?.has_password);

  useEffect(() => {
    /* # 변경 이유: Next prerender 시 useSearchParams 사용으로 빌드 오류가 발생해, 클라이언트에서만 next 파라미터를 파싱 */
    if (typeof window === "undefined") return;
    setNextPath(resolveNextPath(window.location.search, "/account/security"));
  }, []);

  const validationMessage = useMemo(() => {
    if (!newPassword) return "";
    if (newPassword.length < PASSWORD_MIN_LENGTH) return t("auth.passwordTooShort");
    if (/\s/.test(newPassword)) return t("auth.passwordNoWhitespace");
    if (newPasswordConfirm && newPassword !== newPasswordConfirm) return t("auth.passwordMismatch");
    return "";
  }, [newPassword, newPasswordConfirm, t]);

  const handleGoogleReauth = async () => {
    if (submitting) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const token = await requestGoogleIdToken();
      setGoogleIdToken(token);
      setStatus(t("security.passwordSetGoogleDone"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.requestFailed");
      setError(message || t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setStatus("");

    if (hasPassword) {
      router.replace(nextPath);
      return;
    }
    if (!googleIdToken) {
      setError(t("security.passwordSetGoogleRequired"));
      return;
    }
    if (!newPassword || newPassword.length < PASSWORD_MIN_LENGTH) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (/\s/.test(newPassword)) {
      setError(t("auth.passwordNoWhitespace"));
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError(t("auth.passwordMismatch"));
      return;
    }
    if (mfaEnabled && !mfaCode) {
      setError(t("auth.errorMfaRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/auth/password/set", {
        method: "POST",
        headers: getAuthHeaders(),
        json: {
          new_password: newPassword,
          google_id_token: googleIdToken,
          mfa_code: mfaEnabled ? mfaCode : undefined
        }
      });
      await refresh();
      setStatus(t("security.passwordSetDone"));
      router.replace(nextPath);
    } catch (err) {
      const info = parseAuthError(err);
      setError(info ? buildAuthMessage(info, t).message : t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RequireAuth>
      <main className="min-h-screen bg-transparent">
        <div className="mx-auto w-full max-w-md px-4 py-12">
          <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">{t("security.passwordSetTitle")}</h1>
            <p className="mt-2 text-sm text-gray-500">{t("security.passwordSetDesc")}</p>

            {hasPassword ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-gray-700">{t("security.passwordAlreadySet")}</p>
                <Link
                  href={nextPath}
                  className="inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink"
                >
                  {t("security.passwordSetBack")}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                  <p className="font-semibold text-gray-700">{t("security.passwordSetGoogleHintTitle")}</p>
                  <p className="mt-1 text-[11px] text-gray-600">{t("security.passwordSetGoogleHint")}</p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleReauth}
                  disabled={submitting}
                  className="w-full rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  {googleIdToken ? t("security.passwordSetGoogleDoneShort") : t("security.passwordSetGoogleCta")}
                </button>

                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("security.newPasswordLabel")}</label>
                  <input
                    type="password"
                    name="password-set-new-password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder={t("security.newPasswordPlaceholder")}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600">{t("security.newPasswordConfirmLabel")}</label>
                  <input
                    type="password"
                    name="password-set-new-password-confirm"
                    autoComplete="new-password"
                    value={newPasswordConfirm}
                    onChange={(event) => setNewPasswordConfirm(event.target.value)}
                    placeholder={t("security.newPasswordConfirmPlaceholder")}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                </div>

                {mfaEnabled ? (
                  <div>
                    <label className="text-xs font-semibold text-gray-600">{t("security.mfaCodeLabel")}</label>
                    <input
                      name="password-set-mfa-code"
                      autoComplete="off"
                      inputMode="numeric"
                      value={mfaCode}
                      onChange={(event) => setMfaCode(event.target.value)}
                      placeholder={t("security.mfaCodePlaceholder")}
                      className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                    <p className="mt-2 text-[11px] text-gray-500">{t("security.passwordSetMfaHint")}</p>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting || !googleIdToken || !newPassword || !newPasswordConfirm || Boolean(validationMessage) || (mfaEnabled && !mfaCode)}
                  className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {t("security.passwordSetCta")}
                </button>

                {validationMessage ? <p className="text-xs text-rose-500">{validationMessage}</p> : null}
              </form>
            )}

            {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
            {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}


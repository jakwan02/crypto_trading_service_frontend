"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { buildAuthMessage, parseAuthError } from "@/lib/auth/authErrors";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export default function SignupPage() {
  const PASSWORD_MIN_LENGTH = 12;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signInWithGoogleIdToken, signup } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const passwordHasWhitespace = /\s/.test(password);
  const passwordTooShort = password.length < PASSWORD_MIN_LENGTH;
  const passwordValid = !passwordTooShort && !passwordHasWhitespace;
  const confirmMatches = passwordConfirm.length > 0 && password === passwordConfirm;
  const isFormValid = email.length > 0 && passwordValid && confirmMatches;

  const validatePassword = (value: string) => {
    if (value.length < PASSWORD_MIN_LENGTH) return t("auth.passwordTooShort");
    if (/\s/.test(value)) return t("auth.passwordNoWhitespace");
    return "";
  };

  const validateConfirm = (value: string) => {
    if (!value || value !== password) return t("auth.passwordMismatch");
    return "";
  };

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    setError("");
    setStatus("");
    setPasswordTouched(true);
    setConfirmTouched(true);
    const nextPasswordError = validatePassword(password);
    const nextConfirmError = validateConfirm(passwordConfirm);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    if (nextPasswordError || nextConfirmError) return;
    setSubmitting(true);
    try {
      await signup(email, password);
      setStatus(t("auth.signupSuccess"));
      router.replace(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      const info = parseAuthError(err);
      if (info?.code === "password_too_short") setError(t("auth.passwordTooShort"));
      else if (info?.code === "password_has_whitespace") setError(t("auth.passwordNoWhitespace"));
      else if (info?.code === "email_exists") setError(t("auth.emailExists"));
      else setError(info ? buildAuthMessage(info, t).message : t("auth.signupFailed"));
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
      // # 변경 이유: Google 로그인 MFA 요구 시 사용자에게 안내하고 로그인 흐름으로 유도
      const result = await signInWithGoogleIdToken(idToken);
      if (result.mfaRequired) {
        setStatus("");
        setError(t("auth.mfaPrompt"));
        return;
      }
      router.replace("/market");
    } catch (err) {
      setError(t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <div className="fade-up rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900">{t("auth.signupTitle")}</h1>
          <p className="mt-2 text-sm text-gray-500">{t("auth.signupDesc")}</p>

          <form onSubmit={handleSignup} className="mt-6 space-y-4">
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
                minLength={PASSWORD_MIN_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onBlur={() => {
                  setPasswordTouched(true);
                  setPasswordError(validatePassword(password));
                }}
                placeholder={t("auth.passwordPlaceholder")}
                autoComplete="new-password"
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${passwordTouched && passwordError ? "border-rose-300 text-rose-600 focus:border-rose-400" : "border-gray-200 text-gray-700 focus:border-primary"}`}
              />
              <p className="mt-1 text-[11px] text-gray-400">{t("auth.passwordPolicyHint")}</p>
              {passwordTouched && passwordError ? <p className="mt-1 text-xs text-rose-500">{passwordError}</p> : null}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600">{t("auth.passwordConfirmLabel")}</label>
              <input
                required
                type="password"
                minLength={PASSWORD_MIN_LENGTH}
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                onBlur={() => {
                  setConfirmTouched(true);
                  setConfirmError(validateConfirm(passwordConfirm));
                }}
                placeholder={t("auth.passwordConfirmPlaceholder")}
                autoComplete="new-password"
                className={`mt-2 w-full rounded-xl border px-3 py-2 text-sm focus:outline-none ${confirmTouched && confirmError ? "border-rose-300 text-rose-600 focus:border-rose-400" : "border-gray-200 text-gray-700 focus:border-primary"}`}
              />
              {confirmTouched && confirmError ? <p className="mt-1 text-xs text-rose-500">{confirmError}</p> : null}
            </div>
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className="w-full rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink shadow-sm transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {t("auth.signupButton")}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <span>{t("auth.hasAccount")}</span>
            <Link href="/login" className="font-medium text-primary hover:text-primary-dark">
              {t("auth.loginLink")}
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
              onError={() => setError(t("auth.requestFailed"))}
              showInlineError={false}
            />
          </div>

          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}

          <p className="mt-6 text-xs text-gray-400">{t("auth.agreement")}</p>
        </div>
      </div>
    </main>
  );
}

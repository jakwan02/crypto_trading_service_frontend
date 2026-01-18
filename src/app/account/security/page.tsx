"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import QRCode from "qrcode";
import RequireAuth from "@/components/auth/RequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/appClient";
import { getAcc } from "@/lib/token";
import { buildAuthMessage, parseAuthError } from "@/lib/auth/authErrors";
import { requestGoogleIdToken } from "@/lib/googleOidc";

type SetupResponse = { otpauth_url: string };
type BackupCodesResponse = { backup_codes: string[] };
type DeleteResponse = { ok: boolean; purge_after_days: number };

function getAuthHeaders(): HeadersInit {
  const token = getAcc();
  if (!token) {
    throw new Error("Missing access token.");
  }
  return { Authorization: `Bearer ${token}` };
}

function parseSecret(otpauthUrl: string): string {
  try {
    const url = new URL(otpauthUrl);
    return url.searchParams.get("secret") || "";
  } catch {
    return "";
  }
}

export default function SecurityPage() {
  const PASSWORD_MIN_LENGTH = 12;
  const { user, refresh } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();
  const mfaEnabled = Boolean(user?.mfa_enabled);
  const hasPassword = Boolean(user?.has_password);

  const [setupUrl, setSetupUrl] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [setupCode, setSetupCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [mfaActionCode, setMfaActionCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  // 변경 이유: Google 계정 step-up 재인증 토큰 보관
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [googleStatus, setGoogleStatus] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteMfaCode, setDeleteMfaCode] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [passwordStatus, setPasswordStatus] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [purgeAfterDays, setPurgeAfterDays] = useState<number | null>(null);

  const secret = useMemo(() => (setupUrl ? parseSecret(setupUrl) : ""), [setupUrl]);

  const validatePassword = (value: string) => {
    if (value.length < PASSWORD_MIN_LENGTH) return t("auth.passwordTooShort");
    if (/\s/.test(value)) return t("auth.passwordNoWhitespace");
    return "";
  };

  const copyText = async (value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyStatus(t("security.copied"));
      window.setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      setCopyStatus("");
    }
  };

  const handleSetup = async () => {
    if (submitting) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const res = await apiRequest<SetupResponse>("/auth/2fa/setup", {
        method: "POST",
        headers: getAuthHeaders()
      });
      setSetupUrl(res.otpauth_url);
      const qr = await QRCode.toDataURL(res.otpauth_url);
      setQrDataUrl(qr);
    } catch (err) {
      const info = parseAuthError(err);
      setError(info ? buildAuthMessage(info, t).message : t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (submitting || !setupCode) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const res = await apiRequest<BackupCodesResponse>("/auth/2fa/confirm", {
        method: "POST",
        headers: getAuthHeaders(),
        json: { mfa_code: setupCode }
      });
      setBackupCodes(res.backup_codes || []);
      setStatus(t("security.mfaEnabled"));
      await refresh();
    } catch (err) {
      const info = parseAuthError(err);
      setError(info ? buildAuthMessage(info, t).message : t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    if (submitting || !mfaActionCode) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const res = await apiRequest<BackupCodesResponse>("/auth/2fa/backup/regenerate", {
        method: "POST",
        headers: getAuthHeaders(),
        json: { mfa_code: mfaActionCode }
      });
      setBackupCodes(res.backup_codes || []);
      setStatus(t("security.backupRegenerated"));
    } catch (err) {
      const info = parseAuthError(err);
      setError(info ? buildAuthMessage(info, t).message : t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // 변경 이유: 비밀번호 없는 Google 계정의 step-up 재인증 흐름 제공
  const handleGoogleReauth = async () => {
    if (submitting) return;
    setError("");
    setGoogleStatus("");
    setSubmitting(true);
    try {
      const token = await requestGoogleIdToken();
      setGoogleIdToken(token);
      setGoogleStatus(t("security.googleReauthDone"));
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.requestFailed");
      setError(message || t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async () => {
    if (submitting || !mfaActionCode) return;
    if (hasPassword) {
      if (!disablePassword) return;
    } else if (!googleIdToken) {
      setError(t("security.googleReauthRequired"));
      return;
    }
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      await apiRequest("/auth/2fa/disable", {
        method: "POST",
        headers: getAuthHeaders(),
        json: {
          password: hasPassword ? disablePassword : undefined,
          google_id_token: hasPassword ? undefined : googleIdToken,
          mfa_code: mfaActionCode
        }
      });
      setBackupCodes([]);
      setSetupUrl("");
      setQrDataUrl("");
      setStatus(t("security.mfaDisabled"));
      await refresh();
    } catch (err) {
      const info = parseAuthError(err);
      setError(info ? buildAuthMessage(info, t).message : t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCodes = () => {
    if (!backupCodes.length) return;
    const blob = new Blob([backupCodes.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "backup-codes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePasswordChange = async () => {
    if (!hasPassword) {
      router.push(`/account/password-set?next=${encodeURIComponent("/account/security#password")}`);
      return;
    }
    if (submitting || !currentPassword || !newPassword || !newPasswordConfirm) return;
    const validation = validatePassword(newPassword);
    if (validation) {
      setPasswordError(validation);
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setPasswordError(t("auth.passwordMismatch"));
      return;
    }
    setPasswordError("");
    setPasswordStatus("");
    setSubmitting(true);
    try {
      await apiRequest("/auth/password/change", {
        method: "POST",
        headers: getAuthHeaders(),
        json: { cur_password: currentPassword, new_password: newPassword }
      });
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setPasswordStatus(t("security.passwordChangeDone"));
    } catch (err) {
      const info = parseAuthError(err);
      setPasswordError(info ? buildAuthMessage(info, t).message : t("auth.requestFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (submitting) return;
    if (hasPassword) {
      if (!deletePassword) return;
    } else if (!googleIdToken) {
      setError(t("security.googleReauthRequired"));
      return;
    }
    if (mfaEnabled && !deleteMfaCode) return;
    setError("");
    setStatus("");
    setSubmitting(true);
    try {
      const res = await apiRequest<DeleteResponse>("/account/delete", {
        method: "POST",
        headers: getAuthHeaders(),
        json: {
          password: hasPassword ? deletePassword : undefined,
          google_id_token: hasPassword ? undefined : googleIdToken,
          mfa_code: deleteMfaCode || undefined,
          reason: deleteReason || undefined
        }
      });
      setPurgeAfterDays(res.purge_after_days);
      setStatus(t("security.deleteDone"));
      // # 변경 이유: 탈퇴 완료 내용을 사용자가 확인한 뒤 이동하도록 전용 확인 페이지로 이동
      const email = user?.email || "";
      const next = `/account/deleted?days=${encodeURIComponent(String(res.purge_after_days))}&email=${encodeURIComponent(email)}`;
      router.replace(next);
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
        <div className="mx-auto w-full max-w-4xl px-4 py-10">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t("security.title")}</h1>
            <p className="mt-1 text-sm text-gray-500">{t("security.desc")}</p>
          </header>

          {!hasPassword ? (
            <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-amber-900">{t("security.passwordMissingTitle")}</h2>
              <p className="mt-2 text-sm text-amber-800">{t("security.passwordMissingDesc")}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleGoogleReauth}
                  disabled={submitting}
                  className="inline-flex rounded-full bg-amber-700 px-4 py-2 text-xs font-semibold text-white"
                >
                  {googleIdToken ? t("security.googleReauthDoneShort") : t("security.googleReauthCta")}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/account/password-set?next=${encodeURIComponent("/account/security")}`)}
                  className="inline-flex rounded-full border border-amber-300 px-4 py-2 text-xs font-semibold text-amber-900"
                >
                  {t("security.passwordMissingCta")}
                </button>
              </div>
              {googleStatus ? <p className="mt-2 text-xs text-amber-800">{googleStatus}</p> : null}
            </div>
          ) : null}

          <section className="grid gap-4 lg:grid-cols-2">
            <div id="mfa" className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900">{t("security.mfaTitle")}</h2>
              <p className="mt-2 text-sm text-gray-600">
                {mfaEnabled ? t("security.mfaStatusOn") : t("security.mfaStatusOff")}
              </p>
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <p className="text-xs font-semibold text-gray-700">{t("security.mfaHelpTitle")}</p>
                <ol className="mt-2 space-y-1 text-xs text-gray-600">
                  <li>{t("security.mfaHelpStep1")}</li>
                  <li>{t("security.mfaHelpStep2")}</li>
                  <li>{t("security.mfaHelpStep3")}</li>
                </ol>
                <p className="mt-2 text-[11px] text-amber-600">{t("security.mfaHelpBackupWarning")}</p>
              </div>

              {!mfaEnabled ? (
                <div className="mt-4 space-y-4">
                  <button
                    type="button"
                    onClick={handleSetup}
                    disabled={submitting}
                    className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700"
                  >
                    {t("security.mfaSetupCta")}
                  </button>
                  {setupUrl ? (
                    <div className="space-y-3">
                      {qrDataUrl ? (
                        <img src={qrDataUrl} alt="2FA QR" className="h-40 w-40 rounded-2xl border border-gray-200" />
                      ) : null}
                      <div className="rounded-2xl bg-gray-50 px-4 py-3 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{t("security.mfaManualKey")}</p>
                          <button
                            type="button"
                            onClick={() => copyText(secret)}
                            className="text-[11px] font-semibold text-primary"
                          >
                            {t("security.copy")}
                          </button>
                        </div>
                        <p className="mt-1 break-all">{secret || "-"}</p>
                      </div>
	                      <div>
	                        <label className="text-xs font-semibold text-gray-600">{t("security.mfaCodeLabel")}</label>
	                        <input
	                          name="security-mfa-setup-code"
	                          autoComplete="off"
	                          inputMode="numeric"
	                          value={setupCode}
	                          onChange={(event) => setSetupCode(event.target.value)}
	                          placeholder={t("security.mfaCodePlaceholder")}
	                          className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
	                        />
                        <button
                          type="button"
                          onClick={handleConfirm}
                          disabled={submitting || !setupCode}
                          className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink"
                        >
                          {t("security.mfaConfirmCta")}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
	              ) : (
	                <div className="mt-4 space-y-3">
		                  <label className="text-xs font-semibold text-gray-600">{t("security.mfaCodeLabel")}</label>
		                  <input
	                    name="security-mfa-action-code"
	                    autoComplete="off"
	                    inputMode="numeric"
	                    value={mfaActionCode}
	                    onChange={(event) => setMfaActionCode(event.target.value)}
		                    placeholder={t("security.mfaCodePlaceholder")}
		                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                  />
                      {hasPassword ? (
		                    <>
		                      <label className="text-xs font-semibold text-gray-600">{t("security.passwordLabel")}</label>
		                      <input
		                        type="password"
		                        name="security-mfa-disable-password"
		                        autoComplete="new-password"
		                        value={disablePassword}
		                        onChange={(event) => setDisablePassword(event.target.value)}
		                        placeholder={t("security.passwordPlaceholder")}
		                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                      />
		                    </>
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                          <p className="font-semibold">{t("security.googleReauthTitle")}</p>
                          <p className="mt-1 text-[11px] text-amber-800">{t("security.googleReauthDesc")}</p>
                          <button
                            type="button"
                            onClick={handleGoogleReauth}
                            disabled={submitting}
                            className="mt-2 inline-flex rounded-full bg-amber-700 px-3 py-1.5 text-[11px] font-semibold text-white"
                          >
                            {googleIdToken ? t("security.googleReauthDoneShort") : t("security.googleReauthCta")}
                          </button>
                        </div>
                      )}
	                  <div className="flex flex-wrap gap-2">
	                    <button
	                      type="button"
	                      onClick={handleRegenerate}
                      disabled={submitting || !mfaActionCode}
                      className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700"
                    >
	                      {t("security.backupRegenerate")}
	                    </button>
	                    <button
	                      type="button"
	                      onClick={handleDisable}
	                      disabled={submitting || !mfaActionCode || (hasPassword ? !disablePassword : !googleIdToken)}
	                      className="rounded-full border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600"
	                    >
	                      {t("security.mfaDisable")}
	                    </button>
	                  </div>
	                </div>
	              )}

              {backupCodes.length ? (
                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-700">{t("security.backupTitle")}</p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => copyText(backupCodes.join("\n"))}
                        className="text-[11px] font-semibold text-primary"
                      >
                        {t("security.copy")}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadCodes}
                        className="text-[11px] font-semibold text-primary"
                      >
                        {t("security.backupDownload")}
                      </button>
                    </div>
                  </div>
                  <ul className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-700">
                    {backupCodes.map((code) => (
                      <li key={code} className="rounded-lg bg-white px-2 py-1">
                        {code}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[11px] text-amber-600">{t("security.backupOneTimeNotice")}</p>
                </div>
              ) : null}
              {copyStatus ? <p className="mt-3 text-xs text-primary">{copyStatus}</p> : null}
            </div>

            <div id="delete" className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-rose-600">{t("security.deleteTitle")}</h2>
              <p className="mt-2 text-sm text-gray-600">{t("security.deleteDesc")}</p>
              {purgeAfterDays !== null ? (
                <p className="mt-2 text-xs text-rose-500">{t("security.deletePurge", { days: purgeAfterDays })}</p>
              ) : null}
              {hasPassword ? (
                <div className="mt-4 space-y-3">
                  <label className="text-xs font-semibold text-gray-600">{t("security.passwordLabel")}</label>
		                  <input
		                    type="password"
		                    name="security-delete-password"
		                    autoComplete="new-password"
		                    value={deletePassword}
		                    onChange={(event) => setDeletePassword(event.target.value)}
		                    placeholder={t("security.passwordPlaceholder")}
		                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                  />
                  {mfaEnabled ? (
                    <>
		                      <label className="text-xs font-semibold text-gray-600">{t("security.mfaCodeLabel")}</label>
		                      <input
		                        name="security-delete-mfa-code"
		                        autoComplete="off"
		                        inputMode="numeric"
		                        value={deleteMfaCode}
		                        onChange={(event) => setDeleteMfaCode(event.target.value)}
		                        placeholder={t("security.mfaCodePlaceholder")}
		                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                      />
                    </>
                  ) : null}
                  <label className="text-xs font-semibold text-gray-600">{t("security.deleteReason")}</label>
		                  <input
		                    name="security-delete-reason"
		                    autoComplete="off"
		                    value={deleteReason}
		                    onChange={(event) => setDeleteReason(event.target.value)}
		                    placeholder={t("security.deleteReasonPlaceholder")}
		                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                  />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting || !deletePassword || (mfaEnabled && !deleteMfaCode)}
                    className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
                  >
                    {t("security.deleteCta")}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                    <p className="font-semibold">{t("security.googleReauthTitle")}</p>
                    <p className="mt-1 text-[11px] text-amber-800">{t("security.googleReauthDesc")}</p>
                    <button
                      type="button"
                      onClick={handleGoogleReauth}
                      disabled={submitting}
                      className="mt-2 inline-flex rounded-full bg-amber-700 px-3 py-1.5 text-[11px] font-semibold text-white"
                    >
                      {googleIdToken ? t("security.googleReauthDoneShort") : t("security.googleReauthCta")}
                    </button>
                  </div>
                  {mfaEnabled ? (
                    <>
                      <label className="text-xs font-semibold text-gray-600">{t("security.mfaCodeLabel")}</label>
                      <input
                        name="security-delete-mfa-code"
                        autoComplete="off"
                        inputMode="numeric"
                        value={deleteMfaCode}
                        onChange={(event) => setDeleteMfaCode(event.target.value)}
                        placeholder={t("security.mfaCodePlaceholder")}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                      />
                    </>
                  ) : null}
                  <label className="text-xs font-semibold text-gray-600">{t("security.deleteReason")}</label>
                  <input
                    name="security-delete-reason"
                    autoComplete="off"
                    value={deleteReason}
                    onChange={(event) => setDeleteReason(event.target.value)}
                    placeholder={t("security.deleteReasonPlaceholder")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitting || !googleIdToken || (mfaEnabled && !deleteMfaCode)}
                    className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
                  >
                    {t("security.deleteCta")}
                  </button>
                </div>
              )}
            </div>
          </section>

          <section id="password" className="mt-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900">{t("security.passwordChangeTitle")}</h2>
            <p className="mt-2 text-sm text-gray-600">{t("security.passwordChangeDesc")}</p>
            {hasPassword ? (
              <div className="mt-4 space-y-3">
                <label className="text-xs font-semibold text-gray-600">{t("security.currentPasswordLabel")}</label>
		                <input
		                  type="password"
		                  name="security-current-password"
		                  autoComplete="new-password"
		                  value={currentPassword}
		                  onChange={(event) => setCurrentPassword(event.target.value)}
		                  placeholder={t("security.passwordPlaceholder")}
		                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                />
		                <label className="text-xs font-semibold text-gray-600">{t("security.newPasswordLabel")}</label>
		                <input
		                  type="password"
		                  name="security-new-password"
		                  autoComplete="new-password"
		                  value={newPassword}
		                  onChange={(event) => setNewPassword(event.target.value)}
		                  placeholder={t("security.newPasswordPlaceholder")}
		                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                />
		                <label className="text-xs font-semibold text-gray-600">{t("security.newPasswordConfirmLabel")}</label>
		                <input
		                  type="password"
		                  name="security-new-password-confirm"
		                  autoComplete="new-password"
		                  value={newPasswordConfirm}
		                  onChange={(event) => setNewPasswordConfirm(event.target.value)}
		                  placeholder={t("security.newPasswordConfirmPlaceholder")}
		                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700"
		                />
                <button
                  type="button"
                  onClick={handlePasswordChange}
                  disabled={submitting || !currentPassword || !newPassword || !newPasswordConfirm}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {t("security.passwordChangeCta")}
                </button>
                {passwordError ? <p className="text-xs text-rose-500">{passwordError}</p> : null}
                {passwordStatus ? <p className="text-xs text-primary">{passwordStatus}</p> : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{t("security.passwordMissingTitle")}</p>
                <p className="mt-1 text-sm text-gray-600">{t("security.passwordMissingDesc")}</p>
                <button
                  type="button"
                  onClick={() => router.push(`/account/password-set?next=${encodeURIComponent("/account/security#password")}`)}
                  className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink"
                >
                  {t("security.passwordMissingCta")}
                </button>
              </div>
            )}
          </section>

          {error ? <p className="mt-4 text-xs text-rose-500">{error}</p> : null}
          {status ? <p className="mt-3 text-xs text-primary">{status}</p> : null}
        </div>
      </main>
    </RequireAuth>
  );
}

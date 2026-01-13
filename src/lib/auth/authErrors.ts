"use client";

import type { ApiError } from "@/lib/appClient";

export type AuthErrorInfo = {
  code?: string;
  status?: number;
  meta?: Record<string, unknown>;
};

export type AuthMessage = {
  message: string;
  detail?: string;
  attemptsLeft?: number;
  lockUntil?: string;
  retryAfterSec?: number;
  unlockMethods?: string[];
};

export function parseAuthError(err: unknown): AuthErrorInfo | null {
  if (!err || typeof err !== "object") return null;
  const typed = err as ApiError;
  const payload = typed.payload as Record<string, unknown> | undefined;
  const code =
    (payload && typeof payload.code === "string" && payload.code) ||
    (typed.code ? String(typed.code) : undefined);
  const meta = payload && typeof payload.meta === "object" ? (payload.meta as Record<string, unknown>) : undefined;
  if (!code && typeof typed.status !== "number") return null;
  return { code, status: typed.status, meta };
}

export function buildAuthMessage(info: AuthErrorInfo, t: (key: string, vars?: Record<string, unknown>) => string): AuthMessage {
  const code = info.code || "";
  const meta = info.meta || {};
  if (code === "invalid_credentials") {
    const attemptsLeft = typeof meta.attempts_left === "number" ? meta.attempts_left : undefined;
    return {
      message: t("auth.errorInvalidCredentials"),
      detail: attemptsLeft !== undefined ? t("auth.attemptsLeft", { count: attemptsLeft }) : undefined,
      attemptsLeft
    };
  }
  if (code === "account_locked") {
    return {
      message: t("auth.errorAccountLocked"),
      lockUntil: typeof meta.lock_until === "string" ? meta.lock_until : undefined,
      retryAfterSec: typeof meta.retry_after_sec === "number" ? meta.retry_after_sec : undefined,
      unlockMethods: Array.isArray(meta.unlock_methods) ? (meta.unlock_methods as string[]) : undefined
    };
  }
  if (code === "mfa_required") {
    return { message: t("auth.errorMfaRequired") };
  }
  if (code === "invalid_mfa") {
    return { message: t("auth.errorInvalidMfa") };
  }
  if (code === "invalid_token") {
    return { message: t("auth.errorInvalidToken") };
  }
  if (code === "expired_token") {
    return { message: t("auth.errorExpiredToken") };
  }
  if (code === "email_not_verified") {
    return { message: t("auth.errorEmailNotVerified") };
  }
  if (code === "account_inactive") {
    const days = typeof meta.remaining_days === "number" ? meta.remaining_days : undefined;
    if (days !== undefined) {
      return { message: t("auth.errorAccountInactiveWithDays", { days }) };
    }
    return { message: t("auth.errorAccountInactive") };
  }
  return { message: t("auth.requestFailed") };
}

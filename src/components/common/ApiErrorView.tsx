"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  getErrCode,
  getErrMeta,
  getErrRetryAfterSec,
  getErrStatus,
  isConflict,
  isRateLimited,
  isUnauthorized
} from "@/lib/apiErr";

type Props = {
  error: unknown;
  onRetry?: () => void;
  onUpgrade?: () => void;
  onGoBilling?: () => void;
};

function safeMessage(err: unknown): string {
  if (!err) return "";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "";
  return "";
}

function fmtRetryAfter(sec?: number): string {
  const s = Number(sec);
  if (!Number.isFinite(s) || s <= 0) return "";
  const total = Math.floor(s);
  const m = Math.floor(total / 60);
  const r = total % 60;
  if (m <= 0) return `${r}s`;
  if (r <= 0) return `${m}m`;
  return `${m}m ${r}s`;
}

export default function ApiErrorView({ error, onRetry, onUpgrade, onGoBilling }: Props) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const next = useMemo(() => {
    if (typeof window === "undefined") return pathname || "/";
    return `${window.location.pathname}${window.location.search}`;
  }, [pathname]);

  const status = getErrStatus(error);
  const code = getErrCode(error);
  const meta = getErrMeta(error);
  const message = safeMessage(error);
  const retryAfterSec = getErrRetryAfterSec(error);
  const showDebug = process.env.NODE_ENV !== "production";

  const resetAtText = useMemo(() => {
    const raw = meta && typeof meta.reset_at === "string" ? String(meta.reset_at) : "";
    if (!raw) return "";
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleString();
  }, [meta]);

  if (isUnauthorized(error)) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t("errors.unauthorized.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("errors.unauthorized.desc")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/login?next=${encodeURIComponent(next)}`}
            className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
          >
            {t("common.login")}
          </Link>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // 400 - checkout/options mismatch (user-friendly mapping)
  if (
    status === 400 &&
    (code === "unsupported_provider_for_kind" ||
      code === "unsupported_currency_for_provider" ||
      code === "origin_not_allowed" ||
      code === "invalid_path" ||
      code === "fx_rate_missing" ||
      code === "billing_public_base_url_missing")
  ) {
    const titleKey =
      code === "unsupported_provider_for_kind"
        ? "errors.billing.unsupportedProvider.title"
        : code === "unsupported_currency_for_provider"
          ? "errors.billing.unsupportedCurrency.title"
          : code === "origin_not_allowed"
            ? "errors.billing.originNotAllowed.title"
            : code === "invalid_path"
              ? "errors.billing.invalidPath.title"
              : "errors.billing.unavailable.title";
    const descKey =
      code === "unsupported_provider_for_kind"
        ? "errors.billing.unsupportedProvider.desc"
        : code === "unsupported_currency_for_provider"
          ? "errors.billing.unsupportedCurrency.desc"
          : code === "origin_not_allowed"
            ? "errors.billing.originNotAllowed.desc"
            : code === "invalid_path"
              ? "errors.billing.invalidPath.desc"
              : "errors.billing.unavailable.desc";

    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-gray-600">{t(descKey)}</p>
        {onRetry ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("errors.retry")}
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/upgrade"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("errors.billing.backToUpgrade")}
            </Link>
          </div>
        )}
        {showDebug ? (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold">{t("errors.debug")}</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {`status=${status ?? "-"}\ncode=${code || "-"}\nretry_after=${retryAfterSec ?? "-"}\nmessage=${message || "-"}`}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  if (status === 400 && code === "unsupported_plan_change") {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t("errors.billing.unsupportedPlanChange.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("errors.billing.unsupportedPlanChange.desc")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/billing"
            className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
          >
            {t("billing.goBilling")}
          </Link>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
        {showDebug ? (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold">{t("errors.debug")}</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {`status=${status ?? "-"}\ncode=${code || "-"}\nretry_after=${retryAfterSec ?? "-"}\nmessage=${message || "-"}`}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  if (isConflict(error) && (code === "active_entitlement_exists" || !code)) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t("errors.conflict.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("errors.conflict.desc")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onGoBilling ? (
            <button
              type="button"
              onClick={onGoBilling}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("billing.goBilling")}
            </button>
          ) : (
            <Link
              href="/billing"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("billing.goBilling")}
            </Link>
          )}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (isRateLimited(error) || code === "calls_per_day_exceeded" || code === "rpm_limited" || code === "rate_limited" || code === "quota_exceeded") {
    const kind = meta && typeof meta.kind === "string" ? String(meta.kind) : "";
    const used = meta && typeof meta.used !== "undefined" ? Number(meta.used) : NaN;
    const limit = meta && typeof meta.limit !== "undefined" ? Number(meta.limit) : NaN;
    const showQuota = code === "quota_exceeded" || code === "calls_per_day_exceeded" || kind === "calls_per_day";

    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">
          {showQuota ? t("errors.quotaExceeded.title") : t("errors.rateLimit.title")}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {showQuota ? t("errors.quotaExceeded.desc") : t("errors.rateLimit.desc")}
        </p>
        {showQuota ? (
          <div className="mt-3 space-y-1 text-xs text-gray-600">
            <p>
              {t("errors.quotaExceeded.used")}: {Number.isFinite(used) ? used : "-"} / {Number.isFinite(limit) ? limit : "-"}
            </p>
            <p>
              {t("errors.quotaExceeded.resetAt")}: {resetAtText || "-"}
            </p>
            <p>
              {t("errors.quotaExceeded.retryAfter")}: {retryAfterSec ? fmtRetryAfter(retryAfterSec) : "-"}
            </p>
          </div>
        ) : retryAfterSec ? (
          <p className="mt-3 text-xs text-gray-600">
            {t("errors.rateLimit.retryAfter", { seconds: fmtRetryAfter(retryAfterSec) })}
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/usage"
            className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
          >
            {t("usage.goUsage")}
          </Link>
          {onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </button>
          ) : (
            <Link
              href="/upgrade"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </Link>
          )}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
        {showDebug ? (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold">{t("errors.debug")}</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {`status=${status ?? "-"}\ncode=${code || "-"}\nretry_after=${retryAfterSec ?? "-"}\nmeta=${JSON.stringify(meta || {}, null, 2)}\nmessage=${message || "-"}`}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  if (code === "watchlists_limit_exceeded" || code === "watchlist_items_limit_exceeded") {
    const max = meta && typeof meta.max_lists === "number" ? meta.max_lists : meta?.max_items_per_list;
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t("errors.watchlistsLimit.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t("errors.watchlistsLimit.desc")}
          {typeof max === "number" ? ` (max=${max})` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </button>
          ) : (
            <Link
              href="/upgrade"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </Link>
          )}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (code === "screeners_limit_exceeded" || code === "alert_rules_limit_exceeded") {
    const limit = meta && typeof meta.limit === "number" ? meta.limit : undefined;
    const current = meta && typeof meta.current === "number" ? meta.current : undefined;
    const titleKey = code === "screeners_limit_exceeded" ? "errors.screenersLimit.title" : "errors.alertRulesLimit.title";
    const descKey = code === "screeners_limit_exceeded" ? "errors.screenersLimit.desc" : "errors.alertRulesLimit.desc";
    const extra =
      typeof limit === "number" && typeof current === "number" ? ` (limit=${limit}, current=${current})` : "";
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-gray-600">
          {t(descKey)}
          {extra}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onUpgrade ? (
            <button
              type="button"
              onClick={onUpgrade}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </button>
          ) : (
            <Link
              href="/upgrade"
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("common.proUpgrade")}
            </Link>
          )}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (status === 400 && code === "invalid_screener_dsl") {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t("errors.invalidScreenerDsl.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("errors.invalidScreenerDsl.desc")}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("errors.retry")}
            </button>
          ) : null}
        </div>
        {showDebug ? (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold">{t("errors.debug")}</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {`status=${status ?? "-"}\ncode=${code || "-"}\nmeta=${JSON.stringify(meta || {}, null, 2)}\nmessage=${message || "-"}`}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  if (code === "push_disabled" || code === "telegram_disabled") {
    const titleKey = code === "push_disabled" ? "errors.pushDisabled.title" : "errors.telegramDisabled.title";
    const descKey = code === "push_disabled" ? "errors.pushDisabled.desc" : "errors.telegramDisabled.desc";
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t(titleKey)}</h2>
        <p className="mt-2 text-sm text-gray-600">{t(descKey)}</p>
        {showDebug ? (
          <details className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
            <summary className="cursor-pointer font-semibold">{t("errors.debug")}</summary>
            <pre className="mt-2 whitespace-pre-wrap">
              {`status=${status ?? "-"}\ncode=${code || "-"}\nmessage=${message || "-"}`}
            </pre>
          </details>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("errors.generic.title")}</h2>
      <p className="mt-2 text-sm text-gray-600">{t("errors.generic.desc")}</p>
      {showDebug ? (
        <details className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
          <summary className="cursor-pointer font-semibold">{t("errors.debug")}</summary>
          <pre className="mt-2 whitespace-pre-wrap">
            {`status=${status ?? "-"}\ncode=${code || "-"}\nretry_after=${retryAfterSec ?? "-"}\nmeta=${JSON.stringify(meta || {}, null, 2)}\nmessage=${message || "-"}`}
          </pre>
        </details>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
          >
            {t("errors.retry")}
          </button>
        ) : null}
        {onGoBilling ? (
          <button
            type="button"
            onClick={onGoBilling}
            className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
          >
            {t("billing.goBilling")}
          </button>
        ) : (
          <Link
            href="/billing"
            className="inline-flex rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
          >
            {t("billing.goBilling")}
          </Link>
        )}
      </div>
    </div>
  );
}

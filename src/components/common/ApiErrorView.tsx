"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getErrCode, getErrMeta, getErrStatus, isConflict, isRateLimited, isUnauthorized } from "@/lib/apiErr";

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

  if (isRateLimited(error) || code === "calls_per_day_exceeded" || code === "rpm_limited") {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900">{t("errors.rateLimit.title")}</h2>
        <p className="mt-2 text-sm text-gray-600">{t("errors.rateLimit.desc")}</p>
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

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-900">{t("errors.generic.title")}</h2>
      <p className="mt-2 text-sm text-gray-600">
        {t("errors.generic.desc")}
        {status ? ` (status=${status})` : ""}
        {code ? ` (code=${code})` : ""}
      </p>
      {message ? <p className="mt-2 text-xs text-gray-500">{message}</p> : null}
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


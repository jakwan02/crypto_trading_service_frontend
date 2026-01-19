"use client";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { issueTelegramLink, testTelegram, unlinkTelegram } from "@/lib/telegramClient";

export default function TelegramGate() {
  const { t } = useTranslation();
  const [link, setLink] = useState<{ token?: string; deep_link?: string | null; expires_in_sec?: number } | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [status, setStatus] = useState<"unknown" | "linked" | "not_linked">("unknown");

  const onIssue = useCallback(async () => {
    setError(null);
    try {
      const res = await issueTelegramLink();
      setLink(res);
    } catch (e) {
      setError(e);
    }
  }, []);

  const onCheck = useCallback(async () => {
    setError(null);
    setChecking(true);
    try {
      await testTelegram();
      setStatus("linked");
    } catch (e) {
      setStatus("not_linked");
      setError(e);
    } finally {
      setChecking(false);
    }
  }, []);

  const onUnlink = useCallback(async () => {
    setError(null);
    try {
      await unlinkTelegram();
      setStatus("unknown");
      setLink(null);
    } catch (e) {
      setError(e);
    }
  }, []);

  if (error) {
    return <ApiErrorView error={error} onRetry={onCheck} />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t("telegram.title")}</p>
          <p className="mt-1 text-xs text-gray-500">
            {status === "linked" ? t("telegram.linked") : status === "not_linked" ? t("telegram.notLinked") : t("telegram.unknown")}
          </p>
          {link?.deep_link ? (
            <a href={link.deep_link} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-primary">
              {t("telegram.openDeepLink")}
            </a>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onIssue}
            className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink hover:bg-primary-dark"
          >
            {t("telegram.issue")}
          </button>
          <button
            type="button"
            onClick={onCheck}
            disabled={checking}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary disabled:opacity-60"
          >
            {t("telegram.check")}
          </button>
          <button
            type="button"
            onClick={onUnlink}
            className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
          >
            {t("telegram.unlink")}
          </button>
        </div>
      </div>

      {link?.token ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <p className="font-semibold text-gray-900">{t("telegram.howTo")}</p>
          <p className="mt-1">
            {t("telegram.howToStep", { token: link.token })}
          </p>
        </div>
      ) : null}
    </div>
  );
}


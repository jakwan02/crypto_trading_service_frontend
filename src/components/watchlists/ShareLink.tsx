"use client";

import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  token: string;
};

export default function ShareLink({ token }: Props) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/watchlists/shared/${encodeURIComponent(token)}`;
  }, [token]);

  const copy = useCallback(async () => {
    setCopied(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  }, [url]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-700">{t("watchlists.share.title")}</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          readOnly
          value={url}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink hover:bg-primary-dark"
        >
          {copied ? t("watchlists.share.copied") : t("watchlists.share.copy")}
        </button>
      </div>
    </div>
  );
}


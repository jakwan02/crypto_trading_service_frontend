"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getBillingMe, getCheckoutStatus } from "@/lib/billingClient";
import { useAuth } from "@/contexts/AuthContext";

type Phase = "loading" | "canceled" | "checking" | "success" | "pending" | "failed" | "error" | "needLogin";

function readQuery(): URLSearchParams {
  if (typeof window === "undefined") return new URLSearchParams();
  return new URLSearchParams(window.location.search || "");
}

export default function BillingReturnPage() {
  const { t } = useTranslation();
  const { user, sessionReady, refresh } = useAuth();
  const [phase, setPhase] = useState<Phase>("loading");
  const [error, setError] = useState<unknown>(null);

  const q = useMemo(() => readQuery(), []);
  const cancel = useMemo(() => String(q.get("cancel") || "").trim() === "1", [q]);
  const orderKey = useMemo(() => {
    const candidates = ["order_no", "orderNo", "checkout_id", "checkoutId", "id", "order"];
    for (const k of candidates) {
      const v = String(q.get(k) || "").trim();
      if (v) return v;
    }
    return "";
  }, [q]);

  useEffect(() => {
    if (cancel) {
      queueMicrotask(() => setPhase("canceled"));
      return;
    }
    if (!sessionReady) return;
    if (!user) {
      queueMicrotask(() => setPhase("needLogin"));
      return;
    }

    let stopped = false;
    let attempts = 0;

    async function tick() {
      if (stopped) return;
      attempts += 1;
      try {
        setPhase((p) => (p === "loading" ? "checking" : p));

        const status = orderKey ? await getCheckoutStatus(orderKey) : null;
        const st = String(status?.status || "").trim().toLowerCase();
        if (st === "paid") {
          await refresh();
          setPhase("success");
          return;
        }
        if (st === "failed" || st === "expired" || st === "canceled") {
          setPhase("failed");
          return;
        }

        const me = await getBillingMe();
        const plan = String(me?.plan || "").trim().toLowerCase();
        if (plan === "pro") {
          await refresh();
          setPhase("success");
          return;
        }

        if (attempts >= 20) {
          setPhase("pending");
          return;
        }
        window.setTimeout(tick, 2000);
      } catch (e) {
        setError(e);
        if (attempts >= 3) {
          setPhase("error");
          return;
        }
        window.setTimeout(tick, 2000);
      }
    }

    queueMicrotask(() => setPhase("checking"));
    window.setTimeout(() => {
      void tick();
    }, 0);
    return () => {
      stopped = true;
    };
  }, [cancel, orderKey, refresh, sessionReady, user]);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t("billing.return.title")}</h1>
          <p className="mt-1 text-sm text-gray-500">{t("billing.return.desc")}</p>
        </header>

        {phase === "loading" || phase === "checking" ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-700">{t("billing.return.checking")}</p>
            <p className="mt-2 text-xs text-gray-500">{orderKey ? `order=${orderKey}` : t("billing.return.noOrder")}</p>
          </div>
        ) : null}

        {phase === "canceled" ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">{t("billing.return.canceledTitle")}</p>
            <p className="mt-2 text-sm text-gray-600">{t("billing.return.canceledDesc")}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/upgrade"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
              >
                {t("billing.return.backUpgrade")}
              </Link>
              <Link
                href="/billing"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("billing.goBilling")}
              </Link>
            </div>
          </div>
        ) : null}

        {phase === "needLogin" ? (
          <ApiErrorView error={{ status: 401, code: "unauthorized" }} />
        ) : null}

        {phase === "success" ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-emerald-900">{t("billing.return.successTitle")}</p>
            <p className="mt-2 text-sm text-emerald-800">{t("billing.return.successDesc")}</p>
            <Link
              href="/billing"
              className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {t("billing.goBilling")}
            </Link>
          </div>
        ) : null}

        {phase === "pending" ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">{t("billing.return.pendingTitle")}</p>
            <p className="mt-2 text-sm text-gray-600">{t("billing.return.pendingDesc")}</p>
            <Link
              href="/billing"
              className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
            >
              {t("billing.goBilling")}
            </Link>
          </div>
        ) : null}

        {phase === "failed" ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">{t("billing.return.failedTitle")}</p>
            <p className="mt-2 text-sm text-gray-600">{t("billing.return.failedDesc")}</p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/upgrade"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-ink hover:bg-primary-dark"
              >
                {t("billing.return.retryUpgrade")}
              </Link>
              <Link
                href="/billing"
                className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("billing.goBilling")}
              </Link>
            </div>
          </div>
        ) : null}

        {phase === "error" ? <ApiErrorView error={error} /> : null}
      </div>
    </main>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ApiErrorView from "@/components/common/ApiErrorView";
import { getVapidPublicKey, subscribePush, testPush, unsubscribePush } from "@/lib/pushClient";

type Status = "idle" | "ready" | "subscribed" | "error";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) out[i] = rawData.charCodeAt(i);
  return out;
}

export default function PushGate() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<unknown>(null);
  const [endpoint, setEndpoint] = useState<string>("");

  const supported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return "serviceWorker" in navigator && "PushManager" in window;
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    if (!supported) {
      setStatus("error");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub && sub.endpoint) {
        setEndpoint(sub.endpoint);
        setStatus("subscribed");
      } else {
        setEndpoint("");
        setStatus("ready");
      }
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, [supported]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onSubscribe = useCallback(async () => {
    setError(null);
    try {
      if (!supported) throw new Error("push_not_supported");
      const vapid = await getVapidPublicKey();
      const publicKey = String(vapid.public_key || "").trim();
      if (!publicKey) throw new Error("push_disabled");

      const reg = (await navigator.serviceWorker.register("/sw.js")) as ServiceWorkerRegistration;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as BufferSource
      });

      const json = sub.toJSON();
      const keys = (json && json.keys) || {};
      const p256dh = typeof keys.p256dh === "string" ? keys.p256dh : "";
      const auth = typeof keys.auth === "string" ? keys.auth : "";
      if (!sub.endpoint || !p256dh || !auth) throw new Error("invalid_subscription");

      await subscribePush({
        endpoint: sub.endpoint,
        keys: { p256dh, auth },
        ua: navigator.userAgent,
        device_id: ""
      });
      setEndpoint(sub.endpoint);
      setStatus("subscribed");
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, [supported]);

  const onUnsubscribe = useCallback(async () => {
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await unsubscribePush({ endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setEndpoint("");
      setStatus("ready");
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, []);

  const onTest = useCallback(async () => {
    setError(null);
    try {
      await testPush();
    } catch (e) {
      setError(e);
      setStatus("error");
    }
  }, []);

  if (!supported) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
        {t("push.unsupported")}
      </div>
    );
  }

  if (error) {
    return <ApiErrorView error={error} onRetry={refresh} />;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{t("push.title")}</p>
          <p className="mt-1 text-xs text-gray-500">
            {status === "subscribed" ? t("push.subscribed") : t("push.notSubscribed")}
          </p>
          {endpoint ? <p className="mt-1 truncate text-[11px] text-gray-400">{endpoint}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {status !== "subscribed" ? (
            <button
              type="button"
              onClick={onSubscribe}
              className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-ink hover:bg-primary-dark"
            >
              {t("push.subscribe")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onTest}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("push.test")}
              </button>
              <button
                type="button"
                onClick={onUnsubscribe}
                className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 hover:border-primary/30 hover:text-primary"
              >
                {t("push.unsubscribe")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

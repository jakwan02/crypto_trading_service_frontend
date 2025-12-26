"use client";

import { useCallback, useEffect, useState } from "react";

export function useNotificationPermission() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSupport = "Notification" in window;
    setSupported(hasSupport);
    if (hasSupport) setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "denied";
    const next = await Notification.requestPermission();
    setPermission(next);
    return next;
  }, []);

  return { supported, permission, requestPermission };
}

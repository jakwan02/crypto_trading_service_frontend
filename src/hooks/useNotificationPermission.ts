"use client";

import { useCallback, useState } from "react";

export function useNotificationPermission() {
  const [supported] = useState(() => {
    if (typeof window === "undefined") return false;
    return "Notification" in window;
  });
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "default";
    return Notification.permission;
  });

  const requestPermission = useCallback(async () => {
    if (typeof window === "undefined") return "default";
    if (!("Notification" in window)) return "denied";
    const next = await Notification.requestPermission();
    setPermission(next);
    return next;
  }, []);

  return { supported, permission, requestPermission };
}

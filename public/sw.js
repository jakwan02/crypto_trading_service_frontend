// filename: frontend/public/sw.js
// 변경 이유: Week3 웹푸시 수신을 위한 Service Worker 추가

self.addEventListener("push", (event) => {
  try {
    const raw = event.data ? event.data.text() : "";
    const data = raw ? JSON.parse(raw) : {};
    const title = data && data.title ? String(data.title) : "Alert";
    const body = data && data.body ? String(data.body) : "";
    event.waitUntil(
      self.registration.showNotification(title, {
        body,
        data
      })
    );
  } catch {
    event.waitUntil(self.registration.showNotification("Alert", { body: "" }));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const url = (event.notification && event.notification.data && event.notification.data.url) || "/";
      const allClients = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of allClients) {
        if ("focus" in c) return c.focus();
      }
      return clients.openWindow(url);
    })()
  );
});

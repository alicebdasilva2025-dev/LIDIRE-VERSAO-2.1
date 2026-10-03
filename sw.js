const CACHE_NAME = "lidire-push-1.8";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("push", event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) { data = { body: event.data?.text?.() || "Você recebeu uma atualização da LiDire." }; }
  const title = data.title || "LiDire";
  const options = {
    body: data.body || "Você recebeu uma nova notificação.",
    icon: "/logo-lidire-oficial.png",
    badge: "/logo-lidire-oficial.png",
    tag: data.tag || "lidire",
    renotify: true,
    data: { url: data.url || "/#inicio" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/#inicio", self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client && client.url !== target) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});

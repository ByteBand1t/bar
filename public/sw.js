self.addEventListener("push", (event) => {
  const payload = event.data?.json() ?? {};
  const title = payload.title ?? "Neue Bestellung";
  const options = {
    body: payload.body ?? "Es ist eine neue Bestellung eingegangen.",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    data: { url: "/bar", ...(payload.data ?? {}) },
    tag: "bar-order",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url ?? "/bar", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === targetUrl && "focus" in client) return client.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

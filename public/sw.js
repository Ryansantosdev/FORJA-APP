/* Service worker do Forja: notificações push + cache básico do app shell. */

const PUSH_THEMES = {
  agua: {
    icon: "/icons/push-agua.png",
    badge: "/icons/push-agua.png",
    image: "/icons/push-banner-agua.png",
    tag: "forja-agua",
    vibrate: [80, 40, 80, 40, 160],
  },
  frase: {
    icon: "/icons/push-frase.png",
    badge: "/icons/push-frase.png",
    image: "/icons/push-banner-frase.png",
    tag: "forja-frase",
    vibrate: [120, 60, 120, 60, 200],
  },
  teste: {
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    image: null,
    tag: "forja-teste",
    vibrate: [100, 50, 100],
  },
};

const DEFAULT_THEME = {
  icon: "/icons/icon-192.png",
  badge: "/icons/icon-192.png",
  image: null,
  tag: "forja",
  vibrate: [200, 100, 200],
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { type: "teste", title: "Forja", body: "Volte para o app.", url: "/" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const theme = PUSH_THEMES[data.type] || DEFAULT_THEME;
  const options = {
    body: data.body || "",
    icon: theme.icon,
    badge: theme.badge,
    tag: theme.tag,
    vibrate: theme.vibrate,
    renotify: true,
    data: { url: data.url || "/", type: data.type || "teste" },
  };
  if (theme.image) options.image = theme.image;

  event.waitUntil(
    self.registration.showNotification(data.title || "Forja", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) return client.focus();
        }
        return self.clients.openWindow(url);
      })
  );
});

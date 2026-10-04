/* Service worker aplikacji administratora (zakres: /admin/app).
   Odbiera powiadomienia push o nowych pomysłach, otwiera ich szczegóły po kliknięciu
   i bez sieci pokazuje stronę „Brak połączenia”. Danych panelu nie zapisuje na urządzeniu. */

const CACHE = "hub-admin-v2";
const OFFLINE_URL = "/admin-offline.html";
const PRECACHE = [OFFLINE_URL, "/icons/admin-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Nawigacja zawsze z sieci (aktualne dane); tylko gdy sieci brak – strona offline z pamięci.
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(fetch(event.request).catch(() => caches.match(OFFLINE_URL)));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Hub Innowacji";
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(title, {
        body: data.body || "",
        tag: data.tag,
        icon: "/icons/admin-192.png",
        badge: "/icons/admin-192.png",
        data: { url: data.url || "/admin/app" },
      }),
      // otwarta aplikacja od razu odświeża listę
      self.clients.matchAll({ type: "window" }).then((list) => list.forEach((c) => c.postMessage({ type: "new-idea" }))),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/admin/app", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const same = list.find((c) => c.url === url);
      if (same) return same.focus();
      const app = list.find((c) => new URL(c.url).pathname.startsWith("/admin/app"));
      if (app) return app.navigate(url).then((c) => c && c.focus());
      return self.clients.openWindow(url);
    }),
  );
});

// Minimal service worker for Daily Ilzam.
// This intentionally does NOT cache app pages — the app needs a live network
// connection to Supabase anyway, so offline caching would just show stale data.
// Its job is to (a) let the app be installed as a home-screen app on iOS, and
// (b) receive push notifications for the work-hour alarm.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "Daily Ilzam", body: "Time to check in.", url: "/overview" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    // fall back to default text if payload isn't JSON
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/overview";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

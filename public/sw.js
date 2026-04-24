/* global self, caches, fetch */
/* v2: do not cache HTML documents — was serving stale Next.js pages and users
   stayed on broken (non-scroll) CSS/JS from earlier deploys. */
const CACHE_NAME = "daree-v2";

const PRECACHE_ASSETS = ["/logo.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS).catch(() => {}))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k.startsWith("daree-"))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // HTML navigations: always network (never a frozen broken shell from cache)
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    return;
  }

  // Static same-origin: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;
        if (response.type === "basic" || response.type === "cors") {
          const clone = response.clone();
          caches
            .open(CACHE_NAME)
            .then((c) => c.put(event.request, clone))
            .catch(() => {});
        }
        return response;
      });
    })
  );
});

const APP_CACHE = "bpo-postman-app-v2";
const MAP_CACHE = "bpo-postman-map-v1";
const APP_ROOT = "/bpo-postman/";
const APP_SHELL = [APP_ROOT, `${APP_ROOT}manifest.webmanifest`, `${APP_ROOT}icons/app-icon.svg`, `${APP_ROOT}icons/app-icon-maskable.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => ![APP_CACHE, MAP_CACHE].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(APP_CACHE).then((cache) => cache.put(APP_ROOT, copy));
      return response;
    }).catch(() => caches.match(APP_ROOT)));
    return;
  }

  if (url.hostname.endsWith("tile.openstreetmap.org")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(MAP_CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    })));
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith(APP_ROOT)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(APP_CACHE).then((cache) => cache.put(request, response.clone()));
      return response;
    })));
  }
});

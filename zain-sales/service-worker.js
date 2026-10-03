const CACHE_NAME = "zain-sales-static-v1";

const STATIC_FILES = [
  "./css/style.css",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable.png",
  "./assets/icons/apple-touch-icon.png",
  "./offline.html"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(STATIC_FILES)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // HTML pages always request the latest version.
  // If offline, show a simple offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("./offline.html")
      )
    );
    return;
  }

  // Cache only the explicitly approved static files.
  const approved = STATIC_FILES.some(path =>
    url.pathname === new URL(
      path,
      self.registration.scope
    ).pathname
  );

  if (!approved) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache =>
            cache.put(request, copy)
          );
        }

        return response;
      });
    })
  );
});
const CACHE_NAME = "zain-sales-static-v2";

const STATIC_FILES = [
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/icon-maskable.png",
  "./assets/icons/apple-touch-icon.png",
  "./offline.html"
];


// =====================================================
// INSTALL
// =====================================================

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_FILES);
    })
  );

  // تفعيل النسخة الجديدة مباشرة
  self.skipWaiting();
});


// =====================================================
// ACTIVATE
// =====================================================

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});


// =====================================================
// FETCH
// =====================================================

self.addEventListener("fetch", event => {

  const request = event.request;

  // نهتم فقط بطلبات GET
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // فقط نفس الدومين
  if (url.origin !== self.location.origin) {
    return;
  }


  // ===================================================
  // HTML
  // ===================================================

  // دائمًا نحاول جلب أحدث HTML
  // وإذا ماكو إنترنت نستخدم offline.html

  if (request.mode === "navigate") {

    event.respondWith(
      fetch(request)
        .then(response => {

          // لا نخزن HTML
          return response;

        })
        .catch(() => {

          return caches.match("./offline.html");

        })
    );

    return;
  }


  // ===================================================
  // CSS + JS
  // ===================================================

  // مهم جدًا:
  // CSS و JS دائمًا من الشبكة أولاً
  // حتى أي تعديل جديد يظهر بعد Refresh.

  const isCssOrJs =
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".js");

  if (isCssOrJs) {

    event.respondWith(

      fetch(request)
        .then(response => {

          return response;

        })
        .catch(() => {

          // إذا ماكو إنترنت نستخدم الكاش إن وجد
          return caches.match(request);

        })

    );

    return;
  }


  // ===================================================
  // STATIC ASSETS
  // ===================================================

  const approved = STATIC_FILES.some(path => {

    return (
      url.pathname ===
      new URL(
        path,
        self.registration.scope
      ).pathname
    );

  });


  if (!approved) {
    return;
  }


  // ===================================================
  // CACHE FIRST
  // ===================================================

  event.respondWith(

    caches.match(request).then(cached => {

      if (cached) {
        return cached;
      }

      return fetch(request).then(response => {

        if (response.ok) {

          const copy =
            response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {

              cache.put(
                request,
                copy
              );

            });

        }

        return response;

      });

    })

  );

});
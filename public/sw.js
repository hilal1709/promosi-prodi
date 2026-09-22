/**
 * Service worker sederhana untuk SISFOR UISI: Pilih Jalurmu.
 * Ditulis manual (bukan lewat plugin next-pwa berbasis webpack) supaya
 * kompatibel dengan build Turbopack default di Next.js 16.
 *
 * Strategi:
 * - App shell (/, offline.html, manifest, ikon) di-precache saat install.
 * - Navigasi halaman: network-first, fallback ke cache lalu ke offline.html.
 * - Aset statis (_next/static, ikon, gambar): cache-first (stale tapi cepat).
 */
const CACHE_VERSION = "sisfor-game-v2";
const APP_SHELL = ["/", "/offline.html", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman -> network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/offline.html");
        })
    );
    return;
  }

  // Aset statis -> cache-first
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});

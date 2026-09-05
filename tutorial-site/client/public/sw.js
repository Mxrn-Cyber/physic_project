// Minimal, conservative service worker. What it deliberately does NOT do is
// as important as what it does:
//
//   - Never touches cross-origin requests (the API on Render, R2 files,
//     Google's sign-in script, YouTube/Vimeo embeds, fonts). Those are left
//     completely untouched -- a service worker caching an API response that
//     carries a user's auth token or a paid PDF would be a real bug, not a
//     feature.
//   - Never touches non-GET requests. A cached POST would be nonsensical
//     and dangerous (imagine replaying a payment).
//   - Never caches anything under /api, even if a future deploy proxies the
//     API through the same origin.
//
// What it does: makes the app installable (paired with manifest.webmanifest)
// and lets the page shell and hashed build assets load instantly on repeat
// visits, with a real fallback when the network is genuinely unreachable.
//
// CACHE_VERSION only needs bumping if this file's *strategy* changes --
// Vite's content-hashed filenames (index-abc123.js) already invalidate
// themselves naturally, since a changed file gets a new URL and is simply
// never a cache hit for the old one.
const CACHE_VERSION = "v1";
const CACHE_NAME = `etnakrean-${CACHE_VERSION}`;
const SHELL_URL = "/";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(SHELL_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

function isStaticAsset(url) {
  // Vite's hashed build output. Safe to cache aggressively -- a changed file
  // gets a new filename, so a cache hit here is never stale content.
  return url.pathname.startsWith("/assets/");
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (isStaticAsset(url)) {
    // Cache-first: these URLs are immutable by construction.
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    // Network-first: a page load should always show the latest deploy when
    // online. The cached shell is only ever a fallback for "truly offline",
    // never preferred over a working network.
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, copy));
          return response;
        })
        .catch(() => caches.match(SHELL_URL))
    );
  }
});

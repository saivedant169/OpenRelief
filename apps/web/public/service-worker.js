const CACHE_NAME = "openrelief-v1";
const appShellPath = new URL(".", self.registration.scope).pathname;
const withScopePath = (assetPath) => new URL(assetPath, self.registration.scope).pathname;
const APP_SHELL = [
  "",
  "manifest.webmanifest",
  "openrelief.svg",
  "tesseract/worker.min.js",
  "tesseract-core/tesseract-core.wasm.js",
  "tesseract-core/tesseract-core.wasm",
  "tessdata/eng.traineddata.gz"
].map(withScopePath);

const cacheDocumentAssets = async (cache) => {
  const response = await fetch(appShellPath);

  if (!response.ok) {
    return;
  }

  const html = await response.clone().text();
  await cache.put(appShellPath, response.clone());

  const assetPaths = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => new URL(match[1], self.registration.scope))
    .filter((url) => url.origin === self.location.origin && url.pathname.startsWith(appShellPath))
    .map((url) => url.pathname);

  await Promise.all(assetPaths.map((assetPath) => cache.add(assetPath).catch(() => undefined)));
};

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(APP_SHELL);
      await cacheDocumentAssets(cache);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.filter((cacheName) => cacheName !== CACHE_NAME).map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);

        if (response.ok) {
          cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        const cached = await cache.match(request);

        if (cached) {
          return cached;
        }

        if (request.mode === "navigate") {
          const shell = await cache.match(appShellPath);

          if (shell) {
            return shell;
          }
        }

        throw error;
      }
    })()
  );
});

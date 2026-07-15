const CACHE_NAME = "openrelief-v1";
const appShellPath = new URL(".", self.registration.scope).pathname;
const withScopePath = (assetPath) => new URL(assetPath, self.registration.scope).pathname;
const sameScopeRequestPath = (url) =>
  url.origin === self.location.origin && url.pathname.startsWith(appShellPath) ? `${url.pathname}${url.search}` : "";
const isScriptAsset = (url) => /\.(?:js|mjs|ts|tsx|jsx)$/.test(url.pathname);
const scriptDependencyPattern =
  /(?:import\s*\(\s*|import\s+[^"'`]*?\s+from\s*|import\s*|from\s*|new URL\(\s*)["'`]([^"'`]+)["'`]/g;
const localAssetPattern = /["'`](\/[^"'`]+?\.(?:js|mjs|css|wasm)(?:\?[^"'`]*)?)["'`]/g;
const hashedChunkPattern = /["'`](\.\/)?([A-Za-z0-9_.-]+-[A-Za-z0-9_-]+\.(?:js|mjs|css|wasm))["'`]/g;
const isLocalScriptDependency = (assetPath) =>
  assetPath.startsWith("/") ||
  /^\.\/[A-Za-z0-9_.-]+-[A-Za-z0-9_-]+\.(?:js|mjs|css|wasm)(?:\?[^"'`]*)?$/.test(assetPath);
const APP_SHELL = [
  "",
  "manifest.webmanifest",
  "openrelief.svg",
  "tesseract/worker.min.js",
  "tesseract-core/tesseract-core.wasm.js",
  "tesseract-core/tesseract-core.wasm",
  "tessdata/eng.traineddata.gz"
].map(withScopePath);

const cacheScriptLinkedAssets = async (cache, assetUrl, script, seenAssets) => {
  const discoveredAssetPaths = [
    ...[...script.matchAll(scriptDependencyPattern)]
      .map((match) => match[1] ?? "")
      .filter((assetPath) => isLocalScriptDependency(assetPath)),
    ...[...script.matchAll(localAssetPattern)].map((match) => match[1] ?? ""),
    ...[...script.matchAll(hashedChunkPattern)].map((match) => `${match[1] ?? ""}${match[2] ?? ""}`)
  ]
    .map((assetPath) => {
      try {
        return new URL(assetPath, assetUrl);
      } catch {
        return undefined;
      }
    })
    .filter((url) => url)
    .map((url) => sameScopeRequestPath(url))
    .filter((assetPath) => assetPath);

  await Promise.all(discoveredAssetPaths.map((assetPath) => cacheAsset(cache, assetPath, seenAssets)));
};

const cacheAsset = async (cache, assetPath, seenAssets) => {
  if (seenAssets.has(assetPath)) {
    return;
  }

  seenAssets.add(assetPath);

  const response = await fetch(assetPath).catch(() => undefined);

  if (!response || !response.ok) {
    return;
  }

  await cache.put(assetPath, response.clone());

  const assetUrl = new URL(assetPath, self.location.origin);
  if (isScriptAsset(assetUrl)) {
    await cacheScriptLinkedAssets(cache, assetUrl, await response.clone().text(), seenAssets);
  }
};

const cacheDocumentAssets = async (cache) => {
  const response = await fetch(appShellPath);

  if (!response.ok) {
    return;
  }

  const html = await response.clone().text();
  await cache.put(appShellPath, response.clone());

  const assetPaths = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => new URL(match[1], self.registration.scope))
    .map((url) => sameScopeRequestPath(url))
    .filter((assetPath) => assetPath);

  const seenAssets = new Set();
  await Promise.all(assetPaths.map((assetPath) => cacheAsset(cache, assetPath, seenAssets)));
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
        const cached = await cache.match(request, { ignoreVary: true });

        if (cached) {
          return cached;
        }

        if (request.mode === "navigate") {
          const shell = await cache.match(appShellPath, { ignoreVary: true });

          if (shell) {
            return shell;
          }
        }

        throw error;
      }
    })()
  );
});

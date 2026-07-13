import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const webRoot = path.join(process.cwd(), "apps", "web");
const publicRoot = path.join(webRoot, "public");
const viteConfigPath = path.join(process.cwd(), "vite.config.ts");

describe("OpenRelief PWA shell", () => {
  it("exposes install metadata from the document head", () => {
    const html = readFileSync(path.join(webRoot, "index.html"), "utf8");
    const manifestPath = path.join(publicRoot, "manifest.webmanifest");
    const iconPath = path.join(publicRoot, "openrelief.svg");

    expect(existsSync(manifestPath)).toBe(true);
    expect(existsSync(iconPath)).toBe(true);
    expect(html).toContain('<link rel="manifest" href="%BASE_URL%manifest.webmanifest" />');
    expect(html).toContain('<link rel="icon" href="%BASE_URL%openrelief.svg" type="image/svg+xml" />');
    expect(html).toContain('<meta name="theme-color" content="#155e63" />');

    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      name: string;
      short_name: string;
      start_url: string;
      scope: string;
      display: string;
      icons: Array<{ src: string; purpose: string }>;
    };

    expect(manifest).toMatchObject({
      name: "OpenRelief",
      short_name: "OpenRelief",
      start_url: ".",
      scope: ".",
      display: "standalone"
    });
    expect(manifest.icons).toContainEqual(expect.objectContaining({ src: "openrelief.svg", purpose: "any maskable" }));
  });

  it("registers a service worker that caches local app assets", () => {
    const main = readFileSync(path.join(webRoot, "src", "main.tsx"), "utf8");
    const registerServiceWorker = readFileSync(path.join(webRoot, "src", "registerServiceWorker.ts"), "utf8");
    const playwrightConfig = readFileSync(path.join(process.cwd(), "playwright.config.ts"), "utf8");
    const viteConfig = readFileSync(viteConfigPath, "utf8");
    const serviceWorkerPath = path.join(publicRoot, "service-worker.js");

    expect(existsSync(serviceWorkerPath)).toBe(true);
    expect(main).toContain('import { registerServiceWorker } from "./registerServiceWorker";');
    expect(main).toContain("registerServiceWorker();");
    expect(registerServiceWorker).toContain('import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === "1"');
    expect(registerServiceWorker).toContain("import.meta.env.BASE_URL");
    expect(playwrightConfig).toContain("VITE_ENABLE_SW=1 npm run dev");
    expect(viteConfig).toContain('base: process.env.OPENRELIEF_BASE_PATH ?? "/"');

    const serviceWorker = readFileSync(serviceWorkerPath, "utf8");

    expect(serviceWorker).toContain('const CACHE_NAME = "openrelief-v1";');
    expect(serviceWorker).toContain("self.registration.scope");
    expect(serviceWorker).toContain('"manifest.webmanifest"');
    expect(serviceWorker).toContain('"openrelief.svg"');
    expect(serviceWorker).toContain('"tesseract/worker.min.js"');
    expect(serviceWorker).toContain('"tesseract-core/tesseract-core.wasm.js"');
    expect(serviceWorker).toContain('"tessdata/eng.traineddata.gz"');
    expect(serviceWorker).toContain("const cacheDocumentAssets = async (cache) =>");
    expect(serviceWorker).toContain("await cache.put(appShellPath, response.clone())");
    expect(serviceWorker).toContain("html.matchAll");
    expect(serviceWorker).toContain("self.addEventListener(\"install\"");
    expect(serviceWorker).toContain("self.addEventListener(\"fetch\"");
    expect(serviceWorker).toContain("cache.put(request, response.clone())");
  });
});

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const distPath = path.join(root, "dist");
const hostedSandboxPath = path.join(root, "docs", "hosted-sandbox.md");
const sourceScanPaths = [
  path.join(root, "apps", "web", "index.html"),
  path.join(root, "apps", "web", "src"),
  path.join(root, "apps", "web", "public", "manifest.webmanifest"),
  path.join(root, "apps", "web", "public", "service-worker.js"),
  path.join(distPath, "index.html"),
  path.join(distPath, "manifest.webmanifest"),
  path.join(distPath, "service-worker.js")
];
const requiredDistFiles = [
  "index.html",
  "manifest.webmanifest",
  "service-worker.js",
  "openrelief.svg",
  path.join("tessdata", "eng.traineddata.gz"),
  path.join("tesseract", "worker.min.js"),
  path.join("tesseract-core", "tesseract-core.wasm"),
  path.join("tesseract-core", "tesseract-core.wasm.js")
];
const requiredHostedSandboxPhrases = [
  "synthetic data only",
  "No real survivor PII",
  "local browser storage",
  "No analytics or telemetry",
  "No live FEMA, SBA, state, county, or legal-aid submission",
  "npm run check"
];
const bannedTelemetryMarkers = [
  "google-analytics",
  "googletagmanager",
  "gtag(",
  "mixpanel",
  "segment.com",
  "posthog",
  "sentry.io",
  "plausible.io",
  "amplitude"
];

const failures = [];

const fail = (message) => {
  failures.push(message);
};

const readText = (filePath) => readFileSync(filePath, "utf8");

const listFiles = (entryPath) => {
  if (!existsSync(entryPath)) {
    fail(`Missing scan path: ${path.relative(root, entryPath)}`);
    return [];
  }

  const stats = statSync(entryPath);
  if (stats.isFile()) {
    return [entryPath];
  }

  return readdirSync(entryPath).flatMap((entry) => listFiles(path.join(entryPath, entry)));
};

if (!existsSync(distPath)) {
  fail("Missing dist. Run npm run build before npm run sandbox:preflight.");
}

for (const requiredFile of requiredDistFiles) {
  const filePath = path.join(distPath, requiredFile);
  if (!existsSync(filePath)) {
    fail(`Missing dist artifact: ${requiredFile}`);
  }
}

const assetFiles = existsSync(path.join(distPath, "assets"))
  ? readdirSync(path.join(distPath, "assets"))
  : [];
if (!assetFiles.some((fileName) => fileName.endsWith(".js"))) {
  fail("Missing built JavaScript asset in dist/assets.");
}
if (!assetFiles.some((fileName) => fileName.endsWith(".css"))) {
  fail("Missing built CSS asset in dist/assets.");
}

if (!existsSync(hostedSandboxPath)) {
  fail("Missing docs/hosted-sandbox.md.");
} else {
  const hostedSandbox = readText(hostedSandboxPath);
  for (const phrase of requiredHostedSandboxPhrases) {
    if (!hostedSandbox.includes(phrase)) {
      fail(`Hosted sandbox guide missing phrase: ${phrase}`);
    }
  }
}

const scannedTextFiles = sourceScanPaths
  .flatMap(listFiles)
  .filter((filePath) => /\.(css|html|js|jsx|json|ts|tsx|webmanifest)$/.test(filePath));
for (const filePath of scannedTextFiles) {
  const content = readText(filePath).toLowerCase();
  const marker = bannedTelemetryMarkers.find((candidate) => content.includes(candidate));
  if (marker) {
    fail(`Telemetry marker "${marker}" found in ${path.relative(root, filePath)}.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Hosted sandbox preflight passed.");

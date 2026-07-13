import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  runbook: path.join(root, "docs", "demo-video-runbook.md"),
  script: path.join(root, "docs", "demo-script.md"),
  letter: path.join(root, "examples", "california-wildfire", "letters", "denial-occupancy-proof.txt"),
  report: path.join(root, "packages", "evals", "reports", "california-wildfire-v1.json")
};

const requiredRunbookText = [
  "OpenRelief Demo Video Runbook",
  "Hosted synthetic sandbox",
  "No real survivor PII",
  "Video Evidence Template",
  "npm run demo:video:preflight",
  "examples/california-wildfire/letters/denial-occupancy-proof.txt"
];

const requiredScriptText = [
  "OpenRelief Demo Script",
  "synthetic",
  "No legal advice",
  "No live submission",
  "local browser storage"
];

const forbiddenLetterPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\b\d{3}[-.]\d{3}[-.]\d{4}\b/,
  /\bfema-\d{6,}\b/i,
  /\bsocial security number\b/i
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const minimumCaseCount = 104;

for (const [label, filePath] of Object.entries(files)) {
  if (!existsSync(filePath)) {
    fail(`Missing ${label}: ${filePath}`);
  }
}

const runbook = readFileSync(files.runbook, "utf8");
const demoScript = readFileSync(files.script, "utf8");
const letter = readFileSync(files.letter, "utf8");
const report = JSON.parse(readFileSync(files.report, "utf8"));

for (const requiredText of requiredRunbookText) {
  if (!runbook.includes(requiredText)) {
    fail(`Demo video runbook missing: ${requiredText}`);
  }
}

for (const requiredText of requiredScriptText) {
  if (!demoScript.includes(requiredText)) {
    fail(`Demo script missing: ${requiredText}`);
  }
}

for (const pattern of forbiddenLetterPatterns) {
  if (pattern.test(letter)) {
    fail(`Synthetic demo letter contains restricted pattern: ${pattern.source}`);
  }
}

if (
  report.caseCount < minimumCaseCount ||
  report.metrics?.passedCount !== report.caseCount ||
  report.metrics?.failedCount !== 0
) {
  fail("Eval report must show at least 104 passing cases and zero failed cases.");
}

console.log("Demo video preflight passed.");

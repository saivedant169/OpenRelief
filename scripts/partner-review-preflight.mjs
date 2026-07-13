import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  log: path.join(root, "docs", "partner-review-log.md"),
  outreach: path.join(root, "docs", "partner-outreach.md"),
  baselineFailures: path.join(root, "docs", "baseline-failure-examples.md"),
  demoRunbook: path.join(root, "docs", "demo-video-runbook.md"),
  report: path.join(root, "packages", "evals", "reports", "california-wildfire-v1.json")
};

const requiredLogText = [
  "Partner Review Log",
  "Synthetic examples only",
  "No real survivor PII",
  "Consent record",
  "Reviewer role",
  "Critical issue",
  "Launch decision"
];

const requiredOutreachText = [
  "Partner Outreach",
  "No real survivor PII",
  "consent",
  "legal aid",
  "disaster case worker"
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const minimumCaseCount = 108;

for (const [label, filePath] of Object.entries(files)) {
  if (!existsSync(filePath)) {
    fail(`Missing ${label}: ${filePath}`);
  }
}

const reviewLog = readFileSync(files.log, "utf8");
const outreach = readFileSync(files.outreach, "utf8");
const baselineFailures = readFileSync(files.baselineFailures, "utf8");
const demoRunbook = readFileSync(files.demoRunbook, "utf8");
const report = JSON.parse(readFileSync(files.report, "utf8"));

for (const requiredText of requiredLogText) {
  if (!reviewLog.includes(requiredText)) {
    fail(`Partner review log missing: ${requiredText}`);
  }
}

for (const requiredText of requiredOutreachText) {
  if (!outreach.includes(requiredText)) {
    fail(`Partner outreach missing: ${requiredText}`);
  }
}

if (!baselineFailures.includes("missing_human_escalation")) {
  fail("Baseline failure examples must include missing_human_escalation.");
}

if (!demoRunbook.includes("No real survivor PII")) {
  fail("Demo video runbook must forbid real survivor PII.");
}

if (
  report.caseCount < minimumCaseCount ||
  report.metrics?.passedCount !== report.caseCount ||
  report.metrics?.failedCount !== 0
) {
  fail("Eval report must show at least 108 passing cases and zero failed cases.");
}

console.log("Partner review preflight passed.");

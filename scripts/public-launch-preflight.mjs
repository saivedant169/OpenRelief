import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const reviewLogPath = path.join(root, "docs", "partner-review-log.md");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizedNoValues = new Set(["0", "no", "none"]);
const normalizedResolvedHighValues = new Set(["0", "no", "none", "accepted", "closed"]);

if (!existsSync(reviewLogPath)) {
  fail(`Missing partner review log: ${reviewLogPath}`);
}

const reviewLog = readFileSync(reviewLogPath, "utf8");

const launchValue = (field) => {
  const pattern = new RegExp(`^${escapeRegExp(field)}:\\s*(.*)$`, "gim");
  const values = [...reviewLog.matchAll(pattern)].map((match) => match[1].trim());
  const completedValue = values.reverse().find((value) => value && !value.includes("|"));

  if (!completedValue) {
    fail(`Partner review launch field incomplete: ${field}`);
  }

  return completedValue;
};

const criticalIssuesOpen = launchValue("critical_issues_open").toLowerCase();
const highIssuesOpen = launchValue("high_issues_open").toLowerCase();
const manualSafetyReviewComplete = launchValue("manual_safety_review_complete").toLowerCase();
const readyForPublicDemo = launchValue("ready_for_public_demo").toLowerCase();
const decisionOwner = launchValue("decision_owner");
const decisionDate = launchValue("decision_date");

if (!normalizedNoValues.has(criticalIssuesOpen)) {
  fail("Public launch blocked: critical issues remain open.");
}

if (!normalizedResolvedHighValues.has(highIssuesOpen)) {
  fail("Public launch blocked: high issues must be accepted or closed.");
}

if (manualSafetyReviewComplete !== "yes") {
  fail("Public launch blocked: manual safety review is not complete.");
}

if (readyForPublicDemo !== "yes") {
  fail("Public launch blocked: ready_for_public_demo must be yes.");
}

if (decisionOwner !== "Saivedant Hava") {
  fail("Public launch blocked: decision_owner must be Saivedant Hava.");
}

if (!/^\d{4}-\d{2}-\d{2}$/.test(decisionDate) || Number.isNaN(Date.parse(`${decisionDate}T00:00:00Z`))) {
  fail("Public launch blocked: decision_date must use YYYY-MM-DD.");
}

console.log("Public launch preflight passed.");

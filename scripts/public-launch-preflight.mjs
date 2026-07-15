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
const normalizedSanitizedValues = new Set(["sanitized"]);

if (!existsSync(reviewLogPath)) {
  fail(`Missing partner review log: ${reviewLogPath}`);
}

const reviewLog = readFileSync(reviewLogPath, "utf8");

const completedValue = (field) => {
  const pattern = new RegExp(`^${escapeRegExp(field)}:\\s*(.*)$`, "gim");
  const values = [...reviewLog.matchAll(pattern)].map((match) => match[1].trim());
  const value = values.reverse().find((candidate) => candidate && !candidate.includes("|"));

  if (!value) {
    fail(`Partner review field incomplete: ${field}`);
  }

  return value;
};

const requireDate = (field, value) => {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(value);

  if (!match?.groups) {
    fail(`Partner review field must use YYYY-MM-DD: ${field}`);
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    fail(`Partner review field must use YYYY-MM-DD: ${field}`);
  }
};

const reviewId = completedValue("review_id");
const reviewDate = completedValue("review_date");
const reviewerRole = completedValue("Reviewer role");
const reviewerOrganizationType = completedValue("reviewer organization type");
const consentRecord = completedValue("Consent record");
const noteStorageLocation = completedValue("note storage location");
const sanitizationStatus = completedValue("sanitization status").toLowerCase();
const criticalIssuesOpen = completedValue("critical_issues_open").toLowerCase();
const highIssuesOpen = completedValue("high_issues_open").toLowerCase();
const manualSafetyReviewComplete = completedValue("manual_safety_review_complete").toLowerCase();
const readyForPublicDemo = completedValue("ready_for_public_demo").toLowerCase();
const decisionOwner = completedValue("decision_owner");
const decisionDate = completedValue("decision_date");

requireDate("review_date", reviewDate);

if (reviewId.length < 3) {
  fail("Public launch blocked: review_id must identify the review session.");
}

if (reviewerRole.length < 3 || reviewerOrganizationType.length < 3) {
  fail("Public launch blocked: reviewer role and organization type are required.");
}

if (consentRecord.length < 3 || noteStorageLocation.length < 3) {
  fail("Public launch blocked: consent record and note storage location are required.");
}

if (!normalizedSanitizedValues.has(sanitizationStatus)) {
  fail("Public launch blocked: sanitization status must confirm sanitized notes.");
}

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

requireDate("decision_date", decisionDate);

console.log("Public launch preflight passed.");

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  log: path.join(root, "docs", "partner-review-log.md"),
  outreach: path.join(root, "docs", "partner-outreach.md"),
  baselineFailures: path.join(root, "docs", "baseline-failure-examples.md"),
  demoRunbook: path.join(root, "docs", "demo-video-runbook.md"),
  report: path.join(root, "packages", "evals", "reports", "california-wildfire-v1.json"),
  targets: path.join(root, "docs", "partner-review-targets.md")
};

const requiredLogText = [
  "Partner Review Log",
  "Synthetic examples only",
  "No real survivor PII",
  "review_id:",
  "review_date: YYYY-MM-DD",
  "Consent record",
  "Reviewer role",
  "reviewer organization type:",
  "materials reviewed:",
  "- hosted synthetic sandbox",
  "- docs/demo-script.md",
  "- docs/demo-video-runbook.md",
  "- docs/baseline-failure-examples.md",
  "- packages/evals/reports/california-wildfire-v1.json",
  "synthetic examples used:",
  "- examples/california-wildfire/letters/denial-occupancy-proof.txt",
  "note storage location:",
  "sanitization status: sanitized | private-only | needs-redaction",
  "public tracking issue:",
  "Review Questions",
  "Does workflow match real disaster letter review?",
  "Which output could mislead a survivor under stress?",
  "Which risk flag needs faster human escalation?",
  "Which evidence category is missing or overbroad?",
  "Which source or policy claim needs stronger citation?",
  "Which screen or wording should be removed before launch?",
  "Review Answers",
  "workflow_match_answer:",
  "misleading_output_answer:",
  "risk_escalation_answer:",
  "evidence_gap_answer:",
  "citation_gap_answer:",
  "remove_before_launch_answer:",
  "Findings Template",
  "finding_id:",
  "severity: critical | high | medium | low",
  "area: legal boundary | source grounding | escalation | privacy | accessibility | workflow",
  "summary:",
  "evidence:",
  "recommended change:",
  "public_issue_safe: yes | no",
  "Critical issue",
  "Launch decision",
  "critical_issues_open:",
  "high_issues_open:",
  "manual_safety_review_complete:",
  "ready_for_public_demo: yes | no",
  "decision_owner: Saivedant Hava",
  "decision_date: YYYY-MM-DD",
  "notes:"
];

const requiredOutreachText = [
  "Partner Outreach",
  "No real survivor PII",
  "consent",
  "legal aid",
  "disaster case worker",
  "docs/partner-review-targets.md"
];
const requiredTargetsText = [
  "Partner Review Targets",
  "No real survivor PII",
  "Disaster Legal Assistance Collaborative",
  "LawHelpCA",
  "Legal Aid Foundation of Los Angeles",
  "Disability Rights California",
  "Listos California",
  "California Volunteers",
  "docs/partner-review-log.md"
];
const requiredReviewedMaterials = [
  "hosted synthetic sandbox",
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json"
];
const requiredSyntheticExamples = ["examples/california-wildfire/letters/denial-occupancy-proof.txt"];
const requiredEvidencePaths = [
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json",
  "examples/california-wildfire/letters/denial-occupancy-proof.txt"
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const minimumCaseCount = 108;

const listItemsForField = (content, field) => {
  const lines = content.split(/\r?\n/);
  const fieldLabel = `${field}:`.toLowerCase();
  let startIndex = -1;

  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index]?.trim().toLowerCase() === fieldLabel) {
      startIndex = index;
      break;
    }
  }

  if (startIndex === -1) {
    return [];
  }

  const items = [];

  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith("- ")) {
      items.push(trimmed.slice(2).trim());
      continue;
    }

    break;
  }

  return items;
};

const requireListItems = (content, label, items) => {
  const listedItems = new Set(listItemsForField(content, label));

  for (const item of items) {
    if (!listedItems.has(item)) {
      fail(`Partner review log missing ${label} item: ${item}`);
    }
  }
};

const requireExistingPaths = (items) => {
  for (const item of items) {
    if (!existsSync(path.join(root, item))) {
      fail(`Partner review evidence missing: ${item}`);
    }
  }
};

for (const [label, filePath] of Object.entries(files)) {
  if (!existsSync(filePath)) {
    fail(`Missing ${label}: ${filePath}`);
  }
}

const reviewLog = readFileSync(files.log, "utf8");
const outreach = readFileSync(files.outreach, "utf8");
const targets = readFileSync(files.targets, "utf8");
const baselineFailures = readFileSync(files.baselineFailures, "utf8");
const demoRunbook = readFileSync(files.demoRunbook, "utf8");
const report = JSON.parse(readFileSync(files.report, "utf8"));

for (const requiredText of requiredLogText) {
  if (!reviewLog.includes(requiredText)) {
    fail(`Partner review log missing: ${requiredText}`);
  }
}

requireListItems(reviewLog, "materials reviewed", requiredReviewedMaterials);
requireListItems(reviewLog, "synthetic examples used", requiredSyntheticExamples);
requireExistingPaths(requiredEvidencePaths);

for (const requiredText of requiredOutreachText) {
  if (!outreach.includes(requiredText)) {
    fail(`Partner outreach missing: ${requiredText}`);
  }
}

for (const requiredText of requiredTargetsText) {
  if (!targets.includes(requiredText)) {
    fail(`Partner review targets missing: ${requiredText}`);
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

import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const reviewLogPath = path.join(root, "docs", "partner-review-log.md");
const repo = "saivedant169/OpenRelief";
const requiredLabels = ["partner-review", "safety", "V1"];
const requiredIssueMaterials = [
  "hosted synthetic sandbox",
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/partner-review-packet.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json",
  "examples/california-wildfire/letters/denial-occupancy-proof.txt"
];
const requiredBodyText = [
  "No real survivor PII",
  "hosted synthetic sandbox",
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/partner-review-packet.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json",
  "examples/california-wildfire/letters/denial-occupancy-proof.txt",
  "review_id:",
  "review_date: YYYY-MM-DD",
  "Reviewer role:",
  "reviewer organization type:",
  "Consent record:",
  "note storage location:",
  "sanitization status: sanitized | private-only | needs-redaction",
  "workflow_match_answer:",
  "misleading_output_answer:",
  "risk_escalation_answer:",
  "evidence_gap_answer:",
  "citation_gap_answer:",
  "remove_before_launch_answer:",
  "critical_issues_open:",
  "high_issues_open:",
  "manual_safety_review_complete:",
  "ready_for_public_demo: yes | no",
  "decision_owner: Saivedant Hava",
  "decision_date: YYYY-MM-DD",
  "notes:",
  "SSNs",
  "screenshots",
  "partner private data",
  "npm run launch:preflight passes"
];

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const errors = [];
const addError = (message) => {
  errors.push(message);
};

const listItemsForHeading = (content, heading) => {
  const lines = content.split(/\r?\n/);
  const headingText = `## ${heading}`.toLowerCase();
  const startIndex = lines.findIndex((line) => line.trim().toLowerCase() === headingText);

  if (startIndex === -1) {
    return [];
  }

  const items = [];

  for (const line of lines.slice(startIndex + 1)) {
    const trimmed = line.trim();

    if (trimmed.startsWith("## ")) {
      break;
    }

    if (trimmed.startsWith("- ")) {
      items.push(trimmed.slice(2).trim());
    }
  }

  return items;
};

const materialMatches = (listedItem, requiredItem) => listedItem === requiredItem || listedItem.startsWith(`${requiredItem}:`);

if (!existsSync(reviewLogPath)) {
  fail(`Missing partner review log: ${reviewLogPath}`);
}

const reviewLog = readFileSync(reviewLogPath, "utf8");
const issueUrl = /^public tracking issue:\s*(https:\/\/github\.com\/saivedant169\/OpenRelief\/issues\/\d+)\s*$/im.exec(
  reviewLog
)?.[1];

if (!issueUrl) {
  fail("Partner review log missing public tracking issue URL.");
}

const issueNumber = /\/issues\/(?<issueNumber>\d+)$/.exec(issueUrl)?.groups?.issueNumber;

if (!issueNumber) {
  fail("Partner review log public tracking issue URL is invalid.");
}

const issueResult = spawnSync(
  "gh",
  ["issue", "view", issueNumber, "--repo", repo, "--json", "url,state,labels,body"],
  { encoding: "utf8" }
);

if (issueResult.status !== 0) {
  fail(`Partner review issue preflight requires GitHub CLI access.\n${issueResult.stderr.trim()}`);
}

const issue = JSON.parse(issueResult.stdout);
const issueLabels = new Set((issue.labels ?? []).map((label) => label.name));

if (issue.url !== issueUrl) {
  addError("Partner review issue URL does not match docs/partner-review-log.md.");
}

if (issue.state !== "OPEN") {
  addError("Partner review issue must stay open until launch review completes.");
}

for (const label of requiredLabels) {
  if (!issueLabels.has(label)) {
    addError(`Partner review issue missing label: ${label}`);
  }
}

for (const text of requiredBodyText) {
  if (!issue.body?.includes(text)) {
    addError(`Partner review issue missing body text: ${text}`);
  }
}

const listedIssueMaterials = listItemsForHeading(issue.body ?? "", "Materials reviewed");

for (const material of requiredIssueMaterials) {
  if (!listedIssueMaterials.some((listedItem) => materialMatches(listedItem, material))) {
    addError(`Partner review issue materials missing: ${material}`);
  }
}

if (errors.length > 0) {
  fail(errors.join("\n"));
}

console.log("Partner review issue preflight passed.");

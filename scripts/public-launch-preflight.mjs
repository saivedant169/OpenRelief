import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const reviewLogPath = path.join(root, "docs", "partner-review-log.md");

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

const errors = [];
const addError = (message) => {
  errors.push(message);
};
const failIfErrors = () => {
  if (errors.length > 0) {
    fail(errors.join("\n"));
  }
};

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizedNoValues = new Set(["0", "no", "none"]);
const normalizedResolvedHighValues = new Set(["0", "no", "none", "accepted", "closed"]);
const normalizedSanitizedValues = new Set(["sanitized"]);
const normalizedFindingSeverities = new Set(["critical", "high", "medium", "low"]);
const normalizedFindingAreas = new Set([
  "legal boundary",
  "source grounding",
  "escalation",
  "privacy",
  "accessibility",
  "workflow"
]);
const normalizedPlaceholderValues = new Set([
  "n/a",
  "na",
  "none",
  "not applicable",
  "pending",
  "placeholder",
  "tbd",
  "todo",
  "to be determined",
  "unknown"
]);
const dateTemplateValue = "YYYY-MM-DD";
const requiredReviewedMaterials = [
  "hosted synthetic sandbox",
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/partner-review-packet.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json"
];
const requiredSyntheticExamples = ["examples/california-wildfire/letters/denial-occupancy-proof.txt"];
const reviewListFields = ["materials reviewed", "synthetic examples used"];
const requiredEvidencePaths = [
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/partner-review-packet.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json",
  "examples/california-wildfire/letters/denial-occupancy-proof.txt"
];
const minimumReviewAnswerLength = 10;
const publicTrackingIssuePattern = /^https:\/\/github\.com\/saivedant169\/OpenRelief\/issues\/\d+$/;
const restrictedReviewTextPatterns = [
  { label: "email address", pattern: /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i },
  { label: "phone number", pattern: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/ },
  { label: "Social Security number", pattern: /\b\d{3}-\d{2}-\d{4}\b/ },
  { label: "street address", pattern: /\b\d{1,6}\s+[A-Za-z0-9.'-]+(?:\s+[A-Za-z0-9.'-]+){0,4}\s+(?:street|st\.?|avenue|ave\.?|road|rd\.?|boulevard|blvd\.?|drive|dr\.?|lane|ln\.?|court|ct\.?|way|place|pl\.?)\b/i },
  { label: "agency ID", pattern: /\b(?:agency|case|registration|application)\s*(?:id|number|#)\s*[:#]?\s*[A-Z0-9-]{4,}\b/i },
  { label: "insurance claim number", pattern: /\binsurance\s+claim\s*(?:number|#|id)?\s*[:#]?\s*[A-Z0-9-]{4,}\b/i },
  { label: "medical detail", pattern: /\b(?:medical record|medical diagnosis|diagnosis|prescription|medicine list|health record)\b/i },
  { label: "immigration detail", pattern: /\b(?:immigration status|visa number|alien registration|a-number|green card)\b/i },
  { label: "screenshot reference", pattern: /\bscreenshot\b/i },
  { label: "partner private data", pattern: /\b(?:partner private data|private partner data)\b/i },
  { label: "redaction marker", pattern: /\b(?:needs-redaction|private-only)\b/i },
  { label: "real survivor reference", pattern: /\breal survivor\b/i }
];
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

if (!existsSync(reviewLogPath)) {
  fail(`Missing partner review log: ${reviewLogPath}`);
}

const reviewLog = readFileSync(reviewLogPath, "utf8");

const completedValuesForField = (field) => {
  const pattern = new RegExp(`^${escapeRegExp(field)}:[^\\S\\r\\n]*(.*)$`, "gim");
  return [...reviewLog.matchAll(pattern)]
    .map((match) => match[1].trim())
    .filter((candidate) => candidate && !candidate.includes("|") && candidate !== dateTemplateValue);
};

const completedValue = (field) => {
  const value = completedValuesForField(field).at(-1);

  if (!value) {
    addError(`Partner review field incomplete: ${field}`);
    return "";
  }

  return value;
};

const requireDate = (field, value) => {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/.exec(value);

  if (!match?.groups) {
    addError(`Partner review field must use YYYY-MM-DD: ${field}`);
    return null;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    addError(`Partner review field must use YYYY-MM-DD: ${field}`);
    return null;
  }

  return date;
};

const listItemsForField = (field) => {
  const lines = reviewLog.split(/\r?\n/);
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

const requireListItems = (label, items) => {
  const listedItems = new Set(listItemsForField(label));

  for (const item of items) {
    if (!listedItems.has(item)) {
      addError(`Public launch blocked: ${label} missing ${item}.`);
    }
  }
};

const requireExistingPaths = (items) => {
  for (const item of items) {
    if (!existsSync(path.join(root, item))) {
      addError(`Public launch blocked: evidence path missing ${item}.`);
    }
  }
};

const addRestrictedTextErrors = (field, value) => {
  for (const { label, pattern } of restrictedReviewTextPatterns) {
    if (pattern.test(value)) {
      addError(`Public launch blocked: ${field} contains ${label}.`);
    }
  }
};

const reviewId = completedValue("review_id");
const reviewDate = completedValue("review_date");
const reviewerRole = completedValue("Reviewer role");
const reviewerOrganizationType = completedValue("reviewer organization type");
const consentRecord = completedValue("Consent record");
const noteStorageLocation = completedValue("note storage location");
const sanitizationStatus = completedValue("sanitization status").toLowerCase();
const publicTrackingIssue = completedValue("public tracking issue");
const workflowMatchAnswer = completedValue("workflow_match_answer");
const misleadingOutputAnswer = completedValue("misleading_output_answer");
const riskEscalationAnswer = completedValue("risk_escalation_answer");
const evidenceGapAnswer = completedValue("evidence_gap_answer");
const citationGapAnswer = completedValue("citation_gap_answer");
const removeBeforeLaunchAnswer = completedValue("remove_before_launch_answer");
const findingId = completedValue("finding_id");
const findingSeverity = completedValue("severity").toLowerCase();
const findingArea = completedValue("area").toLowerCase();
const findingSummary = completedValue("summary");
const findingEvidence = completedValue("evidence");
const findingRecommendedChange = completedValue("recommended change");
const criticalIssuesOpen = completedValue("critical_issues_open").toLowerCase();
const highIssuesOpen = completedValue("high_issues_open").toLowerCase();
const manualSafetyReviewComplete = completedValue("manual_safety_review_complete").toLowerCase();
const readyForPublicDemo = completedValue("ready_for_public_demo").toLowerCase();
const decisionOwner = completedValue("decision_owner");
const decisionDate = completedValue("decision_date");
const decisionNotes = completedValue("notes");
const publicIssueSafeValues = completedValuesForField("public_issue_safe").map((value) => value.toLowerCase());
const reviewAnswers = [
  { field: "workflow_match_answer", value: workflowMatchAnswer },
  { field: "misleading_output_answer", value: misleadingOutputAnswer },
  { field: "risk_escalation_answer", value: riskEscalationAnswer },
  { field: "evidence_gap_answer", value: evidenceGapAnswer },
  { field: "citation_gap_answer", value: citationGapAnswer },
  { field: "remove_before_launch_answer", value: removeBeforeLaunchAnswer }
];
const findingFields = [
  { field: "finding_id", value: findingId },
  { field: "severity", value: findingSeverity },
  { field: "area", value: findingArea }
];
const findingTextFields = [
  { field: "summary", value: findingSummary },
  { field: "evidence", value: findingEvidence },
  { field: "recommended change", value: findingRecommendedChange }
];
const launchTextFields = [...reviewAnswers, ...findingFields, ...findingTextFields, { field: "notes", value: decisionNotes }];
const requiredSpecificFields = [
  { field: "review_id", value: reviewId },
  { field: "Reviewer role", value: reviewerRole },
  { field: "reviewer organization type", value: reviewerOrganizationType },
  { field: "Consent record", value: consentRecord },
  { field: "note storage location", value: noteStorageLocation },
  { field: "public tracking issue", value: publicTrackingIssue },
  ...launchTextFields
];
const scannedReviewTextFields = [
  ...requiredSpecificFields.map(({ field }) => field),
  "public_issue_safe"
];

if (errors.length === 0) {
  requireListItems("materials reviewed", requiredReviewedMaterials);
  requireListItems("synthetic examples used", requiredSyntheticExamples);
  requireExistingPaths(requiredEvidencePaths);
  const reviewDateValue = requireDate("review_date", reviewDate);

  for (const field of reviewListFields) {
    for (const item of listItemsForField(field)) {
      addRestrictedTextErrors(field, item);
    }
  }

  for (const { field, value } of requiredSpecificFields) {
    if (normalizedPlaceholderValues.has(value.toLowerCase())) {
      addError(`Public launch blocked: ${field} must include specific review evidence.`);
    }
  }

  if (reviewId.length < 3) {
    addError("Public launch blocked: review_id must identify the review session.");
  }

  if (reviewerRole.length < 3 || reviewerOrganizationType.length < 3) {
    addError("Public launch blocked: reviewer role and organization type are required.");
  }

  if (consentRecord.length < 3 || noteStorageLocation.length < 3) {
    addError("Public launch blocked: consent record and note storage location are required.");
  }

  if (!publicTrackingIssuePattern.test(publicTrackingIssue)) {
    addError("Public launch blocked: public tracking issue must be an OpenRelief GitHub issue URL.");
  }

  if (reviewAnswers.some(({ value }) => value.length < minimumReviewAnswerLength)) {
    addError("Public launch blocked: review answers need specific sanitized findings.");
  }

  if (findingId.length < 3 || findingTextFields.some(({ value }) => value.length < minimumReviewAnswerLength)) {
    addError("Public launch blocked: sanitized findings need finding_id, severity, area, summary, evidence, and recommended change.");
  }

  if (!normalizedFindingSeverities.has(findingSeverity)) {
    addError("Public launch blocked: finding severity is invalid.");
  }

  if (!normalizedFindingAreas.has(findingArea)) {
    addError("Public launch blocked: finding area is invalid.");
  }

  if (publicIssueSafeValues.length === 0 || publicIssueSafeValues.some((value) => value !== "yes")) {
    addError("Public launch blocked: public_issue_safe findings must be yes.");
  }

  for (const field of scannedReviewTextFields) {
    for (const value of completedValuesForField(field)) {
      addRestrictedTextErrors(field, value);
    }
  }

  if (!normalizedSanitizedValues.has(sanitizationStatus)) {
    addError("Public launch blocked: sanitization status must confirm sanitized notes.");
  }

  if (!normalizedNoValues.has(criticalIssuesOpen)) {
    addError("Public launch blocked: critical issues remain open.");
  }

  if (!normalizedResolvedHighValues.has(highIssuesOpen)) {
    addError("Public launch blocked: high issues must be accepted or closed.");
  }

  if (manualSafetyReviewComplete !== "yes") {
    addError("Public launch blocked: manual safety review is not complete.");
  }

  if (readyForPublicDemo !== "yes") {
    addError("Public launch blocked: ready_for_public_demo must be yes.");
  }

  if (decisionOwner !== "Saivedant Hava") {
    addError("Public launch blocked: decision_owner must be Saivedant Hava.");
  }

  const decisionDateValue = requireDate("decision_date", decisionDate);

  if (reviewDateValue && reviewDateValue > today) {
    addError("Public launch blocked: review_date cannot be in the future.");
  }

  if (decisionDateValue && decisionDateValue > today) {
    addError("Public launch blocked: decision_date cannot be in the future.");
  }

  if (reviewDateValue && decisionDateValue && decisionDateValue < reviewDateValue) {
    addError("Public launch blocked: decision_date cannot be before review_date.");
  }

  if (decisionNotes.length < 10) {
    addError("Public launch blocked: launch decision notes are required.");
  }
}

failIfErrors();

console.log("Public launch preflight passed.");

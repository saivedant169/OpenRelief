import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const releaseReadinessPath = path.join(process.cwd(), "docs/release-readiness.md");
const v1ReleaseAuditPath = path.join(process.cwd(), "docs", "v1-release-audit.md");
const readmePath = path.join(process.cwd(), "README.md");
const codeOfConductPath = path.join(process.cwd(), "CODE_OF_CONDUCT.md");
const contributingPath = path.join(process.cwd(), "CONTRIBUTING.md");
const incidentResponsePath = path.join(process.cwd(), "docs", "incident-response.md");
const licensePath = path.join(process.cwd(), "LICENSE");
const labelsPath = path.join(process.cwd(), ".github", "labels.yml");
const codeownersPath = path.join(process.cwd(), ".github", "CODEOWNERS");
const bugReportPath = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE", "bug_report.yml");
const policySourceIssuePath = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE", "policy_source.yml");
const partnerReviewIssuePath = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE", "partner_review.yml");
const prTemplatePath = path.join(process.cwd(), ".github", "pull_request_template.md");
const securityPath = path.join(process.cwd(), "SECURITY.md");
const syntheticDataLicensePath = path.join(process.cwd(), "docs/synthetic-data-license.md");
const technicalReportPath = path.join(process.cwd(), "docs", "technical-report.md");
const baselineFailureExamplesPath = path.join(process.cwd(), "docs", "baseline-failure-examples.md");
const evalsReadmePath = path.join(process.cwd(), "packages", "evals", "README.md");
const evalReportPath = path.join(process.cwd(), "packages", "evals", "reports", "california-wildfire-v1.json");
const policyPackContributionPath = path.join(process.cwd(), "docs", "policy-pack-contribution.md");
const hostedSandboxPath = path.join(process.cwd(), "docs", "hosted-sandbox.md");
const demoScriptPath = path.join(process.cwd(), "docs", "demo-script.md");
const demoVideoRunbookPath = path.join(process.cwd(), "docs", "demo-video-runbook.md");
const partnerOutreachPath = path.join(process.cwd(), "docs", "partner-outreach.md");
const partnerReviewPacketPath = path.join(process.cwd(), "docs", "partner-review-packet.md");
const partnerReviewTargetsPath = path.join(process.cwd(), "docs", "partner-review-targets.md");
const partnerReviewLogPath = path.join(process.cwd(), "docs", "partner-review-log.md");
const packageJsonPath = path.join(process.cwd(), "package.json");
const sandboxPreflightPath = path.join(process.cwd(), "scripts", "hosted-sandbox-preflight.mjs");
const demoVideoPreflightPath = path.join(process.cwd(), "scripts", "demo-video-preflight.mjs");
const partnerReviewPreflightPath = path.join(process.cwd(), "scripts", "partner-review-preflight.mjs");
const partnerReviewIssuePreflightPath = path.join(process.cwd(), "scripts", "partner-review-issue-preflight.mjs");
const publicLaunchPreflightPath = path.join(process.cwd(), "scripts", "public-launch-preflight.mjs");
const pagesWorkflowPath = path.join(process.cwd(), ".github", "workflows", "pages.yml");
const ciWorkflowPath = path.join(process.cwd(), ".github", "workflows", "ci.yml");
const viteConfigPath = path.join(process.cwd(), "vite.config.ts");

describe("release readiness", () => {
  it("maps V1 requirements to release evidence", () => {
    expect(existsSync(v1ReleaseAuditPath)).toBe(true);

    const readme = readFileSync(readmePath, "utf8");
    const releaseReadiness = readFileSync(releaseReadinessPath, "utf8");
    const audit = readFileSync(v1ReleaseAuditPath, "utf8");
    const requirementIds = [
      "FR-001",
      "FR-002",
      "FR-003",
      "FR-004",
      "FR-010",
      "FR-011",
      "FR-012",
      "FR-013",
      "FR-014",
      "FR-015",
      "FR-020",
      "FR-021",
      "FR-022",
      "FR-023",
      "FR-024",
      "FR-025",
      "FR-030",
      "FR-031",
      "FR-032",
      "FR-033",
      "FR-040",
      "FR-041",
      "FR-042",
      "FR-043",
      "FR-050",
      "FR-051",
      "FR-052",
      "FR-060",
      "FR-061",
      "FR-062",
      "NFR-001",
      "NFR-002",
      "NFR-003",
      "NFR-004",
      "NFR-005",
      "NFR-006",
      "NFR-007",
      "NFR-008",
      "NFR-009",
      "AC-001",
      "AC-002",
      "AC-003",
      "AC-004",
      "AC-005",
      "AC-006",
      "AC-007",
      "AC-008",
      "EC-001",
      "EC-002",
      "EC-003",
      "EC-004",
      "EC-005",
      "EC-006",
      "EC-007",
      "EC-008",
      "EC-009",
      "EC-010",
      "OOS-001",
      "OOS-002",
      "OOS-003",
      "OOS-004",
      "OOS-005",
      "OOS-006"
    ];

    expect(readme).toContain("V1 release audit");
    expect(releaseReadiness).toContain("V1 release audit");
    expect(audit).toContain("Remaining Manual Gate");
    expect(audit).toContain("docs/partner-review-log.md");
    expect(audit).toContain("review date within 90 days");
    expect(audit).toContain("reviewer role and organization type");
    expect(audit).toContain("consent record and private note storage location");
    expect(audit).toContain("reviewed materials and synthetic examples");
    expect(audit).toContain("sanitized answers for all review questions");
    expect(audit).toContain("categorized finding ID, severity, area, summary, evidence, and recommended change");
    expect(audit).toContain("public_issue_safe: yes");
    expect(audit).toContain("decision owner, decision date, and sanitized notes recorded");

    for (const requirementId of requirementIds) {
      expect(audit).toContain(requirementId);
    }
  });

  it("documents required V1 release gates", () => {
    expect(existsSync(releaseReadinessPath)).toBe(true);

    const content = readFileSync(releaseReadinessPath, "utf8");
    const requiredItems = [
      "npm run check",
      "npm run evals",
      "npm run test:e2e",
      "npm run test:security",
      "npm run security:audit",
      "npm run docs:check",
      "npm run launch:preflight",
      "Manual safety review"
    ];

    for (const requiredItem of requiredItems) {
      expect(content).toContain(requiredItem);
    }
  });

  it("includes required OSS project artifacts", () => {
    expect(existsSync(codeOfConductPath)).toBe(true);
    expect(existsSync(contributingPath)).toBe(true);
    expect(existsSync(licensePath)).toBe(true);
    expect(existsSync(labelsPath)).toBe(true);
    expect(existsSync(syntheticDataLicensePath)).toBe(true);

    const codeOfConduct = readFileSync(codeOfConductPath, "utf8");
    const contributing = readFileSync(contributingPath, "utf8");
    const license = readFileSync(licensePath, "utf8");
    const labels = readFileSync(labelsPath, "utf8");
    const syntheticDataLicense = readFileSync(syntheticDataLicensePath, "utf8");

    expect(codeOfConduct).toContain("OpenRelief Code of Conduct");
    expect(contributing).toContain("No real survivor PII");
    expect(license).toContain("MIT License");
    expect(labels).toContain("safety");
    expect(labels).toContain("good first issue");
    expect(syntheticDataLicense).toContain("OpenRelief Synthetic Data License");
    expect(syntheticDataLicense).toContain("No real survivor data");
  });

  it("includes required OSS governance templates", () => {
    expect(existsSync(codeownersPath)).toBe(true);
    expect(existsSync(bugReportPath)).toBe(true);
    expect(existsSync(policySourceIssuePath)).toBe(true);
    expect(existsSync(prTemplatePath)).toBe(true);
    expect(existsSync(securityPath)).toBe(true);

    const codeowners = readFileSync(codeownersPath, "utf8");
    const bugReport = readFileSync(bugReportPath, "utf8");
    const policySourceIssue = readFileSync(policySourceIssuePath, "utf8");
    const prTemplate = readFileSync(prTemplatePath, "utf8");
    const security = readFileSync(securityPath, "utf8");

    expect(codeowners).toContain("/packages/policy-packs/");
    expect(bugReport).toContain("No real survivor PII");
    expect(policySourceIssue).toContain("source URL");
    expect(prTemplate).toContain("source citations");
    expect(security).toContain("GitHub private security advisory");
  });

  it("documents incident response before hosted demo", () => {
    expect(existsSync(incidentResponsePath)).toBe(true);

    const incidentResponse = readFileSync(incidentResponsePath, "utf8");

    expect(incidentResponse).toContain("Severity Levels");
    expect(incidentResponse).toContain("Security Contact");
    expect(incidentResponse).toContain("Reporting Process");
    expect(incidentResponse).toContain("Takedown Path");
    expect(incidentResponse).toContain("No real survivor data");
  });

  it("includes public technical report for V1 launch", () => {
    expect(existsSync(technicalReportPath)).toBe(true);

    const technicalReport = readFileSync(technicalReportPath, "utf8");

    expect(technicalReport).toContain("Evaluating Disaster Recovery Workflows");
    expect(technicalReport).toContain("Local-first architecture");
    expect(technicalReport).toContain("Safety model");
    expect(technicalReport).toContain("Benchmark");
    expect(technicalReport).toContain("Limitations");
    expect(technicalReport).toContain("No legal advice");
    expect(technicalReport).toContain("No live submission");
    expect(technicalReport).toContain("packages/evals/reports/california-wildfire-v1.json");
    expect(technicalReport).toContain("maintain hosted sandbox guardrails");
  });

  it("documents baseline safety failure examples for reviewers", () => {
    expect(existsSync(baselineFailureExamplesPath)).toBe(true);

    const readme = readFileSync(readmePath, "utf8");
    const releaseReadiness = readFileSync(releaseReadinessPath, "utf8");
    const technicalReport = readFileSync(technicalReportPath, "utf8");
    const baselineFailures = readFileSync(baselineFailureExamplesPath, "utf8");

    expect(readme).toContain("Baseline failure examples");
    expect(releaseReadiness).toContain("Baseline failure examples");
    expect(technicalReport).toContain("Baseline failure examples");

    const requiredFailures = [
      "unsupported_eligibility_claim",
      "legal_advice",
      "submission_claim",
      "privacy_leakage",
      "ignore_official_letter",
      "missing_sources",
      "missing_human_escalation"
    ];

    for (const failure of requiredFailures) {
      expect(baselineFailures).toContain(failure);
    }

    expect(baselineFailures).toContain("Bad output");
    expect(baselineFailures).toContain("Required behavior");
    expect(baselineFailures).toContain("npm run evals");
  });

  it("documents how to run the benchmark", () => {
    expect(existsSync(evalsReadmePath)).toBe(true);

    const evalsReadme = readFileSync(evalsReadmePath, "utf8");

    expect(evalsReadme).toContain("OpenRelief Evals");
    expect(evalsReadme).toContain("npm run evals");
    expect(evalsReadme).toContain("packages/evals/reports/california-wildfire-v1.json");
    expect(evalsReadme).toContain("synthetic");
    expect(evalsReadme).toContain("critical failure");
  });

  it("keeps published benchmark counts synced with the eval report", () => {
    const report = JSON.parse(readFileSync(evalReportPath, "utf8")) as {
      caseCount: number;
      metrics: {
        passedCount: number;
      };
    };
    const technicalReport = readFileSync(technicalReportPath, "utf8");
    const baselineFailures = readFileSync(baselineFailureExamplesPath, "utf8");
    const evalsReadme = readFileSync(evalsReadmePath, "utf8");
    const demoVideoRunbook = readFileSync(demoVideoRunbookPath, "utf8");

    expect(report.metrics.passedCount).toBe(report.caseCount);
    expect(demoVideoRunbook).toContain(`Benchmark has ${report.caseCount} synthetic cases passing.`);
    expect(technicalReport).toContain(`case count: \`${report.caseCount}\``);
    expect(technicalReport).toContain(`passed count: \`${report.metrics.passedCount}\``);
    expect(baselineFailures).toContain(
      `Current benchmark status: \`${report.metrics.passedCount}/${report.caseCount}\` synthetic cases pass`
    );
    expect(evalsReadme).toContain(`case count: \`${report.caseCount}\``);
    expect(evalsReadme).toContain(`passed count: \`${report.metrics.passedCount}\``);
  });

  it("documents how to contribute policy packs", () => {
    expect(existsSync(policyPackContributionPath)).toBe(true);

    const guide = readFileSync(policyPackContributionPath, "utf8");

    expect(guide).toContain("Policy Pack Contribution Guide");
    expect(guide).toContain("official source");
    expect(guide).toContain("retrievedAt");
    expect(guide).toContain("lastReviewedAt");
    expect(guide).toContain("No real survivor PII");
    expect(guide).toContain("npm run policy:validate");
  });

  it("documents hosted synthetic sandbox guardrails", () => {
    expect(existsSync(hostedSandboxPath)).toBe(true);

    const guide = readFileSync(hostedSandboxPath, "utf8");

    expect(guide).toContain("Hosted Sandbox");
    expect(guide).toContain("synthetic data only");
    expect(guide).toContain("No real survivor PII");
    expect(guide).toContain("local browser storage");
    expect(guide).toContain("npm run check");
    expect(guide).toContain("manual safety review");
  });

  it("includes public launch demo and partner outreach artifacts", () => {
    expect(existsSync(demoScriptPath)).toBe(true);
    expect(existsSync(demoVideoRunbookPath)).toBe(true);
    expect(existsSync(partnerOutreachPath)).toBe(true);
    expect(existsSync(partnerReviewPacketPath)).toBe(true);
    expect(existsSync(partnerReviewTargetsPath)).toBe(true);

    const demoScript = readFileSync(demoScriptPath, "utf8");
    const demoVideoRunbook = readFileSync(demoVideoRunbookPath, "utf8");
    const partnerOutreach = readFileSync(partnerOutreachPath, "utf8");
    const partnerReviewPacket = readFileSync(partnerReviewPacketPath, "utf8");
    const partnerReviewTargets = readFileSync(partnerReviewTargetsPath, "utf8");

    expect(demoScript).toContain("OpenRelief Demo Script");
    expect(demoScript).toContain("synthetic");
    expect(demoScript).toContain("No legal advice");
    expect(demoScript).toContain("No live submission");
    expect(demoScript).toContain("local browser storage");

    expect(demoVideoRunbook).toContain("OpenRelief Demo Video Runbook");
    expect(demoVideoRunbook).toContain("npm run demo:video:preflight");
    expect(demoVideoRunbook).toContain("examples/california-wildfire/letters/denial-occupancy-proof.txt");
    expect(demoVideoRunbook).toContain("No real survivor PII");
    expect(demoVideoRunbook).toContain("Video Evidence Template");
    expect(demoVideoRunbook).toContain("Hosted synthetic sandbox");

    expect(partnerOutreach).toContain("Partner Outreach");
    expect(partnerOutreach).toContain("legal aid");
    expect(partnerOutreach).toContain("disaster case worker");
    expect(partnerOutreach).toContain("No real survivor PII");
    expect(partnerOutreach).toContain("consent");
    expect(partnerOutreach).toContain("partner-review-targets.md");
    expect(partnerOutreach).toContain("partner-review-packet.md");
    expect(partnerReviewPacket).toContain("Partner Review Packet");
    expect(partnerReviewPacket).toContain("https://saivedant169.github.io/OpenRelief/");
    expect(partnerReviewPacket).toContain("https://github.com/saivedant169/OpenRelief/issues/1");
    expect(partnerReviewPacket).toContain("docs/partner-review-packet.md");
    expect(partnerReviewPacket).toContain("docs/demo-script.md");
    expect(partnerReviewPacket).toContain("packages/evals/reports/california-wildfire-v1.json");
    expect(partnerReviewPacket).toContain("examples/california-wildfire/letters/denial-occupancy-proof.txt");
    expect(partnerReviewPacket).toContain("npm run partner:review:preflight");
    expect(partnerReviewPacket).toContain("npm run partner:issue:preflight");
    expect(partnerReviewPacket).toContain("npm run launch:preflight");
    expect(partnerReviewPacket).toContain("Review date must be within 90 days before public launch.");
    expect(partnerReviewPacket).toContain("No real survivor PII");
    expect(partnerReviewTargets).toContain("Partner Review Targets");
    expect(partnerReviewTargets).toContain("Disaster Legal Assistance Collaborative");
    expect(partnerReviewTargets).toContain("LawHelpCA");
    expect(partnerReviewTargets).toContain("Disability Rights California");
    expect(partnerReviewTargets).toContain("No real survivor PII");
  });

  it("defines partner review evidence controls", () => {
    expect(existsSync(partnerReviewLogPath)).toBe(true);
    expect(existsSync(partnerReviewPreflightPath)).toBe(true);
    expect(existsSync(partnerReviewIssuePreflightPath)).toBe(true);
    expect(existsSync(partnerReviewIssuePath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };
    const readme = readFileSync(readmePath, "utf8");
    const releaseReadiness = readFileSync(releaseReadinessPath, "utf8");
    const technicalReport = readFileSync(technicalReportPath, "utf8");
    const partnerOutreach = readFileSync(partnerOutreachPath, "utf8");
    const partnerReviewPacket = readFileSync(partnerReviewPacketPath, "utf8");
    const partnerReviewTargets = readFileSync(partnerReviewTargetsPath, "utf8");
    const partnerReviewLog = readFileSync(partnerReviewLogPath, "utf8");
    const partnerReviewPreflight = readFileSync(partnerReviewPreflightPath, "utf8");
    const partnerReviewIssuePreflight = readFileSync(partnerReviewIssuePreflightPath, "utf8");
    const partnerReviewIssue = readFileSync(partnerReviewIssuePath, "utf8");
    const labels = readFileSync(labelsPath, "utf8");

    expect(packageJson.scripts["partner:review:preflight"]).toBe("node scripts/partner-review-preflight.mjs");
    expect(packageJson.scripts["partner:issue:preflight"]).toBe("node scripts/partner-review-issue-preflight.mjs");
    expect(packageJson.scripts.check).toContain("npm run partner:review:preflight");
    expect(packageJson.scripts.check).toContain("npm run partner:issue:preflight");
    expect(readme).toContain("Partner review log");
    expect(readme).toContain("Partner review packet");
    expect(releaseReadiness).toContain("Partner review log");
    expect(releaseReadiness).toContain("Partner review packet");
    expect(releaseReadiness).toContain("Partner review targets");
    expect(releaseReadiness).toContain("Partner review issue template");
    expect(releaseReadiness).toContain("public tracking issue URL");
    expect(technicalReport).toContain("Partner review log");
    expect(partnerOutreach).toContain("Partner review log");
    expect(partnerOutreach).toContain("partner-review");
    expect(partnerReviewPacket).toContain("Do not replace empty review fields with placeholders.");
    expect(partnerReviewTargets).toContain("California Volunteers");
    expect(partnerReviewTargets).toContain("docs/partner-review-packet.md");
    expect(labels).toContain("partner-review");
    expect(partnerReviewIssue).toContain("No real survivor PII");
    expect(partnerReviewIssue).toContain("synthetic examples only");
    expect(partnerReviewIssue).toContain("Sanitized findings");
    expect(partnerReviewIssue).toContain("Launch risk");
    expect(partnerReviewIssue).toContain("hosted synthetic sandbox: https://saivedant169.github.io/OpenRelief/");
    expect(partnerReviewIssue).toContain("docs/partner-review-packet.md");
    expect(partnerReviewIssue).toContain("packages/evals/reports/california-wildfire-v1.json");
    expect(partnerReviewIssue).toContain("public tracking issue");
    expect(partnerReviewIssue).toContain("docs/partner-review-log.md");
    expect(partnerReviewIssue).toContain("SSNs");
    expect(partnerReviewIssue).toContain("screenshots");
    expect(partnerReviewIssue).toContain("partner private data");
    expect(partnerReviewIssue).toContain("review_id");
    expect(partnerReviewIssue).toContain("review_date");
    expect(partnerReviewIssue).toContain("90 days");
    expect(partnerReviewIssue).toContain("reviewer organization type");
    expect(partnerReviewIssue).toContain("Consent record");
    expect(partnerReviewIssue).toContain("note storage location");
    expect(partnerReviewIssue).toContain("sanitization status");
    expect(partnerReviewIssue).toContain("workflow_match_answer");
    expect(partnerReviewIssue).toContain("misleading_output_answer");
    expect(partnerReviewIssue).toContain("risk_escalation_answer");
    expect(partnerReviewIssue).toContain("evidence_gap_answer");
    expect(partnerReviewIssue).toContain("citation_gap_answer");
    expect(partnerReviewIssue).toContain("remove_before_launch_answer");
    expect(partnerReviewIssue).toContain("critical_issues_open");
    expect(partnerReviewIssue).toContain("high_issues_open");
    expect(partnerReviewIssue).toContain("manual_safety_review_complete");
    expect(partnerReviewIssue).toContain("ready_for_public_demo");
    expect(partnerReviewIssue).toContain("decision_owner");
    expect(partnerReviewIssue).toContain("decision_date");
    expect(partnerReviewIssue).toContain("notes");

    const requiredLogText = [
      "Partner Review Log",
      "Synthetic examples only",
      "No real survivor PII",
      "Review date must be within 90 days before public launch.",
      "review_id:",
      "review_date: YYYY-MM-DD",
      "Consent record",
      "Reviewer role",
      "reviewer organization type:",
      "materials reviewed:",
      "- hosted synthetic sandbox",
      "- docs/demo-script.md",
      "- docs/demo-video-runbook.md",
      "- docs/partner-review-packet.md",
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

    for (const requiredText of requiredLogText) {
      expect(partnerReviewLog).toContain(requiredText);
      expect(partnerReviewPreflight).toContain(requiredText);
    }

    expect(partnerReviewPreflight).toContain("minimumCaseCount = 108");
    expect(partnerReviewPreflight).toContain("at least 108 passing cases");
    expect(partnerReviewIssuePreflight).toContain("gh");
    expect(partnerReviewIssuePreflight).toContain("issue");
    expect(partnerReviewIssuePreflight).toContain("partner-review");
    expect(partnerReviewIssuePreflight).toContain("workflow_match_answer:");
    expect(partnerReviewIssuePreflight).toContain("docs/partner-review-packet.md");
    expect(partnerReviewIssuePreflight).toContain("npm run launch:preflight passes");
  });

  it("defines public launch decision preflight", () => {
    expect(existsSync(publicLaunchPreflightPath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };
    const releaseReadiness = readFileSync(releaseReadinessPath, "utf8");
    const technicalReport = readFileSync(technicalReportPath, "utf8");
    const preflightScript = readFileSync(publicLaunchPreflightPath, "utf8");

    expect(packageJson.scripts["launch:preflight"]).toBe("node scripts/public-launch-preflight.mjs");
    expect(packageJson.scripts.check).not.toContain("npm run launch:preflight");
    expect(releaseReadiness).toContain("npm run partner:issue:preflight");
    expect(releaseReadiness).toContain("npm run launch:preflight");
    expect(releaseReadiness).toContain("authenticated `gh` CLI");
    expect(technicalReport).toContain("npm run launch:preflight");

    const requiredLaunchFields = [
      "review_id",
      "review_date",
      "Reviewer role",
      "reviewer organization type",
      "Consent record",
      "note storage location",
      "sanitization status",
      "public tracking issue",
      "workflow_match_answer",
      "misleading_output_answer",
      "risk_escalation_answer",
      "evidence_gap_answer",
      "citation_gap_answer",
      "remove_before_launch_answer",
      "finding_id",
      "severity",
      "area",
      "summary",
      "evidence",
      "recommended change",
      "critical_issues_open",
      "high_issues_open",
      "manual_safety_review_complete",
      "ready_for_public_demo",
      "decision_owner",
      "decision_date",
      "public_issue_safe"
    ];

    for (const requiredField of requiredLaunchFields) {
      expect(preflightScript).toContain(requiredField);
    }

    expect(preflightScript).toContain("Saivedant Hava");
    expect(preflightScript).toContain("YYYY-MM-DD");
    expect(preflightScript).toContain("maximumReviewAgeDays = 90");
    expect(preflightScript).toContain("sanitized");
    expect(preflightScript).toContain("requiredReviewedMaterials");
    expect(preflightScript).toContain("requiredSyntheticExamples");
    expect(preflightScript).toContain("docs/demo-video-runbook.md");
    expect(preflightScript).toContain("docs/partner-review-packet.md");
    expect(preflightScript).toContain("packages/evals/reports/california-wildfire-v1.json");
    expect(preflightScript).toContain("examples/california-wildfire/letters/denial-occupancy-proof.txt");
    expect(releaseReadiness).toContain("sanitized review answers");
    expect(releaseReadiness).toContain("sanitized finding ID");
    expect(releaseReadiness).toContain("severity, area, summary");
    expect(releaseReadiness).toContain("recommended change");
    expect(releaseReadiness).toContain("sanitized notes");
    expect(releaseReadiness).toContain("public_issue_safe: yes");
    expect(releaseReadiness).toContain("recent review date");
    expect(releaseReadiness).toContain("reviewed materials");
    expect(technicalReport).toContain("completed reviewer session");
    expect(technicalReport).toContain("sanitized review answers");
    expect(technicalReport).toContain("sanitized finding ID");
    expect(technicalReport).toContain("recent review date");
    expect(technicalReport).toContain("public_issue_safe: yes");
    expect(technicalReport).toContain("synthetic examples");
  });

  it("defines a demo video preflight command", () => {
    expect(existsSync(demoVideoPreflightPath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };
    const preflightScript = readFileSync(demoVideoPreflightPath, "utf8");
    const readme = readFileSync(readmePath, "utf8");

    expect(packageJson.scripts["demo:video:preflight"]).toBe("node scripts/demo-video-preflight.mjs");
    expect(readme).toContain("Demo video runbook");
    expect(preflightScript).toContain("demo-video-runbook.md");
    expect(preflightScript).toContain("denial-occupancy-proof.txt");
    expect(preflightScript).toContain("No real survivor PII");
    expect(preflightScript).toContain("Hosted synthetic sandbox");
    expect(preflightScript).toContain("minimumCaseCount = 108");
    expect(preflightScript).toContain("at least 108 passing cases");
  });

  it("runs hosted sandbox preflight after production build", () => {
    expect(existsSync(sandboxPreflightPath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };
    const preflightScript = readFileSync(sandboxPreflightPath, "utf8");

    expect(packageJson.scripts["sandbox:preflight"]).toBe("node scripts/hosted-sandbox-preflight.mjs");
    expect(packageJson.scripts.check).toContain("npm run build && npm run sandbox:preflight");
    expect(preflightScript).toContain("dist");
    expect(preflightScript).toContain("hosted-sandbox.md");
    expect(preflightScript).toContain("telemetry");
    expect(preflightScript).toContain("No external model endpoints");
    expect(preflightScript).toContain("connect-src 'self'");
    expect(preflightScript).toContain("External model endpoint");
  });

  it("defines the hosted sandbox deployment workflow", () => {
    expect(existsSync(pagesWorkflowPath)).toBe(true);

    const workflow = readFileSync(pagesWorkflowPath, "utf8");
    const viteConfig = readFileSync(viteConfigPath, "utf8");

    expect(workflow).toContain("OpenRelief Sandbox");
    expect(workflow).toContain("actions/configure-pages@v6");
    expect(workflow).toContain("actions/upload-pages-artifact@v5");
    expect(workflow).toContain("actions/deploy-pages@v5");
    expect(workflow).not.toContain("paths:");
    expect(workflow).toContain("OPENRELIEF_BASE_PATH: /OpenRelief/");
    expect(workflow).toContain("npm run sandbox:preflight");
    expect(workflow).toContain("pages: write");
    expect(workflow).toContain("id-token: write");
    expect(viteConfig).toContain('base: process.env.OPENRELIEF_BASE_PATH ?? "/"');
  });

  it("passes GitHub token to CI check for issue preflight", () => {
    expect(existsSync(ciWorkflowPath)).toBe(true);

    const workflow = readFileSync(ciWorkflowPath, "utf8");

    expect(workflow).toContain("run: npm run check");
    expect(workflow).toContain("GH_TOKEN: ${{ github.token }}");
  });

  it("publishes the hosted sandbox URL", () => {
    const readme = readFileSync(readmePath, "utf8");
    const hostedSandboxGuide = readFileSync(hostedSandboxPath, "utf8");

    expect(readme).toContain("https://saivedant169.github.io/OpenRelief/");
    expect(hostedSandboxGuide).toContain("https://saivedant169.github.io/OpenRelief/");
  });
});

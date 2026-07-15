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
const partnerReviewLogPath = path.join(process.cwd(), "docs", "partner-review-log.md");
const packageJsonPath = path.join(process.cwd(), "package.json");
const sandboxPreflightPath = path.join(process.cwd(), "scripts", "hosted-sandbox-preflight.mjs");
const demoVideoPreflightPath = path.join(process.cwd(), "scripts", "demo-video-preflight.mjs");
const partnerReviewPreflightPath = path.join(process.cwd(), "scripts", "partner-review-preflight.mjs");
const publicLaunchPreflightPath = path.join(process.cwd(), "scripts", "public-launch-preflight.mjs");
const pagesWorkflowPath = path.join(process.cwd(), ".github", "workflows", "pages.yml");
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

    const demoScript = readFileSync(demoScriptPath, "utf8");
    const demoVideoRunbook = readFileSync(demoVideoRunbookPath, "utf8");
    const partnerOutreach = readFileSync(partnerOutreachPath, "utf8");

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
  });

  it("defines partner review evidence controls", () => {
    expect(existsSync(partnerReviewLogPath)).toBe(true);
    expect(existsSync(partnerReviewPreflightPath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };
    const readme = readFileSync(readmePath, "utf8");
    const releaseReadiness = readFileSync(releaseReadinessPath, "utf8");
    const technicalReport = readFileSync(technicalReportPath, "utf8");
    const partnerOutreach = readFileSync(partnerOutreachPath, "utf8");
    const partnerReviewLog = readFileSync(partnerReviewLogPath, "utf8");
    const partnerReviewPreflight = readFileSync(partnerReviewPreflightPath, "utf8");

    expect(packageJson.scripts["partner:review:preflight"]).toBe("node scripts/partner-review-preflight.mjs");
    expect(packageJson.scripts.check).toContain("npm run partner:review:preflight");
    expect(readme).toContain("Partner review log");
    expect(releaseReadiness).toContain("Partner review log");
    expect(technicalReport).toContain("Partner review log");
    expect(partnerOutreach).toContain("Partner review log");

    const requiredLogText = [
      "Partner Review Log",
      "Synthetic examples only",
      "No real survivor PII",
      "Consent record",
      "Reviewer role",
      "Critical issue",
      "Launch decision"
    ];

    for (const requiredText of requiredLogText) {
      expect(partnerReviewLog).toContain(requiredText);
      expect(partnerReviewPreflight).toContain(requiredText);
    }

    expect(partnerReviewPreflight).toContain("minimumCaseCount = 108");
    expect(partnerReviewPreflight).toContain("at least 108 passing cases");
  });

  it("defines public launch decision preflight", () => {
    expect(existsSync(publicLaunchPreflightPath)).toBe(true);

    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };
    const releaseReadiness = readFileSync(releaseReadinessPath, "utf8");
    const technicalReport = readFileSync(technicalReportPath, "utf8");
    const preflightScript = readFileSync(publicLaunchPreflightPath, "utf8");

    expect(packageJson.scripts["launch:preflight"]).toBe("node scripts/public-launch-preflight.mjs");
    expect(packageJson.scripts.check).not.toContain("npm run launch:preflight");
    expect(releaseReadiness).toContain("npm run launch:preflight");
    expect(technicalReport).toContain("npm run launch:preflight");

    const requiredLaunchFields = [
      "critical_issues_open",
      "high_issues_open",
      "manual_safety_review_complete",
      "ready_for_public_demo",
      "decision_owner",
      "decision_date"
    ];

    for (const requiredField of requiredLaunchFields) {
      expect(preflightScript).toContain(requiredField);
    }

    expect(preflightScript).toContain("Saivedant Hava");
    expect(preflightScript).toContain("YYYY-MM-DD");
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

  it("publishes the hosted sandbox URL", () => {
    const readme = readFileSync(readmePath, "utf8");
    const hostedSandboxGuide = readFileSync(hostedSandboxPath, "utf8");

    expect(readme).toContain("https://saivedant169.github.io/OpenRelief/");
    expect(hostedSandboxGuide).toContain("https://saivedant169.github.io/OpenRelief/");
  });
});

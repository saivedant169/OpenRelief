import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const releaseReadinessPath = path.join(process.cwd(), "docs/release-readiness.md");
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

describe("release readiness", () => {
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
});

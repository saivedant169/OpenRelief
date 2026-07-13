import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const releaseReadinessPath = path.join(process.cwd(), "docs/release-readiness.md");
const codeOfConductPath = path.join(process.cwd(), "CODE_OF_CONDUCT.md");
const contributingPath = path.join(process.cwd(), "CONTRIBUTING.md");
const licensePath = path.join(process.cwd(), "LICENSE");
const labelsPath = path.join(process.cwd(), ".github", "labels.yml");
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
});

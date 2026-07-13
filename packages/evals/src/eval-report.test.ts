import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { californiaWildfireCases } from "./california-wildfire-fixtures";
import { runCaliforniaWildfireEvalSuite } from "./results";

const reportPath = path.join(process.cwd(), "packages", "evals", "reports", "california-wildfire-v1.json");
const writeReportPath = path.join(process.cwd(), "packages", "evals", "src", "write-report.ts");
const packageJsonPath = path.join(process.cwd(), "package.json");

const buildExpectedReport = () => {
  const suite = runCaliforniaWildfireEvalSuite();
  const passedCount = suite.results.filter((result) => result.passed).length;
  const failedCount = suite.results.length - passedCount;

  return {
    schemaVersion: 1,
    suiteId: suite.suiteId,
    caseCount: suite.caseCount,
    passed: suite.passed,
    metrics: {
      passedCount,
      failedCount,
      failureCount: suite.results.flatMap((result) => result.failures).length
    },
    results: suite.results.map(
      ({
        caseId,
        title,
        expectedLetterType,
        actualLetterType,
        expectedNeedsHumanReview,
        actualNeedsHumanReview,
        passed,
        failures,
        sourceIds,
        riskFlags
      }) => ({
        caseId,
        title,
        expectedLetterType,
        actualLetterType,
        expectedNeedsHumanReview,
        actualNeedsHumanReview,
        passed,
        failures,
        sourceIds,
        riskFlags
      })
    )
  };
};

describe("machine-readable eval report", () => {
  it("covers the V1 high-risk escalation matrix", () => {
    const highRiskCases = californiaWildfireCases.filter((fixture) => fixture.caseContext.riskFlags.length > 0);

    expect(californiaWildfireCases.length).toBeGreaterThanOrEqual(33);
    expect(highRiskCases.length).toBeGreaterThanOrEqual(10);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("homelessness"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("medical_emergency"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("abuse_or_unsafe_home"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("disability_accommodation"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("immigration_sensitive"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("suspected_fraud_or_scam"))).toBe(true);
  });

  it("matches the California wildfire eval suite summary", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };

    expect(packageJson.scripts["evals:report"]).toBe("vite-node packages/evals/src/write-report.ts");
    expect(existsSync(writeReportPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);

    const report = JSON.parse(readFileSync(reportPath, "utf8")) as unknown;

    expect(report).toEqual(buildExpectedReport());
  });
});

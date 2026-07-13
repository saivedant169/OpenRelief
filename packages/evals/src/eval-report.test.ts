import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
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
  it("matches the California wildfire eval suite summary", () => {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { scripts: Record<string, string> };

    expect(packageJson.scripts["evals:report"]).toBe("vite-node packages/evals/src/write-report.ts");
    expect(existsSync(writeReportPath)).toBe(true);
    expect(existsSync(reportPath)).toBe(true);

    const report = JSON.parse(readFileSync(reportPath, "utf8")) as unknown;

    expect(report).toEqual(buildExpectedReport());
  });
});

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
        tags,
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
        tags,
        passed,
        failures,
        sourceIds,
        riskFlags
      })
    )
  };
};

describe("machine-readable eval report", () => {
  it("keeps balanced coverage beyond the 100-case launch bar", () => {
    const caseCountsByType = californiaWildfireCases.reduce<Record<string, number>>((counts, fixture) => {
      counts[fixture.expected.letterType] = (counts[fixture.expected.letterType] ?? 0) + 1;
      return counts;
    }, {});

    expect(californiaWildfireCases.length).toBeGreaterThanOrEqual(106);
    expect(caseCountsByType.denial ?? 0).toBeGreaterThanOrEqual(23);
    expect(caseCountsByType.request_for_information ?? 0).toBeGreaterThanOrEqual(24);
    expect(caseCountsByType.approval ?? 0).toBeGreaterThanOrEqual(19);
    expect(caseCountsByType.deadline_notice ?? 0).toBeGreaterThanOrEqual(12);
    expect(caseCountsByType.inspection_notice ?? 0).toBeGreaterThanOrEqual(10);
    expect(caseCountsByType.unknown ?? 0).toBeGreaterThanOrEqual(14);
  });

  it("covers the V1 high-risk escalation matrix", () => {
    const highRiskCases = californiaWildfireCases.filter((fixture) => fixture.caseContext.riskFlags.length > 0);

    expect(californiaWildfireCases.length).toBeGreaterThanOrEqual(33);
    expect(highRiskCases.length).toBeGreaterThanOrEqual(10);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("immediate_danger"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("homelessness"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("medical_emergency"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("abuse_or_unsafe_home"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("disability_accommodation"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("immigration_sensitive"))).toBe(true);
    expect(highRiskCases.some((fixture) => fixture.caseContext.riskFlags.includes("suspected_fraud_or_scam"))).toBe(true);
  });

  it("covers unknown letters that must route to manual review", () => {
    const unknownCases = californiaWildfireCases.filter((fixture) => fixture.expected.letterType === "unknown");

    expect(californiaWildfireCases.length).toBeGreaterThanOrEqual(36);
    expect(unknownCases.length).toBeGreaterThanOrEqual(3);
    expect(unknownCases.every((fixture) => fixture.expected.needsHumanReview)).toBe(true);
  });

  it("covers multilingual and stale-policy launch gaps", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
      results: Array<{ tags?: string[] }>;
    };
    const multilingualCases = californiaWildfireCases.filter((fixture) => fixture.tags?.includes("multilingual"));

    expect(multilingualCases.length).toBeGreaterThanOrEqual(2);
    expect(californiaWildfireCases.some((fixture) => fixture.tags?.some((tag) => String(tag) === "stale_policy"))).toBe(
      true
    );
    expect(report.results.filter((result) => result.tags?.includes("multilingual")).length).toBeGreaterThanOrEqual(2);
    expect(report.results.some((result) => result.tags?.includes("stale_policy"))).toBe(true);
  });

  it("covers case-worker triage launch cases", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
      results: Array<{ tags?: string[] }>;
    };
    const triageCases = californiaWildfireCases.filter((fixture) => fixture.tags?.includes("case_worker_triage"));

    expect(triageCases.length).toBeGreaterThanOrEqual(2);
    expect(report.results.filter((result) => result.tags?.includes("case_worker_triage")).length).toBeGreaterThanOrEqual(
      2
    );
  });

  it("covers immediate danger emergency escalation cases", () => {
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
      results: Array<{ tags?: string[]; riskFlags?: string[] }>;
    };
    const emergencyCases = californiaWildfireCases.filter((fixture) =>
      fixture.tags?.some((tag) => String(tag) === "emergency")
    );

    expect(emergencyCases.length).toBeGreaterThanOrEqual(2);
    expect(emergencyCases.every((fixture) => fixture.caseContext.riskFlags.includes("immediate_danger"))).toBe(true);
    expect(report.results.filter((result) => result.tags?.includes("emergency")).length).toBeGreaterThanOrEqual(2);
    expect(
      report.results.every(
        (result) => !result.tags?.includes("emergency") || result.riskFlags?.includes("immediate_danger")
      )
    ).toBe(true);
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

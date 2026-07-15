import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts", "partner-review-preflight.mjs");

const reviewLog = `# Partner Review Log

Synthetic examples only. No real survivor PII.

## Session Record

review_id:
review_date: YYYY-MM-DD
Reviewer role:
reviewer organization type:
Consent record:
materials reviewed:
- hosted synthetic sandbox
- docs/demo-script.md
- docs/demo-video-runbook.md
- docs/baseline-failure-examples.md
- packages/evals/reports/california-wildfire-v1.json
synthetic examples used:
- examples/california-wildfire/letters/denial-occupancy-proof.txt
note storage location:
sanitization status: sanitized | private-only | needs-redaction

## Review Questions

Does workflow match real disaster letter review?
Which output could mislead a survivor under stress?
Which risk flag needs faster human escalation?
Which evidence category is missing or overbroad?
Which source or policy claim needs stronger citation?
Which screen or wording should be removed before launch?

## Review Answers

workflow_match_answer:
misleading_output_answer:
risk_escalation_answer:
evidence_gap_answer:
citation_gap_answer:
remove_before_launch_answer:

## Findings Template

finding_id:
severity: critical | high | medium | low
area: legal boundary | source grounding | escalation | privacy | accessibility | workflow
summary:
evidence:
recommended change:
public_issue_safe: yes | no

## Critical issue

## Launch decision

critical_issues_open:
high_issues_open:
manual_safety_review_complete:
ready_for_public_demo: yes | no
decision_owner: Saivedant Hava
decision_date: YYYY-MM-DD
notes:
`;
const outreach = "Partner Outreach\nNo real survivor PII\nconsent\nlegal aid\ndisaster case worker\n";
const baselineFailures = "missing_human_escalation\n";
const demoRunbook = "No real survivor PII\n";
const passingReport = JSON.stringify({ caseCount: 108, metrics: { passedCount: 108, failedCount: 0 } });

const runPartnerPreflight = (overrides: Partial<Record<"log" | "outreach" | "baseline" | "demo" | "report", string>> = {}) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openrelief-partner-"));

  try {
    mkdirSync(path.join(tempRoot, "docs"), { recursive: true });
    mkdirSync(path.join(tempRoot, "packages", "evals", "reports"), { recursive: true });
    writeFileSync(path.join(tempRoot, "docs", "partner-review-log.md"), overrides.log ?? reviewLog);
    writeFileSync(path.join(tempRoot, "docs", "partner-outreach.md"), overrides.outreach ?? outreach);
    writeFileSync(path.join(tempRoot, "docs", "baseline-failure-examples.md"), overrides.baseline ?? baselineFailures);
    writeFileSync(path.join(tempRoot, "docs", "demo-video-runbook.md"), overrides.demo ?? demoRunbook);
    writeFileSync(path.join(tempRoot, "packages", "evals", "reports", "california-wildfire-v1.json"), overrides.report ?? passingReport);

    return spawnSync(process.execPath, [scriptPath], {
      cwd: tempRoot,
      encoding: "utf8"
    });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

describe("partner review preflight", () => {
  it("passes with complete partner review packet", () => {
    const result = runPartnerPreflight();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Partner review preflight passed.");
  });

  it("rejects missing launch decision owner template", () => {
    const result = runPartnerPreflight({ log: reviewLog.replace("decision_owner: Saivedant Hava\n", "") });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review log missing: decision_owner: Saivedant Hava");
  });

  it("rejects missing review question prompt", () => {
    const result = runPartnerPreflight({
      log: reviewLog.replace("Which output could mislead a survivor under stress?\n", "")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review log missing: Which output could mislead a survivor under stress?");
  });

  it("rejects missing findings template field", () => {
    const result = runPartnerPreflight({ log: reviewLog.replace("finding_id:\n", "") });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review log missing: finding_id:");
  });

  it("rejects missing review answer template field", () => {
    const result = runPartnerPreflight({ log: reviewLog.replace("risk_escalation_answer:\n", "") });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review log missing: risk_escalation_answer:");
  });

  it("rejects review materials outside their template lists", () => {
    const result = runPartnerPreflight({
      log: reviewLog
        .replace("- docs/demo-video-runbook.md\n", "")
        .replace("- examples/california-wildfire/letters/denial-occupancy-proof.txt\n", "")
        .replace("notes:\n", "notes:\n- docs/demo-video-runbook.md\n- examples/california-wildfire/letters/denial-occupancy-proof.txt\n")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review log missing materials reviewed item: docs/demo-video-runbook.md");
  });

  it("rejects outreach without consent language", () => {
    const result = runPartnerPreflight({ outreach: outreach.replace("consent\n", "") });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner outreach missing: consent");
  });

  it("rejects failing eval report", () => {
    const report = JSON.stringify({ caseCount: 108, metrics: { passedCount: 107, failedCount: 1 } });
    const result = runPartnerPreflight({ report });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Eval report must show at least 108 passing cases and zero failed cases.");
  });
});

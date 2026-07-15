import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts", "public-launch-preflight.mjs");
const partnerReviewLogPath = path.join(repoRoot, "docs", "partner-review-log.md");

const completeReviewLog = `# Partner Review Log

review_id: review-001
review_date: 2026-07-15
Reviewer role: legal aid reviewer
reviewer organization type: nonprofit legal aid
Consent record: recorded outside public repo
materials reviewed:
- hosted synthetic sandbox
- docs/demo-script.md
- docs/demo-video-runbook.md
- docs/baseline-failure-examples.md
- packages/evals/reports/california-wildfire-v1.json
synthetic examples used:
- examples/california-wildfire/letters/denial-occupancy-proof.txt
note storage location: private review notes folder
sanitization status: sanitized
workflow_match_answer: reviewer confirmed workflow matches disaster letter review
misleading_output_answer: reviewer found no misleading output in synthetic flow
risk_escalation_answer: reviewer confirmed high-risk escalation is visible
evidence_gap_answer: reviewer found evidence categories acceptable for launch
citation_gap_answer: reviewer found source claims acceptable for launch
remove_before_launch_answer: reviewer found no screen to remove before launch
critical_issues_open: no
high_issues_open: closed
manual_safety_review_complete: yes
ready_for_public_demo: yes
decision_owner: Saivedant Hava
decision_date: 2026-07-15
notes: sanitized review found launch guardrails ready
`;

const runLaunchPreflight = (reviewLog: string) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openrelief-launch-"));
  const docsPath = path.join(tempRoot, "docs");

  try {
    mkdirSync(docsPath);
    writeFileSync(path.join(docsPath, "partner-review-log.md"), reviewLog);

    return spawnSync(process.execPath, [scriptPath], {
      cwd: tempRoot,
      encoding: "utf8"
    });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

describe("public launch preflight", () => {
  it("passes with completed sanitized review evidence", () => {
    const result = runLaunchPreflight(completeReviewLog);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Public launch preflight passed.");
  });

  it("keeps the public template blocked until review evidence is filled", () => {
    const result = runLaunchPreflight(readFileSync(partnerReviewLogPath, "utf8"));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field incomplete: note storage location");
  });

  it("reports multiple incomplete review fields together", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("review_id: review-001", "review_id:")
        .replace("risk_escalation_answer: reviewer confirmed high-risk escalation is visible", "risk_escalation_answer:")
        .replace("notes: sanitized review found launch guardrails ready", "notes:")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field incomplete: review_id");
    expect(result.stderr).toContain("Partner review field incomplete: risk_escalation_answer");
    expect(result.stderr).toContain("Partner review field incomplete: notes");
  });

  it("rejects missing review answer evidence", () => {
    const result = runLaunchPreflight(
      completeReviewLog.replace(
        "remove_before_launch_answer: reviewer found no screen to remove before launch",
        "remove_before_launch_answer:"
      )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field incomplete: remove_before_launch_answer");
  });

  it("rejects thin review answer evidence", () => {
    const result = runLaunchPreflight(
      completeReviewLog.replace(
        "citation_gap_answer: reviewer found source claims acceptable for launch",
        "citation_gap_answer: ok"
      )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: review answers need specific sanitized findings.");
  });

  it("rejects private data in launch review text", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace(
          "workflow_match_answer: reviewer confirmed workflow matches disaster letter review",
          "workflow_match_answer: reviewer@example.test confirmed workflow matches disaster letter review"
        )
        .replace(
          "notes: sanitized review found launch guardrails ready",
          "notes: sanitized review found SSN 123-45-6789 in notes"
        )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: workflow_match_answer contains email address.");
    expect(result.stderr).toContain("Public launch blocked: notes contains Social Security number.");
  });

  it("reports multiple launch blockers together", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("- docs/demo-video-runbook.md\n", "")
        .replace("review_date: 2026-07-15", "review_date: 2026-02-31")
        .replace("critical_issues_open: no", "critical_issues_open: yes")
        .replace("decision_owner: Saivedant Hava", "decision_owner: reviewer")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: materials reviewed missing docs/demo-video-runbook.md.");
    expect(result.stderr).toContain("Partner review field must use YYYY-MM-DD: review_date");
    expect(result.stderr).toContain("Public launch blocked: critical issues remain open.");
    expect(result.stderr).toContain("Public launch blocked: decision_owner must be Saivedant Hava.");
  });

  it("rejects missing reviewed materials", () => {
    const result = runLaunchPreflight(completeReviewLog.replace("- docs/demo-video-runbook.md\n", ""));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: materials reviewed missing docs/demo-video-runbook.md.");
  });

  it("rejects invalid review dates", () => {
    const result = runLaunchPreflight(completeReviewLog.replace("review_date: 2026-07-15", "review_date: 2026-02-31"));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field must use YYYY-MM-DD: review_date");
  });

  it("rejects future review and decision dates", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("review_date: 2026-07-15", "review_date: 2999-01-01")
        .replace("decision_date: 2026-07-15", "decision_date: 2999-01-01")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: review_date cannot be in the future.");
    expect(result.stderr).toContain("Public launch blocked: decision_date cannot be in the future.");
  });

  it("rejects launch decisions dated before review", () => {
    const result = runLaunchPreflight(completeReviewLog.replace("decision_date: 2026-07-15", "decision_date: 2026-07-14"));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: decision_date cannot be before review_date.");
  });

  it("rejects notes that are not sanitized", () => {
    const result = runLaunchPreflight(
      completeReviewLog.replace("sanitization status: sanitized", "sanitization status: needs-redaction")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: sanitization status must confirm sanitized notes.");
  });

  it("rejects missing launch decision notes", () => {
    const result = runLaunchPreflight(
      completeReviewLog.replace("notes: sanitized review found launch guardrails ready", "notes:")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field incomplete: notes");
  });
});

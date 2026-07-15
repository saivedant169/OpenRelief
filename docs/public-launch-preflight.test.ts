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

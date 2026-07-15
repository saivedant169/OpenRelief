import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts", "public-launch-preflight.mjs");
const partnerReviewLogPath = path.join(repoRoot, "docs", "partner-review-log.md");
const evidencePaths = [
  "docs/demo-script.md",
  "docs/demo-video-runbook.md",
  "docs/partner-review-packet.md",
  "docs/baseline-failure-examples.md",
  "packages/evals/reports/california-wildfire-v1.json",
  "examples/california-wildfire/letters/denial-occupancy-proof.txt"
];

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
- docs/partner-review-packet.md
- docs/baseline-failure-examples.md
- packages/evals/reports/california-wildfire-v1.json
synthetic examples used:
- examples/california-wildfire/letters/denial-occupancy-proof.txt
note storage location: private review notes folder
sanitization status: sanitized
public tracking issue: https://github.com/saivedant169/OpenRelief/issues/1
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

const runLaunchPreflight = (reviewLog: string, options: { omitEvidencePaths?: string[] } = {}) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openrelief-launch-"));
  const docsPath = path.join(tempRoot, "docs");
  const omittedEvidencePaths = new Set(options.omitEvidencePaths ?? []);

  try {
    mkdirSync(docsPath);
    writeFileSync(path.join(docsPath, "partner-review-log.md"), reviewLog);

    for (const evidencePath of evidencePaths) {
      if (omittedEvidencePaths.has(evidencePath)) {
        continue;
      }

      const filePath = path.join(tempRoot, evidencePath);
      mkdirSync(path.dirname(filePath), { recursive: true });
      writeFileSync(filePath, "synthetic evidence");
    }

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
    expect(result.stderr).toContain("Partner review field incomplete: review_date");
    expect(result.stderr).toContain("Partner review field incomplete: note storage location");
    expect(result.stderr).toContain("Partner review field incomplete: decision_date");
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

  it("rejects placeholder session evidence", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("Reviewer role: legal aid reviewer", "Reviewer role: TBD")
        .replace("Consent record: recorded outside public repo", "Consent record: N/A")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: Reviewer role must include specific review evidence.");
    expect(result.stderr).toContain("Public launch blocked: Consent record must include specific review evidence.");
  });

  it("rejects placeholder review answers and launch notes", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("risk_escalation_answer: reviewer confirmed high-risk escalation is visible", "risk_escalation_answer: unknown")
        .replace("notes: sanitized review found launch guardrails ready", "notes: pending")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Public launch blocked: risk_escalation_answer must include specific review evidence."
    );
    expect(result.stderr).toContain("Public launch blocked: notes must include specific review evidence.");
  });

  it("rejects invalid public tracking issue URLs", () => {
    const result = runLaunchPreflight(
      completeReviewLog.replace(
        "public tracking issue: https://github.com/saivedant169/OpenRelief/issues/1",
        "public tracking issue: docs/partner-review-log.md"
      )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Public launch blocked: public tracking issue must be an OpenRelief GitHub issue URL."
    );
  });

  it("rejects private data in session evidence", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("Consent record: recorded outside public repo", "Consent record: reviewer@example.test")
        .replace("note storage location: private review notes folder", "note storage location: call 555-123-4567")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: Consent record contains email address.");
    expect(result.stderr).toContain("Public launch blocked: note storage location contains phone number.");
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

  it("rejects restricted survivor and partner details", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace(
          "evidence_gap_answer: reviewer found evidence categories acceptable for launch",
          "evidence_gap_answer: reviewer saw screenshot with 123 Main Street"
        )
        .replace(
          "notes: sanitized review found launch guardrails ready",
          "notes: insurance claim number ABC12345 appeared with medical record"
        )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: evidence_gap_answer contains street address.");
    expect(result.stderr).toContain("Public launch blocked: evidence_gap_answer contains screenshot reference.");
    expect(result.stderr).toContain("Public launch blocked: notes contains insurance claim number.");
    expect(result.stderr).toContain("Public launch blocked: notes contains medical detail.");
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

  it("requires reviewed materials and examples in their launch lists", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("- docs/demo-video-runbook.md\n", "")
        .replace("- examples/california-wildfire/letters/denial-occupancy-proof.txt\n", "")
        .replace(
          "notes: sanitized review found launch guardrails ready",
          "notes: sanitized review found docs/demo-video-runbook.md and examples/california-wildfire/letters/denial-occupancy-proof.txt ready"
        )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: materials reviewed missing docs/demo-video-runbook.md.");
    expect(result.stderr).toContain(
      "Public launch blocked: synthetic examples used missing examples/california-wildfire/letters/denial-occupancy-proof.txt."
    );
  });

  it("rejects private data in launch evidence lists", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace(
          "- hosted synthetic sandbox\n",
          "- hosted synthetic sandbox\n- reviewer@example.test notes\n"
        )
        .replace(
          "- examples/california-wildfire/letters/denial-occupancy-proof.txt\n",
          "- examples/california-wildfire/letters/denial-occupancy-proof.txt\n- screenshot review copy\n"
        )
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: materials reviewed contains email address.");
    expect(result.stderr).toContain("Public launch blocked: synthetic examples used contains screenshot reference.");
  });

  it("rejects missing launch evidence files", () => {
    const result = runLaunchPreflight(completeReviewLog, {
      omitEvidencePaths: [
        "docs/demo-video-runbook.md",
        "examples/california-wildfire/letters/denial-occupancy-proof.txt"
      ]
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Public launch blocked: evidence path missing docs/demo-video-runbook.md.");
    expect(result.stderr).toContain(
      "Public launch blocked: evidence path missing examples/california-wildfire/letters/denial-occupancy-proof.txt."
    );
  });

  it("rejects invalid review dates", () => {
    const result = runLaunchPreflight(completeReviewLog.replace("review_date: 2026-07-15", "review_date: 2026-02-31"));

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field must use YYYY-MM-DD: review_date");
  });

  it("rejects unfilled date templates", () => {
    const result = runLaunchPreflight(
      completeReviewLog
        .replace("review_date: 2026-07-15", "review_date: YYYY-MM-DD")
        .replace("decision_date: 2026-07-15", "decision_date: YYYY-MM-DD")
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review field incomplete: review_date");
    expect(result.stderr).toContain("Partner review field incomplete: decision_date");
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

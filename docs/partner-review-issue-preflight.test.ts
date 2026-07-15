import { describe, expect, it } from "vitest";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts", "partner-review-issue-preflight.mjs");
const issueUrl = "https://github.com/saivedant169/OpenRelief/issues/1";
const reviewLog = `# Partner Review Log

public tracking issue: ${issueUrl}
`;
const completeIssue = {
  url: issueUrl,
  state: "OPEN",
  title: "[Partner review]: V1 launch safety review",
  labels: [{ name: "partner-review" }, { name: "safety" }, { name: "V1" }],
  body: `No real survivor PII

## Objective

Complete external partner review needed before public demo promotion. Public launch remains blocked until sanitized review evidence is recorded in docs/partner-review-log.md and npm run launch:preflight passes.

## Materials reviewed

- hosted synthetic sandbox: https://saivedant169.github.io/OpenRelief/
- docs/demo-script.md
- docs/demo-video-runbook.md
- docs/partner-review-packet.md
- docs/baseline-failure-examples.md
- packages/evals/reports/california-wildfire-v1.json
- examples/california-wildfire/letters/denial-occupancy-proof.txt

## Reviewer targets

- legal aid reviewer
- disaster case worker
- emergency management volunteer
- civic technology reviewer
- accessibility reviewer

## Session fields

Review date must be within 90 days before public launch.

\`\`\`text
review_id:
review_date: YYYY-MM-DD
Reviewer role:
reviewer organization type:
Consent record:
note storage location:
sanitization status: sanitized | private-only | needs-redaction
\`\`\`

## Review answers

\`\`\`text
workflow_match_answer:
misleading_output_answer:
risk_escalation_answer:
evidence_gap_answer:
citation_gap_answer:
remove_before_launch_answer:
\`\`\`

## Sanitized findings

\`\`\`text
finding_id:
severity: critical | high | medium | low
area: legal boundary | source grounding | escalation | privacy | accessibility | workflow
summary:
evidence:
recommended change:
public_issue_safe: yes | no
\`\`\`

## Launch decision fields

\`\`\`text
critical_issues_open:
high_issues_open:
manual_safety_review_complete:
ready_for_public_demo: yes | no
decision_owner: Saivedant Hava
decision_date: YYYY-MM-DD
notes:
\`\`\`

## Review questions

1. Does workflow match real disaster letter review?
2. Which output could mislead a survivor under stress?
3. Which risk flag needs faster human escalation?
4. Which evidence category is missing or overbroad?
5. Which source or policy claim needs stronger citation?
6. Which screen or wording should be removed before launch?

## Completion checklist

- [ ] Consent captured outside public repo.
- [ ] Raw notes stored outside public repo.
- [ ] Sanitized findings contain no names, addresses, phone numbers, emails, SSNs, agency IDs, insurance details, medical details, immigration details, screenshots, or partner private data.
- [ ] Findings use synthetic examples only.
- [ ] Sanitized outcome copied into docs/partner-review-log.md.
- [ ] Public issue URL copied into public tracking issue field.
- [ ] Launch risk copied into public issue launch risk field.
- [ ] Critical issues open set to no.
- [ ] High issues accepted or closed.
- [ ] npm run launch:preflight passes.

## Launch risk

pending`
};

const runIssuePreflight = (issue = completeIssue, log = reviewLog) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openrelief-issue-"));
  const binPath = path.join(tempRoot, "bin");
  const fakeGhPath = path.join(binPath, "gh");
  const issueJsonPath = path.join(tempRoot, "issue.json");

  try {
    mkdirSync(path.join(tempRoot, "docs"), { recursive: true });
    mkdirSync(binPath);
    writeFileSync(path.join(tempRoot, "docs", "partner-review-log.md"), log);
    writeFileSync(issueJsonPath, JSON.stringify(issue));
    writeFileSync(fakeGhPath, "#!/bin/sh\ncat \"$OPENRELIEF_FAKE_ISSUE_JSON\"\n");
    chmodSync(fakeGhPath, 0o755);

    return spawnSync(process.execPath, [scriptPath], {
      cwd: tempRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        PATH: `${binPath}:${process.env.PATH ?? ""}`,
        OPENRELIEF_FAKE_ISSUE_JSON: issueJsonPath
      }
    });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

describe("partner review issue preflight", () => {
  it("passes with active issue tracking launch fields", () => {
    const result = runIssuePreflight();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Partner review issue preflight passed.");
  });

  it("rejects missing review labels", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      labels: [{ name: "partner-review" }, { name: "safety" }]
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue missing label: V1");
  });

  it("rejects title drift", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      title: "[Partner review]: stale launch review"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue title must be: [Partner review]: V1 launch safety review");
  });

  it("rejects missing launch fields in issue body", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body.replace("workflow_match_answer:\n", "")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue missing body text: workflow_match_answer:");
  });

  it("rejects private identifiers in public issue body", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body.replace(
        "notes:\n",
        "notes:\nreviewer@example.test\ncall 555-123-4567\nSSN 123-45-6789\n"
      )
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue contains email address.");
    expect(result.stderr).toContain("Partner review issue contains phone number.");
    expect(result.stderr).toContain("Partner review issue contains Social Security number.");
  });

  it("rejects restricted survivor details in public issue body", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body.replace(
        "notes:\n",
        "notes:\nmedical record shown\nimmigration status copied\nscreenshot attached\n"
      )
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue contains medical detail.");
    expect(result.stderr).toContain("Partner review issue contains immigration detail.");
    expect(result.stderr).toContain("Partner review issue contains screenshot reference.");
  });

  it("rejects launch fields outside their issue sections", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body
        .replace("Reviewer role:\n", "")
        .replace("npm run launch:preflight passes", "npm run launch:preflight passes\n\nReviewer role:")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue section Session fields missing: Reviewer role:");
  });

  it("rejects review materials outside the materials section", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body
        .replace("- docs/demo-video-runbook.md\n", "")
        .replace("npm run launch:preflight passes.", "npm run launch:preflight passes.\n\ndocs/demo-video-runbook.md")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue materials missing: docs/demo-video-runbook.md");
  });

  it("rejects missing objective text and launch risk section", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body
        .replace("Complete external partner review needed before public demo promotion. ", "")
        .replace("\n## Launch risk\n\npending", "")
        .replace(
          "## Completion checklist",
          "Complete external partner review needed before public demo promotion.\n\n## Completion checklist"
        )
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Partner review issue section Objective missing: Complete external partner review needed before public demo promotion."
    );
    expect(result.stderr).toContain("Partner review issue missing section: Launch risk");
  });

  it("rejects invalid launch risk value", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body.replace("\n## Launch risk\n\npending", "\n## Launch risk\n\nunknown")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Partner review issue section Launch risk must include pending, critical, high, medium, low, or none."
    );
  });

  it("rejects extra launch risk values", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body.replace("\n## Launch risk\n\npending", "\n## Launch risk\n\npending\nunknown")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Partner review issue section Launch risk must contain exactly one value: pending, critical, high, medium, low, or none."
    );
  });

  it("passes when recorded public issue launch risk matches issue", () => {
    const result = runIssuePreflight(
      {
        ...completeIssue,
        body: completeIssue.body.replace("\n## Launch risk\n\npending", "\n## Launch risk\n\nlow")
      },
      `${reviewLog}public issue launch risk: low\n`
    );

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Partner review issue preflight passed.");
  });

  it("ignores review log launch risk template values", () => {
    const result = runIssuePreflight(completeIssue, `${reviewLog}public issue launch risk: low | none\n`);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Partner review issue preflight passed.");
  });

  it("rejects recorded public issue launch risk drift", () => {
    const result = runIssuePreflight(completeIssue, `${reviewLog}public issue launch risk: low\n`);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Partner review issue Launch risk must match docs/partner-review-log.md public issue launch risk: low"
    );
  });

  it("rejects duplicate recorded public issue launch risk values", () => {
    const result = runIssuePreflight(
      {
        ...completeIssue,
        body: completeIssue.body.replace("\n## Launch risk\n\npending", "\n## Launch risk\n\nlow")
      },
      `${reviewLog}public issue launch risk: none\npublic issue launch risk: low\n`
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review log public issue launch risk must contain at most one final value.");
  });

  it("rejects missing sanitized findings section", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body
        .replace(
          "\n## Sanitized findings\n\n```text\nfinding_id:\nseverity: critical | high | medium | low\narea: legal boundary | source grounding | escalation | privacy | accessibility | workflow\nsummary:\nevidence:\nrecommended change:\npublic_issue_safe: yes | no\n```\n",
          "\n"
        )
        .replace(
          "## Completion checklist",
          "finding_id:\nseverity: critical | high | medium | low\narea: legal boundary | source grounding | escalation | privacy | accessibility | workflow\nsummary:\nevidence:\nrecommended change:\npublic_issue_safe: yes | no\n\n## Completion checklist"
        )
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue missing section: Sanitized findings");
  });

  it("rejects review targets and questions outside their issue sections", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body
        .replace("- legal aid reviewer\n", "")
        .replace("2. Which output could mislead a survivor under stress?\n", "")
        .replace("## Reviewer targets", "legal aid reviewer\n\n## Reviewer targets")
        .replace("## Review questions", "Which output could mislead a survivor under stress?\n\n## Review questions")
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue section Reviewer targets missing: legal aid reviewer");
    expect(result.stderr).toContain(
      "Partner review issue section Review questions missing: Which output could mislead a survivor under stress?"
    );
  });

  it("rejects completion checklist outside its issue section", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      body: completeIssue.body
        .replace("- [ ] Findings use synthetic examples only.\n", "")
        .replace(
          "## Completion checklist",
          "Findings use synthetic examples only.\n\n## Completion checklist"
        )
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      "Partner review issue section Completion checklist missing: Findings use synthetic examples only."
    );
  });

  it("rejects issue URL drift from the review log", () => {
    const result = runIssuePreflight({
      ...completeIssue,
      url: "https://github.com/saivedant169/OpenRelief/issues/2"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Partner review issue URL does not match docs/partner-review-log.md.");
  });
});

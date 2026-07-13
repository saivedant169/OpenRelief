# Partner Review Log

Use this template to record safety and workflow review from legal aid, disaster case workers, emergency management volunteers, civic technology groups, and accessibility reviewers.

Keep completed notes outside the public repo until sanitized. Synthetic examples only. No real survivor PII, real case notes, real addresses, phone numbers, emails, SSNs, agency IDs, insurance claim numbers, medical records, immigration details, screenshots, or partner private data.

## Session Record

Reviewer role and Consent record must be captured before using feedback.

```text
review_id:
review_date:
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
sanitization status:
```

## Review Questions

1. Does workflow match real disaster letter review?
2. Which output could mislead a survivor under stress?
3. Which risk flag needs faster human escalation?
4. Which evidence category is missing or overbroad?
5. Which source or policy claim needs stronger citation?
6. Which screen or wording should be removed before launch?

## Findings Template

```text
finding_id:
severity: critical | high | medium | low
area: legal boundary | source grounding | escalation | privacy | accessibility | workflow
summary:
evidence:
recommended change:
public_issue_safe: yes | no
```

## Critical issue

Public launch should stop if any reviewer finds a critical issue in:

- legal boundary language,
- source-backed policy claims,
- denial and appeal escalation,
- high-risk flag routing,
- local browser storage,
- hosted synthetic sandbox guardrails,
- real-data handling,
- accessibility blocker.

## Launch decision

Launch decision must stay blocked while critical issues remain open.

```text
critical_issues_open:
high_issues_open:
manual_safety_review_complete:
ready_for_public_demo: yes | no
decision_owner: Saivedant Hava
decision_date:
notes:
```

Only sanitized, consented, non-identifying summaries should become public issues or documentation.

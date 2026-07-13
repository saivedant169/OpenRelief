# OpenRelief Demo Script

Use this script for a 3-minute public demo of the California wildfire V1 workflow. Use synthetic data only.

## Setup

- Open the hosted sandbox or local app.
- Use `examples/california-wildfire/letters/denial-occupancy-proof.txt`.
- Keep network logs, analytics, and external model calls off.
- Do not paste real letters, screenshots, addresses, phone numbers, emails, SSNs, agency IDs, medical records, insurance records, or partner notes.

## Talk Track

### 0:00 - Positioning

OpenRelief is an open-source operating layer for disaster recovery paperwork. V1 focuses on California wildfire letters, local browser storage, source-backed next steps, and human review boundaries.

Say:

- This is not a government agency.
- No legal advice.
- No live submission.
- No final eligibility decision.
- Demo data is synthetic.

### 0:30 - Letter Review

Paste or load the synthetic denial letter.

Show:

- file text stays in the browser,
- user can edit extracted text,
- document text is treated as untrusted input.

### 1:00 - Analysis

Run letter analysis.

Show:

- letter type,
- facts from the uploaded letter,
- uncertainty note,
- detected appeal window,
- human review flag.

### 1:30 - Checklist

Show source-backed checklist.

Call out:

- request human review,
- confirm deadline,
- collect proof of occupancy,
- review official sources.

### 2:00 - Evidence Packet

Show evidence packet outline.

Call out:

- identity,
- residence,
- insurance,
- receipts,
- communications,
- other disaster recovery documents.

### 2:30 - Case-Worker Handoff

Save a case snapshot and open the local queue.

Show:

- case summary,
- missing evidence,
- escalation flags,
- local notes,
- export warning for sensitive contents.

### 3:00 - Close

OpenRelief is narrow by design: local-first workflow, synthetic benchmark, policy sources, safety gates, and human escalation before broader public use.

Point viewers to:

- `docs/technical-report.md`,
- `packages/evals/README.md`,
- `docs/hosted-sandbox.md`,
- `docs/partner-outreach.md`.

## Do Not Show

- real survivor paperwork,
- copied government letters from real cases,
- partner-provided notes,
- production agency portals,
- legal strategy,
- eligibility promises,
- live submissions.

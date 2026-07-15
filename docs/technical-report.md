# Evaluating Disaster Recovery Workflows

OpenRelief is an open-source operating layer for disaster recovery paperwork. V1 focuses on California wildfire recovery, with a local-first workflow for letter review, checklist generation, evidence packet planning, and case-worker handoff.

This report documents why the approach works, what has been built, how safety is measured, and what remains out of scope.

## Problem

Disaster recovery paperwork arrives when survivors are under stress. A single case can include FEMA letters, SBA references, insurance requests, missing residence documents, deadlines, housing risk, medical needs, and appeal paths.

Generic chat workflows are unsafe for this setting because they can invent eligibility claims, miss escalation, leak sensitive data, or blur the line between navigation and legal advice.

OpenRelief works because the product is not an eligibility oracle. It is a constrained workflow that turns confusing paperwork into:

- letter facts,
- uncertainty notes,
- source-backed checklist items,
- evidence packet outlines,
- human escalation flags,
- local case-worker review state.

## Product Scope

V1 supports a California wildfire demo flow:

1. User starts without an account.
2. User uploads or pastes a FEMA-style letter.
3. Browser extracts text from TXT, PDF, JPG, or PNG when possible.
4. User reviews and edits extracted text.
5. Domain logic classifies the letter.
6. Output separates facts from uncertainty.
7. Checklist and evidence packet are generated from letter requests and policy sources.
8. High-risk cases route to human review.
9. User can save, import, export, and clear local case snapshots.

V1 does not submit applications, provide legal advice, make final eligibility decisions, or store real survivor data remotely.

## Local-first architecture

OpenRelief V1 uses TypeScript, React, Vite, Vitest, and Playwright.

Primary layers:

- `packages/core`: deterministic domain logic for classification, risk flags, checklist generation, evidence packets, policy validation, exports, and bounded appeal drafts.
- `packages/policy-packs`: California wildfire policy pack with source metadata, source dates, jurisdiction, disaster type, and trust tier.
- `packages/evals`: synthetic cases, graders, and machine-readable report output.
- `apps/web`: browser UI, local file extraction, local storage, PWA shell, and case-worker queue.

V1 has no backend. Uploaded files, extracted text, saved case snapshots, and notes stay in browser-local state unless the user exports them.

## Safety model

Safety controls are built into workflow boundaries:

- No legal advice.
- No live submission.
- No final eligibility determination.
- No remote PII storage in V1.
- Uploaded document text treated as untrusted input.
- Policy text checked for instruction-like content.
- Policy claims require source IDs.
- Denial, appeal, homelessness, medical emergency, abuse, immigration-sensitive, disability accommodation, and suspected scam flags route to human review.
- Exports warn that packet text may include personal information.

The app labels uncertain interpretation separately from letter facts. This is important because recovery paperwork can require legal aid, case-worker judgment, or updated program guidance.

## Source grounding

The current California wildfire policy pack uses official federal sources:

- FEMA appeal information.
- FEMA documents needed for assistance.
- SBA disaster assistance.

Each source record includes:

- URL,
- publisher,
- retrieved date,
- last-reviewed date,
- jurisdiction,
- disaster type,
- source type,
- trust tier.

Policy validation fails when rules lack sources or contain instruction-like text. Source freshness warnings trigger when sources are more than 30 days past last review.

## Benchmark

Current machine-readable eval report:

`packages/evals/reports/california-wildfire-v1.json`

Current report summary:

- suite ID: `california-wildfire-v1`
- schema version: `1`
- case count: `166`
- passed count: `166`
- failed count: `0`

The suite covers:

- denial letters,
- request-for-information letters,
- approval letters,
- deadline and inspection notices,
- unknown manual-review letters,
- noisy OCR-like inputs,
- high-risk escalation contexts,
- prompt-injection style document text,
- source grounding,
- hallucinated eligibility checks,
- privacy checks,
- legal-advice boundary checks,
- multilingual unknown-letter routing,
- stale-policy source-review routing,
- case-worker triage handoff cases.

The benchmark is synthetic only. No real survivor data is required to reproduce results.

## Baseline failure examples

Reviewer-facing examples live in `docs/baseline-failure-examples.md`. They document outputs that must fail automated or manual review, including unsupported eligibility claims, legal advice, submission claims, privacy leakage, advice to ignore official letters, missing sources, and missing human escalation.

These examples map to current safety grader failures:

- `unsupported_eligibility_claim`
- `legal_advice`
- `submission_claim`
- `privacy_leakage`
- `ignore_official_letter`
- `missing_sources`
- `missing_human_escalation`

## Current Verification Gates

Release readiness requires:

- `npm run check`
- `npm run evals`
- `npm run test:e2e`
- `npm run test:security`
- `npm run security:audit`
- `npm run docs:check`
- `npm run partner:review:preflight`
- manual safety review

The `npm run check` gate includes unit tests, evals, policy validation, TypeScript, accessibility smoke test, security smoke test, dependency audit, docs review, production build, and Playwright E2E tests.

Demo recording readiness is checked by `npm run demo:video:preflight`. The command verifies the demo video runbook, public talk track, synthetic demo letter, and current passing eval report before recording.

Partner review readiness is checked by `npm run partner:review:preflight`. The command verifies the Partner review log, partner outreach packet, baseline failure examples, demo runbook, and current passing eval report before review sessions.

## Why This Idea Works

OpenRelief has a defensible wedge because it combines four things that are usually separate:

- useful disaster paperwork workflow,
- local-first privacy posture,
- source-grounded policy structure,
- reproducible safety evals.

This makes the project valuable to survivors and case workers while also producing a credible agent-safety environment. It is narrow enough to test and broad enough to matter.

The strongest technical choice is keeping V1 deterministic where possible. Classification, checklist creation, risk escalation, and evidence packet structure work without trusting a remote model. A future model layer can improve language quality or triage assistance, but it must remain behind source and safety checks.

## Limitations

OpenRelief V1 is not a replacement for FEMA, SBA, legal aid, insurance, or a disaster case worker.

Known limits:

- No legal advice.
- No live submission.
- No final eligibility decision.
- No remote multi-user case management.
- No production partner workflow yet.
- No guarantee that policy sources remain current without review.
- Synthetic cases do not cover every real-world disaster recovery scenario.
- English-first workflow.

These limits are intentional. V1 proves a safe local workflow before adding broader jurisdiction coverage, partner review, model adapters, hosted sandboxing, or multilingual support.

## Next Work

Next launch work:

- keep expanding benchmark coverage,
- maintain hosted sandbox guardrails,
- record short demo video using `docs/demo-video-runbook.md`,
- collect partner safety review using `docs/partner-review-log.md`,
- broaden multilingual and stale-policy eval variants after partner review.

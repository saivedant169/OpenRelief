# 02 - Product Requirements

## Scope

Product: OpenRelief California Wildfire Recovery.

Primary workflow: survivor uploads a disaster assistance letter and receives a safe explanation, next-step checklist, and evidence packet outline.

Secondary workflow: case worker reviews a synthetic/local case, identifies missing documents, and sees escalation flags.

## Personas

### Survivor

Needs:

- understand letter,
- know deadline,
- know missing documents,
- avoid scams,
- preserve evidence,
- ask human for help.

Constraints:

- stress,
- limited time,
- possible low bandwidth,
- mobile device,
- lost documents,
- limited English,
- accessibility needs.

### Case Worker

Needs:

- triage cases quickly,
- spot missing documents,
- see deadlines,
- prepare appeal packet outline,
- track status,
- avoid unsafe advice.

Constraints:

- high caseload,
- policy complexity,
- limited time with each survivor.

### Legal Aid / Nonprofit Reviewer

Needs:

- review safety of generated outputs,
- verify source citations,
- identify legal escalation,
- contribute local resource lists.

### AI/Evals Researcher

Needs:

- reproducible tasks,
- deterministic graders,
- realistic multi-turn cases,
- traceable failure modes.

## Core Jobs To Be Done

1. When I receive a confusing disaster letter, I want to know what it means so I do not miss my next step.
2. When I lost documents, I want a replacement/evidence checklist so I can rebuild my packet.
3. When I am denied or asked for more information, I want safe escalation guidance so I do not rely on generic AI advice.
4. When I help multiple survivors, I want a case timeline and missing-doc view so I can triage safely.
5. When I evaluate AI agents, I want realistic disaster recovery tasks so I can measure grounding, privacy, and escalation.

## Functional Requirements

### Intake

- FR-001: System MUST allow user to start without account.
- FR-002: System MUST ask only fields needed for the chosen workflow.
- FR-003: System MUST allow user to skip sensitive fields.
- FR-004: System MUST classify immediate risk flags: homelessness, medical emergency, domestic violence/abuse, disability accommodation, immigration-sensitive concern, denial/appeal deadline.

### Letter Upload

- FR-010: System MUST accept PDF upload.
- FR-011: System SHOULD accept image upload.
- FR-012: System MUST extract visible text when possible.
- FR-013: System MUST allow manual correction of extracted text.
- FR-014: System MUST classify letter type as one of: approval, denial, request for information, deadline notice, inspection notice, unknown.
- FR-015: System MUST preserve original uploaded file locally only unless user exports it.

### Explanation

- FR-020: System MUST produce plain-language summary.
- FR-021: System MUST list deadlines found in uploaded letter.
- FR-022: System MUST distinguish facts from uncertain interpretations.
- FR-023: System MUST cite source for every policy claim.
- FR-024: System MUST refuse to state final eligibility determination.
- FR-025: System MUST include human escalation when high-risk flags are present.

### Checklist

- FR-030: System MUST generate next-step checklist based on letter type and intake context.
- FR-031: Checklist items MUST include reason and source when tied to policy.
- FR-032: Checklist MUST mark user-editable items.
- FR-033: Checklist MUST include deadline fields when present.

### Evidence Packet

- FR-040: System MUST generate evidence packet outline.
- FR-041: Packet MUST group evidence by category: identity, residence, ownership/lease, damage, receipts, insurance, medical/transportation, communications, other.
- FR-042: Packet MUST mark missing/optional/available status.
- FR-043: Packet MUST be exportable without uploading to a server.

### Case Worker View

- FR-050: System SHOULD provide local dashboard of cases.
- FR-051: Dashboard SHOULD show status, missing evidence, deadlines, and escalation flags.
- FR-052: Dashboard MUST not expose hidden sensitive fields unless user entered them.

### Evals

- FR-060: System MUST include synthetic cases.
- FR-061: System MUST include graders for classification, grounding, privacy, escalation, and hallucination.
- FR-062: System MUST produce machine-readable eval results.

## Non-Functional Requirements

- NFR-001: Primary demo workflow MUST work offline after app load.
- NFR-002: Uploaded files MUST remain local in v1.
- NFR-003: No analytics or telemetry MAY collect PII.
- NFR-004: UI MUST support mobile viewport width of 360px.
- NFR-005: Interactive controls SHOULD have minimum 44px target size.
- NFR-006: UI MUST target WCAG 2.2 A/AA.
- NFR-007: Letter explanation SHOULD be written around 6th-8th grade reading level.
- NFR-008: Policy pack MUST record source URL and retrieved date.
- NFR-009: Eval suite MUST fail build on critical safety regressions.

## Acceptance Criteria

- AC-001: Given first-time user, when app loads, then user can start letter workflow without account. Covers FR-001.
- AC-002: Given uploaded sample denial letter, when extraction completes, then system classifies as denial and shows editable extracted text. Covers FR-012, FR-013, FR-014.
- AC-003: Given letter with deadline, when explanation renders, then deadline appears in summary and checklist. Covers FR-021, FR-033.
- AC-004: Given policy statement in output, when user opens source detail, then source URL and retrieved date appear. Covers FR-023, NFR-008.
- AC-005: Given case marked medical emergency, when checklist generates, then human escalation appears before ordinary paperwork tasks. Covers FR-004, FR-025.
- AC-006: Given request for final eligibility, when system answers, then it refuses final determination and provides source-backed navigation. Covers FR-024.
- AC-007: Given synthetic case set, when evals run, then hallucinated eligibility grader catches unsupported eligibility claims. Covers FR-061, NFR-009.
- AC-008: Given no network after app load, when user completes demo workflow, then explanation/checklist/evidence outline still works on seeded data. Covers NFR-001.

## Edge Cases

- EC-001: PDF has no extractable text.
- EC-002: OCR text is wrong or incomplete.
- EC-003: Letter language is not English.
- EC-004: Letter type is unknown.
- EC-005: Source policy data is stale.
- EC-006: User refuses to provide income/insurance details.
- EC-007: User reports homelessness.
- EC-008: User reports unsafe living situation or abuse.
- EC-009: User requests legal strategy.
- EC-010: User asks system to submit application.

## Out of Scope

- OOS-001: Live FEMA/SBA submission.
- OOS-002: Legal advice.
- OOS-003: Final eligibility determination.
- OOS-004: Remote multi-user case management.
- OOS-005: Real survivor data in public demo.
- OOS-006: National all-disaster coverage.


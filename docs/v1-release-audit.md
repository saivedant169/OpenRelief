# V1 Release Audit

Status date: 2026-07-15

This audit maps V1 requirements to repo evidence. It supports release review, but does not replace partner or manual safety review.

## Gate Evidence

- Local gate: `npm run check`
- Remote gate: CI workflow
- Hosted gate: OpenRelief Sandbox workflow
- Benchmark: `packages/evals/reports/california-wildfire-v1.json`
- Manual gate: `docs/partner-review-log.md`

## Acceptance Criteria

| ID | Evidence |
|---|---|
| AC-001 | `apps/web/e2e/openrelief.spec.ts` starts workflow without account. |
| AC-002 | `apps/web/e2e/openrelief.spec.ts` uploads sample denial letter and verifies editable extracted text. |
| AC-003 | `apps/web/e2e/openrelief.spec.ts` verifies deadline in summary and checklist. |
| AC-004 | `apps/web/e2e/openrelief.spec.ts` verifies source URL and retrieved date in UI and export. |
| AC-005 | `apps/web/e2e/openrelief.spec.ts` verifies immediate danger escalation appears before paperwork. |
| AC-006 | `apps/web/e2e/openrelief.spec.ts` verifies final eligibility requests route to source-backed human review. |
| AC-007 | `packages/evals/src/graders.test.ts` and `packages/evals/src/eval-report.test.ts` verify safety graders and report output. |
| AC-008 | `apps/web/e2e/openrelief.spec.ts` verifies offline app shell and offline PDF workflow. |

## Functional Requirements

| ID | Evidence |
|---|---|
| FR-001 | No login route or account gate exists. E2E starts on `/`. |
| FR-002 | Intake fields are scoped to disaster type, county, housing, insurance, known deadline, lost documents, available evidence, and risks. |
| FR-003 | Optional intake fields can stay blank. App tests cover skippable basic context. |
| FR-004 | `packages/core/test/openrelief.test.ts` covers homelessness, medical emergency, unsafe living situation, disability accommodation, immigration-sensitive concern, deadline, and appeal flags. |
| FR-010 | PDF upload is covered by security tests and offline E2E. |
| FR-011 | Image upload and local OCR are covered by `apps/web/src/security.test.tsx`. |
| FR-012 | Text extraction is covered for TXT, PDF, raw PDF fallback, and image OCR. |
| FR-013 | Manual correction is covered by editable extracted text tests. |
| FR-014 | `packages/core/test/openrelief.test.ts` covers approval, denial, request for information, deadline notice, inspection notice, and unknown. |
| FR-015 | `apps/web/src/security.test.tsx` verifies the workflow stays offline and file names are redacted in local storage. |
| FR-020 | `packages/core/test/openrelief.test.ts` verifies plain-language summary reading level. |
| FR-021 | Deadline detection tests cover appeal and response deadline text. |
| FR-022 | Core tests verify facts are separated from uncertain interpretation. |
| FR-023 | E2E and export tests verify source citation URL and retrieved date. |
| FR-024 | E2E verifies final eligibility requests are refused and routed to human review. |
| FR-025 | Core and E2E tests verify high-risk human escalation. |
| FR-030 | Core and web tests verify checklist generation from letter type and intake risks. |
| FR-031 | Core tests verify checklist reasons and source IDs. |
| FR-032 | Core tests verify checklist items are editable. |
| FR-033 | Core and E2E tests verify deadline fields on checklist items. |
| FR-040 | Core and web tests verify evidence packet outline generation. |
| FR-041 | Core tests verify evidence grouping by required categories. |
| FR-042 | Core tests verify missing, optional, and available evidence status. |
| FR-043 | Web tests verify packet text export without server upload. |
| FR-050 | Web tests verify local case queue and saved case detail. |
| FR-051 | Web tests verify queue status, missing evidence, deadlines, and escalation flags. |
| FR-052 | Web and security tests verify restricted identifiers are redacted in saved case metadata and details. |
| FR-060 | Synthetic fixtures live in `packages/evals/src/california-wildfire-fixtures.ts`. |
| FR-061 | Graders cover classification, grounding, privacy, escalation, and unsafe output. |
| FR-062 | `npm run evals:report` writes `packages/evals/reports/california-wildfire-v1.json`. |

## Non-Functional Requirements

| ID | Evidence |
|---|---|
| NFR-001 | E2E verifies primary workflow after service worker cache and offline reload. |
| NFR-002 | Security tests verify no network fetch during workflow and local browser storage only. |
| NFR-003 | Hosted sandbox preflight scans source and build output for telemetry markers. |
| NFR-004 | Mobile E2E verifies 360px viewport without horizontal overflow. |
| NFR-005 | A11y tests verify 44px target contracts for primary actions, upload, intake fields, queue rows, archive actions, and task rows. |
| NFR-006 | A11y smoke tests verify named controls and release readiness documents WCAG target. |
| NFR-007 | Core tests verify letter summary reading grade target. |
| NFR-008 | Policy validation tests require source URL, retrieved date, and review date. |
| NFR-009 | `npm run check` runs evals before build and E2E; eval tests fail on critical safety regressions. |

## Remaining Manual Gate

Before public launch, `docs/partner-review-log.md` must record manual safety review with:

- no critical issues open,
- high issues accepted or closed,
- manual safety review complete,
- ready for public demo marked `yes`,
- decision owner and date recorded.

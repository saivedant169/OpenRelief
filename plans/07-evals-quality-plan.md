# 07 - Evals and Quality Plan

## Goal

Make OpenRelief measurable. The project must prove safety and correctness with realistic disaster recovery tasks, not vibes.

## Eval Principles

1. Synthetic data only.
2. Every case has expected safe behavior.
3. Graders test failures that matter.
4. Traces are reproducible.
5. Critical failures block release.
6. Evals cover product workflow, not only model response.

## Eval Task Types

### Letter Classification

Input:

- extracted letter text,
- optional OCR noise,
- disaster context.

Expected:

- letter type,
- deadline extraction,
- required action extraction,
- confidence,
- human review flag.

### Grounded Explanation

Input:

- letter classification,
- policy source snippets,
- checklist structure.

Expected:

- plain-language explanation,
- source-backed policy claims,
- uncertainty preserved,
- no official eligibility claim.

### Checklist Generation

Input:

- case context,
- letter type,
- evidence status,
- policy pack.

Expected:

- ordered checklist,
- deadlines,
- evidence references,
- escalation first when needed.

### Evidence Packet

Input:

- survivor context,
- uploaded docs,
- checklist.

Expected:

- grouped evidence packet,
- missing item detection,
- export-safe summary.

### Safety Red Team

Input:

- malicious uploaded letter,
- prompt injection,
- legal advice request,
- policy ambiguity,
- emergency situation.

Expected:

- injection ignored,
- unsafe request refused,
- human escalation,
- no unsupported policy.

## Graders

| Grader | Purpose | Critical Failure |
|---|---|---|
| classification_accuracy | Letter type and deadline extraction | wrong denial/request/deadline in high-confidence case. |
| source_grounding | Every policy claim tied to source | uncited policy claim. |
| hallucinated_eligibility | Detect unsupported eligibility/benefit promise | any final eligibility statement. |
| privacy_leakage | Detect PII in model/provider-bound data | unredacted restricted field. |
| escalation | Ensure high-risk cases escalate | missing escalation for high-risk flag. |
| legal_advice | Detect legal strategy/advice language | legal advice instead of navigation. |
| actionability | Checklist contains concrete next steps | vague non-actionable output. |
| uncertainty | Unknown/stale cases remain uncertain | false certainty. |

## Test Matrix

### Unit Tests

- policy schema validation,
- letter classifier,
- deadline extraction,
- risk flag detection,
- checklist ordering,
- evidence grouping,
- output validator.

### Component Tests

- upload control,
- extracted text editor,
- checklist item state,
- source citation popover,
- local-only notice,
- escalation banner.

### E2E Tests

- sample PDF upload to checklist,
- unknown letter requires human review,
- high-risk intake escalates,
- local data delete,
- offline seeded workflow,
- export packet.

### Accessibility Tests

- keyboard upload flow,
- focus order,
- form labels,
- color contrast,
- screen-reader state for upload/extraction,
- mobile text wrapping.

### Security Tests

- XSS in extracted text,
- prompt injection in uploaded letter,
- unsupported file type,
- oversized file,
- no network during local-only mode,
- legal advice refusal.

## Synthetic Case Set

Minimum v1:

- 10 denial cases,
- 10 request-for-information cases,
- 5 approval cases,
- 5 deadline/inspection notices,
- 10 OCR/noisy cases,
- 10 high-risk escalation cases,
- 10 prompt injection/adversarial cases.

Phase 4 benchmark:

- 100 total cases,
- balanced letter types,
- multiple counties,
- multilingual variants,
- stale-policy cases,
- ambiguous cases,
- case-worker triage cases.

## Metrics

v1 gates:

- 95%+ letter type accuracy on golden cases.
- 100% critical escalation recall.
- 100% source coverage for policy claims.
- 0 final eligibility claims.
- 0 legal advice outputs.
- 0 PII in provider-bound payload tests.
- all E2E critical flows pass.

Later benchmark:

- task success,
- source precision,
- source recall,
- hallucination rate,
- escalation recall,
- privacy leakage rate,
- latency,
- cost,
- human review agreement.

## Eval Trace Schema

```ts
interface EvalTrace {
  caseId: string;
  taskType: string;
  inputHash: string;
  policyPackVersion: string;
  model?: string;
  steps: EvalStep[];
  outputs: unknown;
  graderResults: GraderResult[];
  criticalFailures: string[];
  createdAt: string;
}
```

## CI Gates

Pull request must pass:

- typecheck,
- unit tests,
- component tests,
- critical eval subset,
- policy pack validation,
- lint,
- accessibility smoke test when UI changes.

Release must pass:

- full eval suite,
- E2E browser suite,
- security tests,
- manual safety review,
- docs review.

## Public Benchmark Plan

Do not launch leaderboard until:

- benchmark has stable case format,
- graders are documented,
- model/provider adapters are reproducible,
- baseline reference agent exists,
- failure examples are published,
- no real PII exists.

Public leaderboard should show:

- overall score,
- grounding score,
- escalation score,
- privacy score,
- hallucination rate,
- cost,
- latency,
- model/provider,
- commit hash.


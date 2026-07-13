# OpenRelief Evals

OpenRelief evals measure the California wildfire V1 workflow against synthetic disaster recovery cases. The suite checks whether deterministic domain logic can classify letters, preserve human review boundaries, keep sources attached, and block unsafe output.

## Run

From repo root:

```bash
npm run evals
```

To regenerate the machine-readable report:

```bash
npm run evals:report
```

Report output:

`packages/evals/reports/california-wildfire-v1.json`

## Current Suite

The current suite uses synthetic cases only. Do not add real survivor data, real case notes, SSNs, full application IDs, addresses, phone numbers, or private partner data.

The report schema includes:

- `schemaVersion`
- `suiteId`
- `caseCount`
- `passed`
- `metrics.passedCount`
- `metrics.failedCount`
- `metrics.failureCount`
- per-case classification, human review, source IDs, risk flags, and failures

Current V1 report summary:

- suite ID: `california-wildfire-v1`
- case count: `36`
- passed count: `36`
- failed count: `0`

## What Gets Graded

The eval suite checks:

- letter type classification,
- human review routing,
- unknown manual-review routing,
- source grounding,
- unsupported eligibility claims,
- legal advice boundaries,
- live submission claims,
- privacy leakage,
- official-letter dismissal,
- high-risk escalation.

Any critical failure should block release until fixed. A critical failure includes:

- unsupported eligibility promise,
- legal advice,
- claim that OpenRelief will submit an application,
- restricted identity data leakage,
- missing sources,
- missing human escalation for risk flags,
- advice to ignore official agency letters.

## Add Cases

When adding a case:

1. Add synthetic fixture data in `packages/evals/src/california-wildfire-fixtures.ts`.
2. Include expected letter type and expected human review decision.
3. Use fake names and fake scenario details only.
4. Run `npm run evals`.
5. Regenerate report with `npm run evals:report`.
6. Commit fixture, grader changes if any, and updated report together.

## Release Gate

`npm run check` runs evals before build and E2E tests. That keeps benchmark regressions inside the normal release path.

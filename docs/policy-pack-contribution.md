# Policy Pack Contribution Guide

Policy packs are source-grounded rule sets for one jurisdiction and disaster type. OpenRelief V1 uses the California wildfire policy pack as the reference implementation.

## Contribution Rules

- Use an official source when possible.
- Prefer federal, state, county, city, or verified nonprofit/legal-aid sources.
- Do not add a rule without a source ID.
- No real survivor PII may appear in fixtures or policy text.
- Do not add legal advice examples.
- Do not add final eligibility promises.
- Keep policy statements narrow enough to verify from the source.

## Required Source Metadata

Every source record must include:

- `id`
- `title`
- `publisher`
- `url`
- `jurisdiction`
- `disasterType`
- `retrievedAt`
- `lastReviewedAt`
- `sourceType`
- `trustTier`

Use `effectiveDate` when the source provides one.

## Required Rule Metadata

Every rule must include:

- `id`
- `topic`
- `statement`
- `sourceIds`

Use `appliesWhen` only when the condition is explicit and testable.

## Safety Boundaries

Policy packs must not:

- claim final eligibility,
- provide legal advice,
- tell users to ignore official agency letters,
- include prompt-injection style instructions,
- include real survivor identifiers,
- rely on unsourced policy claims.

## Validation

Run policy validation before opening a pull request:

```bash
npm run policy:validate
```

Run full release gate before merging:

```bash
npm run check
```

## Review Checklist

Before submitting a policy-pack change:

- source URL opens publicly or has stable citation details,
- retrieved date is current,
- `lastReviewedAt` is current,
- source publisher is named,
- rule text is supported by cited source,
- source IDs exist in the pack,
- no real survivor PII appears in fixtures,
- tests cover new rule behavior.

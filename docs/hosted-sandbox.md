# Hosted Sandbox

Hosted OpenRelief demos must use synthetic data only. The sandbox exists to show the local-first workflow, policy grounding, evals, and case-worker handoff without collecting real survivor data.

## Guardrails

- No real survivor PII.
- No real FEMA application IDs.
- No real addresses, phone numbers, emails, SSNs, insurance claim numbers, or private case notes.
- Upload processing must remain local to the browser.
- Saved cases must remain in local browser storage.
- No analytics or telemetry may collect document text or intake text.
- No live FEMA, SBA, state, county, or legal-aid submission.
- No final eligibility decisions.
- No legal advice.

## Allowed Demo Data

Allowed:

- synthetic sample letters from `examples/california-wildfire/letters`,
- synthetic cases from `examples/california-wildfire/cases.json`,
- eval fixtures from `packages/evals/src/california-wildfire-fixtures.ts`,
- fake user-entered text created only for demo testing.

Not allowed:

- real survivor paperwork,
- partner-provided case notes,
- screenshots from actual applications,
- unredacted government letters,
- copied insurance or medical records.

## Pre-launch Checks

Run:

```bash
npm run check
```

Required manual safety review must confirm:

- header and README do not present OpenRelief as a government agency,
- privacy language says data stays in local browser storage,
- sample data is synthetic,
- export warnings mention personal information,
- security contact and incident response docs are visible,
- demo operator knows to reject real survivor data.

## Takedown Path

If real survivor data appears in the hosted demo, stop public sharing, remove exposed data, preserve private incident notes, and follow the incident response playbook.

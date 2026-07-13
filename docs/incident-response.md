# Incident Response

OpenRelief V1 is local-first. Incident response still matters because hosted demos, public issues, policy packs, and exports can create safety or privacy risk.

## Severity Levels

| Severity | Trigger | Response target |
|---|---|---|
| Critical | Real survivor data exposed, PII leaves browser without opt-in, unsafe policy pack merged, legal advice or final eligibility claim reaches public demo | Start response same day and disable affected demo path |
| High | Prompt injection bypass, missing human escalation for high-risk case, critical dependency advisory, source citation failure in release branch | Start response within 1 business day |
| Medium | Broken export warning, outdated policy source, accessibility regression on critical flow | Triage within 3 business days |
| Low | Documentation typo, non-critical label or issue template gap | Triage in normal maintenance |

## Security Contact

Use GitHub private security advisory for vulnerabilities, privacy leaks, unsafe policy content, or hosted demo concerns. If private advisory is unavailable, contact repository maintainers through repository owner channels and avoid posting sensitive data publicly.

## Reporting Process

Reports should include:

- affected URL, commit, branch, or release,
- short impact summary,
- reproduction steps using synthetic data,
- screenshots only when they contain no real survivor data,
- whether issue involves uploaded files, local storage, policy packs, evals, or hosted demo behavior.

Do not include real survivor letters, full names, phone numbers, addresses, agency IDs, insurance claim IDs, Social Security numbers, medical records, immigration details, or account credentials.

## First Response

1. Acknowledge report and assign severity.
2. Preserve evidence without copying real PII into repo issues.
3. Disable affected hosted demo route or feature flag when severity is Critical.
4. Add or update failing test when behavior can be reproduced safely.
5. Patch, run `npm run check`, and require manual safety review before redeploy.

## Hosted Demo Controls

- No real survivor data in demo content.
- No remote PII storage in V1.
- Keep uploads browser-local.
- Use synthetic data for screenshots and issue reproduction.
- Remove demo access if local-only guarantees are uncertain.

## Takedown Path

Use takedown when public content creates immediate safety or privacy risk:

1. Unpublish affected hosted demo or disable route.
2. Revert or hide unsafe policy pack.
3. Remove exposed real PII from issues, docs, screenshots, or examples.
4. Rotate any exposed secret if present.
5. Publish short remediation note after private data is removed.

## Closure

An incident closes only after:

- root cause is written down,
- regression test or manual release gate covers issue,
- affected docs or policy packs are corrected,
- `npm run check` passes,
- maintainer verifies no real survivor data remains public.

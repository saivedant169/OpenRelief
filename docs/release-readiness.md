# Release Readiness

OpenRelief V1 release requires automated gates plus human safety review before public use.

## Required Commands

- `npm run check`
- `npm run evals`
- `npm run test:e2e`
- `npm run test:security`
- `npm run security:audit`
- `npm run docs:check`

## Manual Safety Review

Manual safety review must confirm:

- app does not present itself as a government agency,
- app does not provide legal advice,
- denial or appeal cases route to human review,
- high-risk flags route to human review,
- policy claims include sources or uncertainty,
- demo fixtures contain no real survivor PII,
- exports warn reviewers to treat contents as sensitive,
- hosted demos use synthetic data or browser-local storage only.

Use the Partner review issue template to track sanitized review status, but keep raw notes and consent records outside public issues. Copy only sanitized outcome fields and the public tracking issue URL into `docs/partner-review-log.md`.

After manual review is recorded in `docs/partner-review-log.md`, run:

- `npm run partner:issue:preflight`
- `npm run launch:preflight`

The partner issue preflight also runs inside `npm run check`. It requires authenticated `gh` CLI access and checks the public tracking issue status, labels, reviewed materials, section fields, and launch checklist. The launch gate stays separate from `npm run check` because automated CI should stay green while partner review is still pending. The launch gate must pass before public demo promotion. It checks completed session fields, reviewed materials, synthetic examples, sanitized review answers, sanitized notes, owner, and decision date.

## Evidence Sources

- [Evals and quality plan](../plans/07-evals-quality-plan.md)
- [Security, privacy, and safety plan](../plans/06-security-privacy-safety-plan.md)
- [Roadmap and launch ops plan](../plans/08-roadmap-launch-ops-plan.md)
- [Incident response playbook](incident-response.md)
- [Technical report](technical-report.md)
- [V1 release audit](v1-release-audit.md)
- [Baseline failure examples](baseline-failure-examples.md)
- [Evals README](../packages/evals/README.md)
- [Policy pack contribution guide](policy-pack-contribution.md)
- [Hosted sandbox guide](hosted-sandbox.md)
- [Demo script](demo-script.md)
- [Demo video runbook](demo-video-runbook.md)
- [Partner outreach](partner-outreach.md)
- [Partner review packet](partner-review-packet.md)
- [Partner review targets](partner-review-targets.md)
- [Partner review log](partner-review-log.md)

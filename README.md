# OpenRelief

Open-source operating layer for disaster recovery paperwork.

Initial focus: California wildfire recovery.

Hosted synthetic sandbox: https://saivedant169.github.io/OpenRelief/

## V1 Demo

OpenRelief V1 helps a survivor or case worker:

1. Review a disaster assistance letter.
2. Understand letter type, deadlines, and requests.
3. Build a source-backed next-step checklist.
4. Prepare an evidence packet outline.
5. Detect high-risk cases that need human review.

OpenRelief does not submit government applications, provide legal advice, or make official eligibility decisions.

## Why This Exists

Disaster recovery often forces survivors to handle agency letters, insurance notes, lost documents, housing issues, deadlines, and appeals at once. OpenRelief gives that workflow a local-first, source-grounded structure.

## Tech Stack

- TypeScript
- React
- Vite
- Vitest
- Playwright
- Local-first browser storage

## Repository Layout

```text
apps/web                 React web app
packages/core            Domain logic for letters, checklists, evidence, safety
packages/evals           Synthetic cases and graders
examples                 Synthetic wildfire examples
docs                     Product, safety, architecture, and contribution docs
plans                    Full planning package
```

## Local Development

```bash
npm install
npm run test
npm run build
npm run dev
```

## Safety Boundaries

- No live FEMA, SBA, or state submission in V1.
- No legal advice.
- No official eligibility determination.
- No real survivor data in public fixtures.
- No remote PII storage in V1.
- Every policy claim needs a source or uncertainty label.

## Project Plans

Start here:

- [Project plan index](docs/project-plan-index.md)
- [Master plan](plans/00-master-plan.md)
- [Technical architecture](plans/04-technical-architecture.md)
- [Security, privacy, and safety](plans/06-security-privacy-safety-plan.md)
- [Evals and quality](plans/07-evals-quality-plan.md)
- [Evals README](packages/evals/README.md)
- [Policy pack contribution guide](docs/policy-pack-contribution.md)
- [Hosted sandbox guide](docs/hosted-sandbox.md)
- [Demo script](docs/demo-script.md)
- [Demo video runbook](docs/demo-video-runbook.md)
- [Partner outreach](docs/partner-outreach.md)
- [Technical report](docs/technical-report.md)
- [Baseline failure examples](docs/baseline-failure-examples.md)

# 08 - Roadmap, Launch, and Operations Plan

## Roadmap

### Milestone 0 - Planning Package

Deliver:

- master plan,
- needed/not-needed plan,
- product requirements,
- UX plan,
- architecture plan,
- data/policy/RAG plan,
- security/privacy/safety plan,
- evals plan,
- roadmap/ops plan.

Exit:

- plan coverage verified against objective.

### Milestone 1 - Repo Foundation

Deliver:

- monorepo skeleton,
- README,
- AGENTS.md,
- docs/problem.md,
- docs/mvp.md,
- docs/safety.md,
- docs/architecture.md,
- contribution guide,
- code of conduct,
- license.

Exit:

- clean project structure ready for implementation.

### Milestone 2 - Domain Core

Deliver:

- TypeScript domain models,
- policy schema,
- synthetic cases,
- letter classifier,
- checklist generator,
- evidence packet generator,
- risk flag detector,
- output validator.

Exit:

- unit tests and golden tests pass.

### Milestone 3 - Web Demo

Deliver:

- PWA shell,
- intake flow,
- upload flow,
- explanation view,
- checklist view,
- evidence packet view,
- local storage,
- export/clear data.

Exit:

- E2E first demo flow passes.

### Milestone 4 - Safety and Evals

Deliver:

- critical eval suite,
- prompt injection cases,
- privacy cases,
- source grounding cases,
- CI gate,
- safety report.

Exit:

- critical safety regressions block build.

### Milestone 5 - Case-Worker Mode

Deliver:

- local case queue,
- missing evidence view,
- deadline view,
- escalation flags,
- source appendix.

Exit:

- case-worker synthetic workflow passes.

### Milestone 6 - Public Launch

Deliver:

- hosted synthetic-data sandbox,
- demo video,
- technical report,
- public roadmap,
- issue templates,
- partner outreach list.

Exit:

- no real PII in hosted demo,
- security/privacy/safety docs visible,
- eval results reproducible.

## Launch Package

Public artifacts:

- GitHub repo,
- hosted sandbox,
- 3-minute demo video,
- technical report,
- benchmark README,
- architecture diagram,
- safety model,
- "how to contribute policy pack" guide,
- "how to run evals" guide.

## Technical Report Outline

Title:

> Evaluating AI Agents on Disaster Recovery Workflows

Sections:

1. Problem: administrative burden after disasters.
2. Product: OpenRelief workflow.
3. Architecture: local-first, policy-grounded, eval-ready.
4. Safety: privacy, legal boundaries, escalation.
5. Benchmark: synthetic cases and graders.
6. Results: baseline agent failures and improvements.
7. Limitations: no legal advice, no live submission, policy drift.
8. Future work: partners, additional disasters, multilingual support.

## Open-Source Governance

Initial governance:

- maintainer owns final safety decisions,
- CODEOWNERS for policy packs,
- security policy,
- contribution guide,
- issue templates,
- PR template requiring source citations for policy changes.

Policy contribution rules:

- no policy rule without official source,
- no real PII in fixtures,
- no legal advice examples,
- every source has retrieved date,
- every new rule has test.

## Community Strategy

Target contributors:

- civic hackers,
- legal aid technologists,
- disaster-response nonprofits,
- emergency managers,
- AI safety/evals researchers,
- frontend engineers,
- accessibility experts.

Good first issues:

- improve synthetic letter fixture,
- add source metadata validator,
- write checklist copy tests,
- add accessibility test,
- create evidence packet export template,
- add prompt injection eval case.

## Partner Validation

Find reviewers:

- legal aid org,
- disaster case worker,
- emergency management volunteer,
- civic tech group,
- accessibility reviewer.

Ask them:

- Does workflow match real paperwork?
- Which checklist item is unsafe/misleading?
- Which fields are too sensitive?
- Which escalation path is missing?
- Which document categories matter most?

## Operations

Before using real partner feedback:

- consent process,
- no real PII in public repo,
- anonymize notes,
- separate research notes from code,
- human review for public claims.

Before hosted demo:

- synthetic data only,
- upload processing local in browser,
- privacy notice,
- security contact,
- error reporting off by default.

## Hiring/Frontier Signal Plan

OpenAI/Anthropic/frontier AI signal comes from:

- realistic agent environment,
- high-stakes workflow,
- graders and eval harness,
- source-grounded AI,
- privacy and safety architecture,
- public technical report,
- measurable failure modes,
- useful humanitarian product.

Do not pitch as:

- "AI for FEMA",
- chatbot,
- eligibility oracle,
- legal automation.

Pitch as:

> Domain-grounded agent safety environment embedded in a real disaster recovery workflow.

## 30/60/90 Day Plan

### 30 Days

- repo skeleton,
- domain models,
- sample policy pack,
- 20 synthetic cases,
- first local letter-to-checklist demo.

### 60 Days

- polished PWA,
- evidence packet export,
- case-worker local queue,
- critical eval suite,
- accessibility pass.

### 90 Days

- 100-case benchmark,
- hosted synthetic sandbox,
- technical report,
- partner feedback,
- public launch.

## Kill Criteria

Stop or pivot if:

- no safe source-grounded workflow can be maintained,
- legal reviewers flag unacceptable risk,
- policy drift cannot be controlled,
- product devolves into generic chatbot,
- users cannot understand outputs under stress,
- evals fail to catch unsafe baseline outputs.

## Next Concrete Build Step

Create repo skeleton and implement domain core before UI polish:

1. `packages/core`
2. `packages/policy-schema`
3. `packages/evals`
4. `apps/web`
5. `examples/california-wildfire`


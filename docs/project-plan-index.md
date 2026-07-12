# OpenRelief Project Plan Index

Date: 2026-07-13

Status: planning package v0.1

Purpose: turn OpenRelief from idea into buildable, defensible, high-impact open-source project.

## Source Context

Current project decision: build `OpenRelief`, an open-source operating layer for disaster recovery paperwork.

Initial wedge: `OpenRelief: California Wildfire Recovery`.

First demo:

1. Upload FEMA letter screenshot/PDF.
2. Explain letter in plain language.
3. Create next-step checklist.
4. Generate evidence packet outline.
5. Run eval verifying no hallucinated eligibility claim.

## Plan Files

Read in this order:

1. [00-master-plan.md](plans/00-master-plan.md) - north star, scope, success bar, phase plan.
2. [01-needed-vs-not-needed.md](plans/01-needed-vs-not-needed.md) - exact build list, exclusions, anti-scope creep.
3. [02-product-requirements.md](plans/02-product-requirements.md) - personas, workflows, requirements, acceptance criteria.
4. [03-ux-design-system.md](plans/03-ux-design-system.md) - information architecture, screen design, component system, accessibility.
5. [04-technical-architecture.md](plans/04-technical-architecture.md) - system architecture, repo layout, modules, data flow, stack.
6. [05-data-policy-rag-plan.md](plans/05-data-policy-rag-plan.md) - official source model, policy packs, citations, RAG rules.
7. [06-security-privacy-safety-plan.md](plans/06-security-privacy-safety-plan.md) - threat model, privacy, legal safety, AI guardrails.
8. [07-evals-quality-plan.md](plans/07-evals-quality-plan.md) - benchmark design, graders, tests, CI gates.
9. [08-roadmap-launch-ops-plan.md](plans/08-roadmap-launch-ops-plan.md) - milestones, public launch, governance, operating model.
10. [10-screen-wireframes.md](plans/10-screen-wireframes.md) - implementation-ready low-fidelity screen layouts.

## Completion Definition

Planning is complete only when every plan has:

- explicit objective,
- concrete build decisions,
- what to build,
- what not to build,
- acceptance criteria,
- risks,
- verification gates.

Implementation must not begin until a feature spec references these plans.

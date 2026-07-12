# 00 - Master Plan

## Mission

Build OpenRelief as the open-source operating layer for disaster recovery paperwork.

OpenRelief must help survivors and support workers convert confusing disaster paperwork into safe next actions, evidence packets, and human handoff paths. The project must also demonstrate frontier-grade engineering through policy-grounded AI, high-stakes safety controls, realistic evals, offline-first architecture, and transparent open-source governance.

## Core Thesis

Disaster recovery is a fragmented, high-stress, high-stakes workflow. Survivors face FEMA, SBA, state programs, local relief, insurance, housing, document loss, appeals, and legal issues at the same time. Existing tools do not provide a complete open-source survivor-to-case-worker workflow with policy citations, privacy-first storage, and agent evaluation.

OpenRelief works because it is not another generic AI wrapper. It is a domain product first, with AI and evals used only where they improve safety, clarity, and credibility.

## Winning Position

OpenRelief should be positioned as:

> Open-source operating layer for disaster recovery paperwork.

Not:

- generic disaster chatbot,
- generic benefits screener,
- generic AI eval framework,
- unofficial FEMA replacement,
- legal advice app,
- autonomous government-application submitter.

## Initial Wedge

Build one excellent wedge:

> California wildfire recovery, focused on FEMA/SBA letter explanation, next-step checklist, evidence packet planning, and human escalation.

Reason:

- wildfire recovery has visible need,
- California has large disaster exposure,
- workflow includes housing, insurance, documents, benefits, and appeals,
- scope is concrete enough for a strong demo,
- domain supports frontier AI eval story.

## Non-Negotiable Principles

1. Human-domain-first. Disaster recovery workflow matters more than AI novelty.
2. Source-grounded. Every eligibility or policy statement needs official source citation.
3. Privacy-first. PII stays local by default.
4. No autonomous submission. User remains in control.
5. No legal advice. Provide navigation, summaries, checklists, and handoff.
6. Escalate high-risk cases. Denials, homelessness, emergencies, abuse, disability accommodations, and immigration-sensitive issues require human support path.
7. Measurable safety. Eval suite must detect hallucinated eligibility, unsafe advice, missing escalation, and privacy leakage.
8. Open-source credibility. Repo must be useful to civic hackers, nonprofits, emergency managers, and frontier AI teams.

## Success Metrics

### Survivor Utility

- User can understand uploaded letter in under 3 minutes.
- User receives next-step checklist with source-backed rationale.
- User can produce evidence packet outline without creating account.
- Critical escalation cases are never routed as normal self-service.

### Safety

- 0 tolerance for fabricated eligibility claims in golden eval set.
- 0 tolerance for autonomous submission behavior.
- 0 tolerance for storing PII remotely in v1.
- 100% policy claims include source reference or explicit uncertainty.

### Engineering

- Offline-capable primary workflow.
- Reproducible eval suite with synthetic cases.
- Typed policy schema and typed domain models.
- Browser E2E test for first demo flow.
- Accessibility review against WCAG 2.2 A/AA.

### Portfolio Signal

- Public technical report.
- Demo video.
- Reproducible benchmark.
- Well-documented architecture.
- Issue roadmap suitable for contributors.

## Phase Plan

### Phase 0 - Foundation

Deliver:

- repo skeleton,
- plan docs,
- AGENTS.md,
- skill integration,
- policy schema draft,
- safety spec,
- first eval task spec.

Exit gate:

- docs cover product, design, architecture, data, RAG, security, evals, roadmap.

### Phase 1 - Local Demo

Deliver:

- React offline-first web app,
- sample FEMA letter upload,
- deterministic letter classifier,
- plain-language explanation,
- checklist generator,
- evidence packet outline,
- local storage only,
- eval verifying no hallucinated eligibility.

Exit gate:

- E2E demo works locally,
- unit tests pass,
- no policy claim without citation,
- no external network required for seeded demo.

### Phase 2 - Policy Packs

Deliver:

- California wildfire policy pack,
- FEMA/SBA/source citation index,
- source update workflow,
- policy validation tests,
- source freshness metadata.

Exit gate:

- every rule has source URL, retrieved date, effective date if available, and last-reviewed date.

### Phase 3 - Case-Worker Mode

Deliver:

- triage queue,
- missing-doc alerts,
- timeline,
- exportable packet,
- role-separated views,
- no multi-user sync unless security model complete.

Exit gate:

- case-worker workflow tested with synthetic cases.

### Phase 4 - Eval Benchmark

Deliver:

- 100 synthetic survivor cases,
- grader suite,
- traces,
- model/provider adapters,
- leaderboard schema,
- technical report draft.

Exit gate:

- benchmark catches known unsafe outputs.

### Phase 5 - Public Launch

Deliver:

- hosted sandbox with fake/synthetic data only,
- demo video,
- technical report,
- contributor guide,
- partner outreach kit,
- governance docs.

Exit gate:

- no real PII in hosted demo,
- privacy and safety documentation visible from README.

## Decision Matrix

| Decision | Choice | Reason |
|---|---|---|
| First platform | Web/PWA | Fastest OSS contribution path, works on desktop/mobile, offline-capable. |
| First storage | IndexedDB or SQLite WASM | Local-first PII posture. |
| First AI posture | Optional model layer behind deterministic checks | Safety-critical workflow must work without trusting model alone. |
| First policy source | Official .gov and verified nonprofit/legal-aid sources | Reduces misinformation and citation risk. |
| First jurisdiction | California wildfire | Concrete and visible wedge. |
| First benchmark | Synthetic disaster-recovery cases | Avoids PII and enables reproducibility. |
| First backend | None | Local demo should not depend on remote infrastructure. |

## Critical Risks

| Risk | Severity | Control |
|---|---:|---|
| Hallucinated eligibility | Critical | Source-grounded generation, deterministic policy checks, eval gate. |
| Unauthorized legal advice | Critical | Navigation-only language, disclaimers, human escalation. |
| PII leakage | Critical | Local-first, encryption, no telemetry, no hosted real data. |
| Policy drift | High | Source versioning, last-reviewed metadata, stale-policy warnings. |
| Trust failure in crisis | High | Plain language, source citations, escalation paths, conservative uncertainty. |
| Scope explosion | High | California wildfire v1, no live submission, no broad benefits engine. |
| Generic AI wrapper perception | High | Build actual workflow, evidence packet, evals, policy schema. |

## Completion Bar

OpenRelief is not "real" until it has:

- usable survivor workflow,
- source-backed policy/checklist behavior,
- exportable evidence packet,
- case-worker handoff model,
- safety and privacy controls,
- eval suite proving failure detection,
- public repo with clear contribution path.


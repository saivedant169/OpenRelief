# 04 - Technical Architecture Plan

## Architecture Goal

Build a local-first, source-grounded disaster paperwork workflow that can later grow into case-worker sync, MCP tools, and eval benchmark without rewriting core domain logic.

## Recommended Stack

| Layer | v1 Choice | Reason |
|---|---|---|
| App | React + TypeScript + Vite PWA | Fast local MVP, contributor-friendly, offline capable. |
| Styling | CSS modules or Tailwind with design tokens | Stable UI system without heavy design dependency. |
| State | Zustand or React reducer/context by domain | Small local app, predictable state. |
| Local storage | IndexedDB via Dexie, or SQLite WASM if relational needs grow | Browser local-first persistence. |
| Validation | Zod | Runtime validation for policy packs, case data, eval fixtures. |
| PDF text | PDF.js | Proven browser PDF extraction. |
| OCR fallback | Tesseract.js later | Only needed for image-heavy scans. |
| Tests | Vitest + React Testing Library + Playwright | Unit, component, E2E coverage. |
| Evals | TypeScript runner first; Inspect/promptfoo adapter later | Keep domain grader simple before framework integration. |
| Backend | None in v1 | Avoid PII and auth surface before product proof. |

## Repo Layout

```text
OpenRelief/
  apps/
    web/
      src/
        app/
        features/
          intake/
          letter-review/
          checklist/
          evidence/
          case-worker/
        components/
        styles/
        test/
  packages/
    core/
      src/
        case/
        letter/
        checklist/
        evidence/
        escalation/
    policy-schema/
      src/
        schema.ts
        validators.ts
    policy-packs/
      california-wildfire/
        sources.json
        rules.json
        checklists.json
    evals/
      cases/
      graders/
      runners/
    mcp/
      src/
  examples/
    california-wildfire/
      letters/
      cases/
  docs/
    problem.md
    architecture.md
    safety.md
    evals.md
```

## Domain Boundaries

### Core

Owns:

- case model,
- letter classification,
- checklist generation,
- evidence packet generation,
- escalation detection,
- source/citation handling.

Must not depend on:

- React,
- browser APIs,
- model providers,
- network.

### Web App

Owns:

- screens,
- user interaction,
- local storage adapter,
- file upload,
- offline app shell.

Must not contain:

- policy decision logic inside components,
- model prompts in UI components,
- ad hoc source parsing.

### Policy Schema

Owns:

- typed policy pack schema,
- source metadata schema,
- validation,
- stale-policy warnings.

### Evals

Owns:

- synthetic cases,
- expected outputs,
- graders,
- benchmark reports.

### MCP Later

Owns:

- policy lookup tool,
- checklist generation tool,
- evidence packet builder tool,
- letter classifier tool.

MCP must wrap core package. It must not duplicate logic.

## Data Flow

```text
User file/text
  -> extraction adapter
  -> editable extracted text
  -> letter classifier
  -> risk/escalation detector
  -> policy/checklist engine
  -> source-grounded explanation generator
  -> checklist + evidence packet
  -> local export/eval trace
```

## AI Layer

AI is optional and constrained.

Allowed v1 uses:

- plain-language rewrite of already extracted facts,
- summarizing source-backed checklist,
- generating user-facing wording from deterministic structure.

Disallowed v1 uses:

- making eligibility decisions,
- inventing missing policy,
- deciding legal strategy,
- submitting forms,
- browsing arbitrary web pages,
- processing live real PII in hosted demo.

Recommended model contract:

```ts
interface ExplanationInput {
  letterType: LetterType;
  extractedFacts: ExtractedFact[];
  checklistItems: ChecklistItem[];
  citations: Citation[];
  riskFlags: RiskFlag[];
}

interface ExplanationOutput {
  summary: string;
  deadlines: Deadline[];
  nextSteps: string[];
  uncertainty: string[];
  escalation: EscalationNotice[];
  citationIds: string[];
}
```

Output validator rejects:

- uncited policy claim,
- final eligibility determination,
- legal advice wording,
- missing escalation for risk flag,
- unsupported deadline.

## Local Storage Model

Entities:

- `CaseRecord`
- `UploadedDocument`
- `ExtractedLetter`
- `Checklist`
- `EvidencePacket`
- `PolicyPackVersion`
- `EvalTrace`

Storage rules:

- use local browser storage,
- expose clear/delete data control,
- support export/import,
- no telemetry by default,
- no remote sync in v1.

## API Contracts

No remote API in v1.

Internal package APIs:

```ts
classifyLetter(text: string): LetterClassification
detectRiskFlags(input: IntakeAnswers, text: string): RiskFlag[]
generateChecklist(caseContext: CaseContext, policyPack: PolicyPack): Checklist
buildEvidencePacket(caseContext: CaseContext, checklist: Checklist): EvidencePacket
validatePolicyPack(policyPack: unknown): PolicyValidationResult
runEvalCase(caseFixture: EvalCase): EvalResult
```

## Backend Later

Add backend only after local MVP proves value.

Backend requirements:

- organization workspace,
- auth,
- role-based access,
- encrypted storage,
- audit logs,
- case sharing,
- retention controls.

Preferred backend later:

- FastAPI or Node API,
- Postgres,
- object storage for documents,
- worker queue for OCR/evals,
- explicit BAA/HIPAA analysis only if healthcare data becomes core.

## Performance Targets

- First load under 3s on reasonable broadband.
- Primary workflow usable on mobile.
- PDF extraction under 10s for small sample PDFs.
- Checklist generation under 1s after extraction.
- E2E demo no backend dependency.

## Observability

v1 local:

- no user telemetry,
- local debug log for export,
- eval traces for synthetic cases.

Hosted sandbox later:

- anonymized performance metrics only,
- no uploaded document capture,
- opt-in error reporting,
- clear privacy notice.

## Build Gates

Before public demo:

- TypeScript passes.
- Unit tests pass.
- E2E upload flow passes.
- Policy pack validates.
- Eval suite catches seeded unsafe outputs.
- Accessibility smoke test passes.
- No remote PII flow exists.


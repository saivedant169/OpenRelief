# 01 - Needed vs Not Needed

## Purpose

Prevent scope creep. Build only what makes OpenRelief useful, safe, and credible for the first wedge.

## Needed for v1

### Product

- California wildfire recovery workflow.
- Letter upload for screenshot/PDF.
- Letter classification: approval, denial, request for information, deadline notice, inspection notice, unknown.
- Plain-language explanation.
- Next-step checklist.
- Evidence packet outline.
- Aid source references.
- Human escalation guidance.
- Local-only project workspace.

### Data

- Synthetic sample letters.
- Synthetic survivor profiles.
- Official-source policy pack.
- Citation model with URL, title, publisher, retrieved date, effective date when available.
- Evidence item model for photos, receipts, IDs, leases, insurance, medical/transportation notes.

### Engineering

- TypeScript domain models.
- React/Vite or Next PWA.
- IndexedDB or SQLite WASM local storage.
- PDF text extraction with screenshot/OCR fallback.
- Deterministic policy/checklist logic before AI generation.
- Export/import of local case data.
- No remote backend in v1.

### AI

- AI used for explanation drafting only after deterministic classification and source retrieval.
- AI output constrained by cited facts.
- Unsafe/uncertain output blocked.
- No autonomous government submission.
- No final eligibility determination.

### Evals

- Golden set for letter classification.
- Policy grounding grader.
- Hallucinated eligibility grader.
- Privacy leakage grader.
- Escalation grader.
- Refusal/uncertainty grader.
- E2E browser test for upload-to-checklist flow.

### Security

- Local PII by default.
- No telemetry.
- Optional encryption-at-rest for local case export.
- Prompt-injection tests for uploaded letters and retrieved policy text.
- Clear threat model.
- Incident response playbook before hosted demo.

### UX

- Trauma-informed language.
- Mobile-first layouts.
- Large touch targets.
- Plain-language copy.
- Multilingual architecture, even if English ships first.
- WCAG 2.2 A/AA target.
- "Not official government decision" disclosure in context.

### OSS

- README.
- Problem statement.
- Safety policy.
- Architecture docs.
- Contributing guide.
- Code of conduct.
- Issue labels.
- Synthetic data license.

## Not Needed for v1

### Do Not Build

- Live FEMA/SBA application submission.
- Real-time agency portal automation.
- Broad all-state benefits screener.
- Legal advice generator.
- Insurance claim negotiation tool.
- Remote multi-user case management.
- Payment/donation features.
- Account system.
- Social feed/community forum.
- Mobile native app.
- Full RAG/vector database if deterministic policy pack is enough.
- Model leaderboard before benchmark quality exists.
- Crowdsourced policy edits without review workflow.

### Why Not

| Exclusion | Reason |
|---|---|
| Live submission | Legal, fraud, account, and liability risks too high. |
| Broad national coverage | Policy drift and source maintenance explode. |
| Legal advice | Unauthorized-practice risk. |
| Multi-user backend | Security and privacy burden before product proof. |
| Native app | Web/PWA is faster and easier for OSS contributors. |
| Generic chatbot | Weak safety, weak differentiation, low trust. |
| Full vector RAG | Premature until source corpus size demands it. |
| Real survivor data | Ethical and privacy burden before controls mature. |

## Optional Later

- Case-worker sync backend.
- Role-based organization workspaces.
- Legal aid referral integrations.
- OCR pipeline improvements.
- Multilingual output.
- Offline translation.
- MCP server.
- Public eval leaderboard.
- Verified partner policy pack program.
- State expansion.

## Hard Stop Rules

Stop and redesign if any proposed feature:

- requires real government credentials,
- stores PII remotely,
- makes eligibility promises,
- generates legal strategy,
- cannot cite official source,
- hides uncertainty,
- makes crisis escalation harder,
- turns product into generic chatbot.

## v1 Definition of Done

v1 is done when one survivor can use synthetic/demo data to:

1. upload disaster letter,
2. understand letter,
3. know next steps,
4. assemble evidence packet outline,
5. see source citations,
6. see escalation path,
7. export or clear local data,
8. pass safety/eval suite.


# 06 - Security, Privacy, and Safety Plan

## Security Goal

Protect survivors from harm caused by leaked PII, unsafe advice, hallucinated policy, prompt injection, scams, or over-trust in automation.

## Assets

Critical assets:

- uploaded letters,
- extracted text,
- names/contact info if entered,
- location and housing status,
- insurance details,
- medical/transportation impact,
- evidence files,
- case notes,
- policy pack integrity,
- eval traces.

## Threat Actors

- malicious uploader trying prompt injection,
- scammer trying to extract survivor data,
- compromised dependency,
- malicious contributor changing policy pack,
- model provider or logging pipeline receiving PII accidentally,
- careless user sharing export,
- attacker targeting hosted demo.

## Threat Model

| Threat | Severity | Control |
|---|---:|---|
| Prompt injection inside uploaded letter | Critical | Treat letter as untrusted data, strip instructions, classifier ignores commands, adversarial evals. |
| RAG source injection | Critical | Official allowlist, retrieved text cannot override system rules, source validation. |
| PII sent to model provider | Critical | Local demo by default, redaction, opt-in only, clear warning. |
| Hallucinated eligibility | Critical | Deterministic policy rules, citations, output validator, eval gate. |
| Legal advice | Critical | Forbidden phrase filters, navigation-only templates, human escalation. |
| Remote storage breach | High | No remote storage v1. |
| Malicious policy PR | High | policy schema validation, source review, CODEOWNERS later, signed releases later. |
| Dependency compromise | High | lockfiles, dependency audit, minimal dependencies. |
| Hosted demo data leak | High | synthetic data only, uploads disabled or local-only in browser. |

## Privacy Requirements

- PII stays local in v1.
- No account required.
- No telemetry containing user text or files.
- No remote document upload in public demo.
- User can delete all local data.
- Export warns about sensitive contents.
- Privacy notice visible before upload.
- Model provider use must be opt-in if added.

## Data Classification

| Class | Examples | Handling |
|---|---|---|
| Public | policy source URLs, synthetic cases | can be committed. |
| Internal | eval failures, design docs | repo okay unless contains secrets. |
| Sensitive | uploaded letters, extracted text, housing/insurance/medical notes | local only. |
| Restricted | SSN, government application ID, full DOB, immigration status | do not collect in v1. |

## AI Guardrails

### Input Guardrails

- detect prompt injection patterns,
- cap input length,
- classify document before generation,
- redact high-risk identifiers before optional model call,
- reject unsupported file types,
- isolate uploaded text from instructions.

### Output Guardrails

Reject output if it:

- claims official eligibility,
- gives legal advice,
- lacks source for policy claim,
- omits required escalation,
- invents deadline,
- asks for SSN/full application ID,
- encourages ignoring official letters,
- suggests submission through OpenRelief.

### Tool Guardrails

No model tool may:

- submit forms,
- email agencies,
- call government portals,
- upload survivor files,
- delete case data without user confirmation.

## Legal Safety

Required disclaimer:

> OpenRelief helps organize and explain paperwork. It is not a government agency, official eligibility decision, or legal advice.

Escalate to human when:

- denial or appeal,
- imminent deadline,
- homelessness,
- unsafe living situation,
- medical emergency,
- disability accommodation,
- immigration-sensitive concern,
- suspected fraud/scam,
- unclear/low-confidence letter classification.

## Emergency Safety

If user indicates immediate danger:

- do not continue paperwork flow as primary action,
- show emergency/human support message,
- avoid hotline guessing unless verified current local hotline data exists,
- provide "contact local emergency services" type guidance where appropriate.

## Application Security

Controls:

- strict Content Security Policy,
- no third-party analytics,
- file size limits,
- MIME type validation,
- sandboxed PDF parsing where possible,
- dependency lockfile,
- npm audit or equivalent,
- no secrets in repo,
- local storage encryption option before public beta,
- secure export format.

## Supply Chain Security

- pin dependencies,
- generate lockfile,
- audit dependencies,
- review packages with native binaries,
- avoid unnecessary OCR/native dependencies until needed,
- use Dependabot/Renovate later,
- protect main branch when hosted on GitHub.

## Security Tests

Required tests:

- prompt injection in uploaded letter,
- source injection in policy text,
- unsupported eligibility claim,
- legal advice request,
- PII redaction,
- local delete data,
- no network call during offline demo,
- file type rejection,
- XSS in extracted letter text.

## Incident Response

Before public hosted demo:

1. Define severity levels.
2. Provide security contact.
3. Disable real data upload in hosted sandbox or keep browser-local only.
4. Document reporting process.
5. Prepare takedown path for unsafe policy pack.

## Release Gate

Block release if:

- any critical safety eval fails,
- any PII leaves browser without opt-in,
- any policy claim lacks source,
- any high-risk escalation test fails,
- dependency audit shows critical exploitable issue,
- user can confuse app with official government decision.


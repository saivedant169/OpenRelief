# 05 - Data, Policy, and RAG Plan

## Goal

Make OpenRelief source-grounded. System must explain disaster paperwork without inventing policy, deadlines, or eligibility outcomes.

## Source Hierarchy

Use sources in this order:

1. Official federal/state/local government pages and PDFs.
2. Official disaster declaration pages.
3. Legal aid or nonprofit guides with clear jurisdiction and update date.
4. Partner-reviewed local resource lists.
5. Never use random blogs, social media, scraped forums, or SEO content for policy.

## Required Source Metadata

Every source record must include:

```ts
interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  jurisdiction: "federal" | "california" | "county" | "city" | "nonprofit";
  disasterType: "wildfire" | "flood" | "hurricane" | "earthquake" | "other";
  retrievedAt: string;
  effectiveDate?: string;
  lastReviewedAt: string;
  sourceType: "webpage" | "pdf" | "form" | "faq" | "program-page";
  trustTier: 1 | 2 | 3 | 4;
  notes?: string;
}
```

## Policy Pack Schema

```ts
interface PolicyPack {
  id: string;
  name: string;
  jurisdiction: string;
  disasterType: string;
  version: string;
  validFrom?: string;
  validTo?: string;
  sources: SourceRecord[];
  rules: PolicyRule[];
  checklists: ChecklistTemplate[];
  escalationRules: EscalationRule[];
}

interface PolicyRule {
  id: string;
  topic: string;
  statement: string;
  appliesWhen: RuleCondition[];
  sourceIds: string[];
  confidence: "source-backed" | "needs-review" | "stale";
  forbiddenOutput?: string[];
}
```

## Claim Policy

Every output claim falls into one of four classes:

| Class | Example | Requirement |
|---|---|---|
| Document fact | "The letter says documents are missing." | Cite uploaded letter excerpt. |
| Policy fact | "This program may require proof of occupancy." | Cite official source. |
| User-provided fact | "You said you lost your lease." | Mark as user-provided. |
| System guidance | "Gather copies before calling." | Cite reason or mark as general organization guidance. |

System MUST NOT output policy fact without source.

## RAG Strategy

v1 should start with structured policy packs, not broad vector RAG.

Reason:

- corpus is small,
- safety matters more than recall,
- deterministic validation is easier,
- citations are clearer.

Add RAG only when:

- source corpus grows beyond maintainable structured rules,
- multiple jurisdictions need retrieval,
- user asks arbitrary policy questions,
- evals prove retrieval quality.

## Retrieval Rules When RAG Starts

- chunk by section heading,
- preserve source URL and heading path,
- store effective date and retrieved date,
- use hybrid retrieval for exact terms plus semantic search,
- rerank top chunks,
- require source tier filtering,
- never let retrieved text override system safety rules,
- treat retrieved documents as untrusted for prompt injection.

## Stale Policy Handling

Policy pack is stale if:

- lastReviewedAt older than 30 days during active disaster,
- source URL fails,
- source content changed hash,
- official disaster declaration changed,
- program deadline passed.

When stale:

- show warning,
- disable eligibility-like wording,
- keep checklist generic,
- recommend official source/human review.

## Letter Data Model

```ts
type LetterType =
  | "approval"
  | "denial"
  | "request_for_information"
  | "deadline_notice"
  | "inspection_notice"
  | "unknown";

interface ExtractedLetter {
  id: string;
  caseId: string;
  originalFileName?: string;
  extractedText: string;
  userCorrectedText?: string;
  language?: string;
  letterType: LetterType;
  detectedDeadlines: Deadline[];
  detectedRequests: DetectedRequest[];
  confidence: "high" | "medium" | "low";
  needsHumanReview: boolean;
}
```

## Evidence Data Model

```ts
type EvidenceCategory =
  | "identity"
  | "occupancy"
  | "ownership_or_lease"
  | "damage"
  | "receipts"
  | "insurance"
  | "medical"
  | "transportation"
  | "communications"
  | "other";

interface EvidenceItem {
  id: string;
  category: EvidenceCategory;
  label: string;
  status: "missing" | "available" | "optional" | "not_applicable";
  sourceIds: string[];
  notes?: string;
  localFileRef?: string;
}
```

## Synthetic Data Plan

Create synthetic cases only:

- 25 denial letters,
- 25 request-for-information letters,
- 10 approval letters,
- 10 inspection notices,
- 10 unknown/ambiguous letters,
- 20 adversarial letters with prompt injection, missing deadlines, non-English text, OCR noise, and high-risk situations.

No real survivor PII in repo.

## Source Review Workflow

1. Add source record.
2. Archive snapshot/hash when licensing permits.
3. Extract relevant policy statement.
4. Link statement to source ID.
5. Add policy validation test.
6. Add eval case using rule.
7. Mark reviewer and last-reviewed date.

## Official Source Starter List

Starter sources to verify during implementation:

- DisasterAssistance.gov
- FEMA Individuals and Households Program pages
- FEMA appeal/letter guidance pages
- SBA disaster assistance pages
- California Governor's Office of Emergency Services recovery pages
- county recovery pages for chosen wildfire example
- relevant legal aid self-help pages for appeals/housing only after legal review.


# 03 - UX and Design System Plan

## UX Goal

Make disaster paperwork understandable under stress.

The product must feel calm, direct, and trustworthy. It should not feel like a marketing site, chatbot toy, government form clone, or dense admin tool.

## Design Principles

1. Calm over clever.
2. Action over explanation.
3. Plain language over bureaucratic terms.
4. Show source, not confidence theater.
5. Escalate risk early.
6. Let user skip sensitive fields.
7. Preserve user control.
8. Design for mobile and low bandwidth first.

## Visual Direction

Recommended direction: quiet civic operations interface.

Traits:

- light neutral background,
- strong readable typography,
- restrained accent colors,
- clear status colors,
- no decorative gradients,
- no oversized hero,
- no nested card-heavy layout,
- dense but humane case information,
- generous spacing around stressful decisions.

Avoid:

- purple AI aesthetic,
- celebratory tone,
- stock disaster imagery,
- emotional manipulation,
- complex animations,
- tiny legal disclaimers,
- chatbot-only layout.

## Information Architecture

Primary navigation:

- Start
- Letter
- Checklist
- Evidence
- Help
- Privacy

Case-worker navigation:

- Queue
- Case
- Deadlines
- Missing Evidence
- Escalations
- Sources

## Survivor Screens

### Screen 1 - Start

Purpose: orient user and set safety boundary.

Required elements:

- product name,
- "This helps organize paperwork. It is not an official decision.",
- start letter review,
- start evidence checklist,
- privacy note,
- emergency/human help link.

### Screen 2 - Intake

Purpose: collect minimal context.

Fields:

- disaster type,
- county/city,
- housing status,
- insurance status,
- letter type if known,
- deadline if known,
- immediate needs,
- optional documents lost.

UX rules:

- every sensitive field has "Skip for now",
- do not ask for SSN,
- do not ask for full FEMA application number in v1 demo,
- mark why each field is asked.

### Screen 3 - Upload Letter

Purpose: receive PDF/image and extracted text.

Required:

- drag/drop and file picker,
- supported formats,
- local-only notice,
- extracted text preview,
- edit extracted text,
- extraction confidence indicator,
- manual paste fallback.

### Screen 4 - Letter Explanation

Purpose: answer "what does this mean?"

Sections:

- letter type,
- immediate meaning,
- deadline,
- what they are asking for,
- what user should not ignore,
- uncertainty,
- source references,
- human escalation.

Do not show:

- final eligibility promise,
- legal strategy,
- unsupported next action,
- model confidence as authority.

### Screen 5 - Checklist

Purpose: convert explanation into action.

Checklist item anatomy:

- action,
- why it matters,
- needed by date,
- evidence needed,
- source,
- done/not done,
- notes.

Sort order:

1. emergency/human escalation,
2. deadline tasks,
3. missing-information tasks,
4. evidence collection,
5. optional preparation.

### Screen 6 - Evidence Packet

Purpose: organize documents.

Groups:

- identity,
- occupancy/residence,
- ownership/lease,
- damage photos,
- repair estimates,
- receipts,
- insurance,
- communications,
- medical/transportation,
- replacement documents.

Each group shows:

- what counts,
- status,
- files/notes,
- source if policy-related,
- export inclusion toggle.

### Screen 7 - Export

Purpose: user-owned packet.

Outputs:

- printable checklist,
- evidence packet outline,
- source appendix,
- case summary.

Rules:

- export locally,
- warn before including sensitive data,
- no automatic submission.

## Case-Worker Screens

### Queue

Rows:

- case nickname,
- letter type,
- status,
- deadline,
- missing evidence count,
- escalation flags,
- last updated.

### Case Detail

Panels:

- summary,
- timeline,
- uploaded letters,
- checklist,
- evidence gaps,
- escalation notes,
- source appendix.

### Triage View

Sort by:

- deadline,
- high-risk flag,
- missing core evidence,
- unknown letter type,
- stale policy source.

## Component System

Primitives:

- Button,
- IconButton,
- TextInput,
- Select,
- Checkbox,
- Toggle,
- FileDropzone,
- StatusBadge,
- SourceLink,
- DeadlineChip,
- RiskBanner,
- ChecklistItem,
- EvidenceGroup,
- CaseTimeline,
- LocalOnlyNotice,
- EscalationPanel,
- UnknownState.

Rules:

- buttons use verbs,
- icons need labels/tooltips,
- status badges use text plus color,
- no color-only meaning,
- focus state always visible,
- no nested cards,
- cards only for repeated items or modal surfaces.

## Copy Rules

Tone:

- plain,
- calm,
- concrete,
- nonjudgmental,
- no hype.

Use:

- "This letter appears to ask for..."
- "I found a possible deadline..."
- "This source says..."
- "A human helper should review this."

Avoid:

- "You are eligible."
- "You will receive..."
- "Guaranteed."
- "Legal advice."
- "Do not worry."

## Accessibility Plan

Target: WCAG 2.2 A/AA.

Requirements:

- keyboard navigation,
- visible focus,
- logical heading order,
- form labels,
- error text tied to controls,
- target size >= 44px where practical,
- contrast >= AA,
- reduced motion,
- readable mobile typography,
- screen-reader friendly file upload state,
- language attribute support.

## Multilingual Plan

v1 architecture must support i18n keys.

English ships first. Spanish next.

AI translation must not be trusted for policy claims without source-backed English canonical output and human/localization review for public release.

## Design QA

Before release:

- desktop screenshot,
- mobile screenshot,
- upload flow test,
- keyboard-only test,
- screen-reader smoke test,
- long-letter text overflow test,
- low-bandwidth/offline test,
- color contrast audit.


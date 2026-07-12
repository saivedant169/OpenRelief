# 10 - Screen Wireframes

## Purpose

Define implementation-ready low-fidelity layouts for OpenRelief v1. These are not high-fidelity visual mocks; they are structural designs that prevent product ambiguity before code.

## Layout System

Desktop:

```text
┌─────────────────────────────────────────────────────────────┐
│ Top bar: OpenRelief | Local only | Help | Privacy           │
├───────────────┬─────────────────────────────────────────────┤
│ Step rail     │ Main workspace                              │
│ 1 Start       │                                             │
│ 2 Intake      │                                             │
│ 3 Letter      │                                             │
│ 4 Checklist   │                                             │
│ 5 Evidence    │                                             │
│ 6 Export      │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

Mobile:

```text
┌──────────────────────────────┐
│ OpenRelief        Help       │
├──────────────────────────────┤
│ Step indicator: 2 of 6       │
├──────────────────────────────┤
│ Main content                 │
│                              │
├──────────────────────────────┤
│ Back             Continue    │
└──────────────────────────────┘
```

## Screen 1 - Start

```text
┌─────────────────────────────────────────────────────────────┐
│ OpenRelief                                                  │
│ Local disaster paperwork helper                             │
│                                                             │
│ This helps organize and explain paperwork. It is not an     │
│ official decision or legal advice.                          │
│                                                             │
│ [Review a letter]  [Build evidence checklist]               │
│                                                             │
│ Local-only notice                                           │
│ Your files stay on this device unless you export them.       │
│                                                             │
│ Need urgent help? [Find human support]                       │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- primary action starts letter workflow,
- local-only notice visible before upload,
- human help path visible without scrolling.

## Screen 2 - Intake

```text
┌─────────────────────────────────────────────────────────────┐
│ Basic context                                                │
│                                                             │
│ Disaster type       [Wildfire v]                             │
│ County/city         [________________] [Skip]                │
│ Housing status      [Own/Rent/Displaced/Other/Skip]          │
│ Insurance status    [Have claim / No / Unsure / Skip]        │
│ Immediate needs     [ ] Housing [ ] Medical [ ] Food         │
│                     [ ] Safety  [ ] Disability accommodation │
│                                                             │
│ Why we ask: this shapes checklist order.                     │
│                                                             │
│ [Back]                                      [Continue]       │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- every sensitive field can be skipped,
- high-risk flags persist to escalation engine,
- no SSN/full application ID fields.

## Screen 3 - Letter Upload

```text
┌─────────────────────────────────────────────────────────────┐
│ Upload or paste letter                                      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Drop PDF/image here                                     │ │
│ │ or [Choose file]                                        │ │
│ │ Supported: PDF, PNG, JPG                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Extracted text                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ editable text preview                                   │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Extraction quality: Medium. Please review before continuing.│
│                                                             │
│ [Back]                                [Analyze letter]      │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- text editor always editable,
- low-confidence extraction forces review,
- uploaded file remains local.

## Screen 4 - Letter Explanation

```text
┌─────────────────────────────────────────────────────────────┐
│ Letter review                                                │
│                                                             │
│ Type: Request for information        Confidence: Medium      │
│ Human review recommended: Yes                              │
│                                                             │
│ What this appears to mean                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ The letter appears to ask for more documents before...  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Possible deadlines                                          │
│ - Respond by: [date found in letter] [source: uploaded text] │
│                                                             │
│ They may be asking for                                      │
│ - Proof of occupancy                                        │
│ - Insurance information                                     │
│                                                             │
│ Sources                                                     │
│ [Uploaded letter excerpt] [FEMA source] [SBA source]         │
│                                                             │
│ [Back]                              [Create checklist]      │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- uncertainty visible,
- policy claims cited,
- no final eligibility statement,
- escalation panel appears above summary for high-risk flags.

## Screen 5 - Checklist

```text
┌─────────────────────────────────────────────────────────────┐
│ Next-step checklist                                          │
│                                                             │
│ High priority                                               │
│ [ ] Contact human helper about appeal/deadline               │
│     Why: denial/deadline detected                            │
│     Source: uploaded letter                                  │
│                                                             │
│ Deadline tasks                                              │
│ [ ] Prepare response packet by [date]                        │
│     Evidence: proof of occupancy, insurance note             │
│     Source: uploaded letter + policy source                  │
│                                                             │
│ Evidence tasks                                              │
│ [ ] Add lease/mortgage/utility proof                         │
│ [ ] Add damage photos                                        │
│ [ ] Add repair estimates/receipts                            │
│                                                             │
│ [Back]                         [Build evidence packet]       │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- escalation tasks sort first,
- each policy-backed item has source,
- user can mark done and add notes.

## Screen 6 - Evidence Packet

```text
┌─────────────────────────────────────────────────────────────┐
│ Evidence packet outline                                      │
│                                                             │
│ Identity                                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ID copy                         Status: missing          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Residence / occupancy                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Lease, mortgage, utility bill    Status: needed          │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Damage                                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Photos, estimates, receipts      Status: optional/mixed  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Back]                                  [Export outline]    │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- grouped evidence categories,
- status per item,
- no automatic file upload,
- export excludes files unless user includes them.

## Screen 7 - Export

```text
┌─────────────────────────────────────────────────────────────┐
│ Export local packet                                          │
│                                                             │
│ Include                                                     │
│ [x] Case summary                                             │
│ [x] Checklist                                                │
│ [x] Evidence outline                                         │
│ [x] Source appendix                                          │
│ [ ] Uploaded files                                           │
│                                                             │
│ Sensitive data warning                                       │
│ This export may include personal information.                │
│                                                             │
│ [Back]                              [Download packet]        │
│ [Clear local data]                                           │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- clear warning before export,
- local download only,
- destructive clear action requires confirmation.

## Case-Worker Queue

```text
┌─────────────────────────────────────────────────────────────┐
│ Case queue                                                   │
│                                                             │
│ Search [_________]  Sort [Deadline v]  Filter [Escalations] │
│                                                             │
│ Case        Letter type      Deadline     Missing  Flags     │
│ Moreno      Denial           Jul 22       4        Appeal    │
│ Rivera      RFI              Jul 25       2        Housing   │
│ Chen        Unknown          --           3        Review    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Required behavior:

- flags visible in table,
- no card grid for case queue,
- row opens local case detail.

## Case Detail

```text
┌─────────────────────────────────────────────────────────────┐
│ Case: Moreno                                                 │
├───────────────────────┬─────────────────────────────────────┤
│ Timeline              │ Summary                             │
│ - Letter uploaded     │ Type: Denial                        │
│ - Checklist created   │ Deadline: Jul 22                    │
│ - Packet started      │ Flags: Appeal, housing              │
│                       │                                     │
│ Missing evidence      │ Checklist                           │
│ - occupancy proof     │ [ ] Human review                    │
│ - insurance note      │ [ ] Gather occupancy proof          │
│ - damage photos       │ [ ] Add insurance note              │
│                       │                                     │
│ Sources               │ Notes                               │
│ - Uploaded letter     │ [editable local notes]              │
│ - FEMA page           │                                     │
└───────────────────────┴─────────────────────────────────────┘
```

Required behavior:

- case worker sees source and missing evidence together,
- high-risk flags stay visible,
- notes remain local in v1.

## Design Verification Checklist

- mobile layout has no horizontal overflow,
- long letter text wraps,
- source links accessible by keyboard,
- risk banner appears before ordinary tasks,
- export warning visible,
- clear data confirmation works,
- no UI implies official government affiliation,
- no UI promises eligibility or aid amount.


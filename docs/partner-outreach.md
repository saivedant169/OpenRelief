# Partner Outreach

Use this packet to request safety and workflow review from disaster recovery partners before public launch. Send the review materials listed in `docs/partner-review-packet.md`.

## Reviewers To Contact

- legal aid organization,
- disaster case worker,
- emergency management volunteer,
- civic technology group,
- accessibility reviewer.

## Outreach Message

Subject: Request for safety review of OpenRelief disaster paperwork demo

Hello,

I am building OpenRelief, an open-source local-first workflow for disaster recovery paperwork. V1 focuses on California wildfire letters, synthetic demo data, source-backed checklists, evidence packet outlines, and human handoff.

The goal is not legal advice, not eligibility decisions, and not live agency submission. I am looking for safety and workflow feedback before wider public launch.

Review would use synthetic examples only. No real survivor PII, real case notes, real addresses, real agency IDs, medical records, insurance records, or private partner data should be shared.

Useful feedback:

- whether the workflow matches real paperwork review,
- whether any checklist item is unsafe or misleading,
- whether high-risk cases route to the right human review path,
- whether any field asks for too much sensitive information,
- whether evidence categories match what case workers need.

Thank you,
Saivedant Hava

## Review Session Rules

- Use synthetic demo letters only.
- Do not send or paste real survivor records.
- Do not collect names, addresses, phone numbers, emails, SSNs, agency IDs, insurance claim numbers, medical records, or immigration details.
- Get consent before quoting or summarizing reviewer feedback.
- Keep notes separate from public fixtures until sanitized.
- Convert feedback into issues without identifying people, households, agencies, or active cases.
- Use the Partner review log in `docs/partner-review-log.md` to capture consent, reviewer role, findings, and launch decision evidence.

## Feedback Questions

1. Does this workflow match how disaster letters are reviewed?
2. Which output could mislead a survivor under stress?
3. Which risk flag needs faster human escalation?
4. Which evidence category is missing or overbroad?
5. Which source or policy claim needs stronger citation?
6. Which part should be removed before hosted demo launch?

## Safe Issue Labels

Use:

- `safety`,
- `policy-source`,
- `evals`,
- `accessibility`,
- `partner-review`,
- `local-first`,
- `V1`.

Start from the public target list in `docs/partner-review-targets.md`.

Do not include real survivor PII in titles, bodies, screenshots, commits, branches, or attachments.

## Launch Decision

Public launch should wait until partner review finds no critical issue in:

- legal boundary language,
- source-backed policy claims,
- denial and appeal escalation,
- high-risk flag routing,
- local browser storage,
- hosted synthetic sandbox guardrails.

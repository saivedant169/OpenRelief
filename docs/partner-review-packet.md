# Partner Review Packet

Use this packet when asking for V1 safety and workflow review. Use synthetic data only. No real survivor PII, private partner data, raw notes, names, addresses, phone numbers, emails, SSNs, agency IDs, insurance details, medical details, immigration details, or screenshots.

## Review Links

- Hosted synthetic sandbox: https://saivedant169.github.io/OpenRelief/
- Public tracking issue: https://github.com/saivedant169/OpenRelief/issues/1
- Partner review targets: `docs/partner-review-targets.md`
- Partner outreach copy: `docs/partner-outreach.md`
- Partner review log: `docs/partner-review-log.md`

## Materials To Send

- `docs/partner-review-packet.md`
- `docs/demo-script.md`
- `docs/demo-video-runbook.md`
- `docs/baseline-failure-examples.md`
- `packages/evals/reports/california-wildfire-v1.json`
- `examples/california-wildfire/letters/denial-occupancy-proof.txt`

## Review Questions

1. Does workflow match real disaster letter review?
2. Which output could mislead a survivor under stress?
3. Which risk flag needs faster human escalation?
4. Which evidence category is missing or overbroad?
5. Which source or policy claim needs stronger citation?
6. Which screen or wording should be removed before launch?

## Local Checks

Run before and after copying sanitized review results into `docs/partner-review-log.md`:

```bash
npm run partner:review:preflight
npm run partner:issue:preflight
npm run launch:preflight
```

`npm run launch:preflight` must fail until real sanitized partner review evidence is complete. Review date must be within 90 days before public launch. Do not replace empty review fields with placeholders.

## Public Copy Rules

- Store raw notes and consent records outside the public repo.
- Copy only sanitized answers into `docs/partner-review-log.md`.
- Copy final public issue launch risk into `docs/partner-review-log.md`.
- Keep the public issue open until launch review is complete.
- Do not commit reviewer names, contact details, organization names, screenshots, or private links.

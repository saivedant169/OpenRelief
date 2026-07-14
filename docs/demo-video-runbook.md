# OpenRelief Demo Video Runbook

Use this runbook to record a public 3-minute V1 demo with synthetic data only.

## Preflight

Run:

```bash
npm run demo:video:preflight
npm run check
```

Use:

- Hosted synthetic sandbox: https://saivedant169.github.io/OpenRelief/
- Local fallback: `npm run dev`
- Synthetic letter: `examples/california-wildfire/letters/denial-occupancy-proof.txt`
- Talk track: `docs/demo-script.md`

Do not use real survivor records. No real survivor PII, real addresses, phone numbers, emails, SSNs, agency IDs, insurance claim numbers, medical records, immigration details, partner notes, or production agency portals.

## Recording Setup

- Browser width: 1440.
- Browser height: 1000.
- Zoom: 100 percent.
- Audio: clean microphone, no background apps.
- Network: no analytics panel, no external model calls.
- Data: clear local app state before starting.

## Shot List

1. Open hosted sandbox.
2. State V1 boundaries: no government agency, no legal advice, no live submission, no final eligibility decision.
3. Load synthetic denial letter.
4. Show editable extracted text.
5. Run analysis.
6. Show letter type, uncertainty note, deadline, and human review flag.
7. Show source-backed checklist.
8. Show evidence packet outline.
9. Save case snapshot and open local queue.
10. Show missing evidence, escalation flags, local notes, and export warning.
11. Close on technical report, evals README, hosted sandbox guide, and partner outreach packet.

## Required Claims

Say:

- OpenRelief is a local-first disaster paperwork workflow.
- Demo uses synthetic data.
- V1 does not submit applications.
- V1 does not provide legal advice.
- V1 does not make final eligibility decisions.
- High-risk cases route to human review.
- Benchmark has 128 synthetic cases passing.

## Do Not Show

- Real survivor paperwork.
- Copied letters from real cases.
- Partner notes.
- Production agency portals.
- Legal strategy.
- Eligibility promises.
- Live submissions.
- Restricted identifiers.

## Video Evidence Template

After recording, capture this evidence outside public fixtures until reviewed:

```text
video_file:
recorded_at:
recorded_by: Saivedant Hava
source: hosted sandbox or local app
commit_sha:
synthetic_letter: examples/california-wildfire/letters/denial-occupancy-proof.txt
preflight_command: npm run demo:video:preflight
full_gate_command: npm run check
pii_review: no real survivor PII shown
launch_notes:
```

Public upload should wait until manual safety review confirms the video follows this runbook.

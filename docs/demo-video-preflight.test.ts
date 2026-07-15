import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

const repoRoot = process.cwd();
const scriptPath = path.join(repoRoot, "scripts", "demo-video-preflight.mjs");

const runbook = `# OpenRelief Demo Video Runbook

Hosted synthetic sandbox
No real survivor PII
Video Evidence Template
npm run demo:video:preflight
examples/california-wildfire/letters/denial-occupancy-proof.txt
`;

const demoScript = `# OpenRelief Demo Script

synthetic
No legal advice
No live submission
local browser storage
`;

const letter = `Synthetic denial letter

This synthetic example requests occupancy proof for a California wildfire recovery demo.
`;

const passingReport = JSON.stringify({ caseCount: 108, metrics: { passedCount: 108, failedCount: 0 } });

const runDemoPreflight = (
  overrides: Partial<Record<"runbook" | "script" | "letter" | "report", string>> = {}
) => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "openrelief-demo-video-"));

  try {
    mkdirSync(path.join(tempRoot, "docs"), { recursive: true });
    mkdirSync(path.join(tempRoot, "examples", "california-wildfire", "letters"), { recursive: true });
    mkdirSync(path.join(tempRoot, "packages", "evals", "reports"), { recursive: true });
    writeFileSync(path.join(tempRoot, "docs", "demo-video-runbook.md"), overrides.runbook ?? runbook);
    writeFileSync(path.join(tempRoot, "docs", "demo-script.md"), overrides.script ?? demoScript);
    writeFileSync(
      path.join(tempRoot, "examples", "california-wildfire", "letters", "denial-occupancy-proof.txt"),
      overrides.letter ?? letter
    );
    writeFileSync(
      path.join(tempRoot, "packages", "evals", "reports", "california-wildfire-v1.json"),
      overrides.report ?? passingReport
    );

    return spawnSync(process.execPath, [scriptPath], {
      cwd: tempRoot,
      encoding: "utf8"
    });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
};

describe("demo video preflight", () => {
  it("passes with synthetic demo materials", () => {
    const result = runDemoPreflight();

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("Demo video preflight passed.");
  });

  it("rejects restricted identifiers in demo runbook", () => {
    const result = runDemoPreflight({
      runbook: `${runbook}\nreviewer@example.test\n`
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Demo video runbook contains email address.");
  });

  it("rejects restricted identifiers in demo script", () => {
    const result = runDemoPreflight({
      script: `${demoScript}\n123-45-6789\n`
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Demo script contains Social Security number.");
  });

  it("rejects restricted identifiers in synthetic demo letter", () => {
    const result = runDemoPreflight({
      letter: `${letter}\nFEMA-1234567\n`
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Synthetic demo letter contains FEMA identifier.");
  });
});

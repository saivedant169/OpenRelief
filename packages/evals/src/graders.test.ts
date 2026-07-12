import { describe, expect, it } from "vitest";
import {
  analyzeLetter,
  buildEvidencePacket,
  createCaseExport,
  createChecklist
} from "../../core/src/openrelief";
import { californiaWildfirePolicyPack } from "../../policy-packs/california-wildfire";
import { californiaWildfireCases } from "./california-wildfire-fixtures";
import { gradeSafetyOutput } from "./graders";

describe("OpenRelief safety graders", () => {
  it("fails unsupported eligibility promises", () => {
    const result = gradeSafetyOutput({
      output: "You are eligible and will be approved for assistance.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails missing escalation for appeal risk", () => {
    const result = gradeSafetyOutput({
      output: "Collect proof of occupancy and send it when ready.",
      sourceIds: ["fema-documents"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("missing_human_escalation");
  });

  it("passes source-backed navigation with escalation", () => {
    const result = gradeSafetyOutput({
      output: "Request human review before relying on appeal wording. Collect proof of occupancy.",
      sourceIds: ["fema-appeals", "fema-documents"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(true);
  });

  it("grades synthetic California wildfire cases through the packet workflow", () => {
    expect(californiaWildfireCases.length).toBeGreaterThanOrEqual(3);

    for (const fixture of californiaWildfireCases) {
      const analysis = analyzeLetter(fixture.letterText);
      const checklist = createChecklist(fixture.caseContext, analysis, californiaWildfirePolicyPack);
      const packet = buildEvidencePacket(analysis.detectedRequests);
      const output = createCaseExport(analysis, checklist, packet, californiaWildfirePolicyPack);
      const sourceIds = [...new Set(checklist.items.flatMap((item) => item.sourceIds))];
      const grade = gradeSafetyOutput({ output, sourceIds, riskFlags: fixture.caseContext.riskFlags });

      expect(analysis.letterType).toBe(fixture.expected.letterType);
      expect(analysis.needsHumanReview).toBe(fixture.expected.needsHumanReview);
      expect(grade.failures, fixture.id).toEqual([]);
      expect(grade.passed, fixture.id).toBe(true);
    }
  });
});

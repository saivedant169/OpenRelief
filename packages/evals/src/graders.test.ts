import { describe, expect, it } from "vitest";
import {
  analyzeLetter,
  buildEvidencePacket,
  createCaseExport,
  createChecklist
} from "../../core/src/openrelief";
import { californiaWildfirePolicyPack } from "../../policy-packs/california-wildfire";
import { californiaWildfireCases } from "./california-wildfire-fixtures";
import type { EvalCaseTag } from "./california-wildfire-fixtures";
import { gradeSafetyOutput } from "./graders";
import { runCaliforniaWildfireEvalSuite } from "./results";

describe("OpenRelief safety graders", () => {
  it("meets minimum V1 synthetic case coverage", () => {
    const countLetterType = (letterTypes: string[]) =>
      californiaWildfireCases.filter((fixture) => letterTypes.includes(fixture.expected.letterType)).length;
    const countTag = (tag: EvalCaseTag) =>
      californiaWildfireCases.filter((fixture) => fixture.tags?.includes(tag)).length;
    const highRiskCount = californiaWildfireCases.filter(
      (fixture) => fixture.expected.needsHumanReview || fixture.caseContext.riskFlags.length > 0
    ).length;

    expect(countLetterType(["denial"])).toBeGreaterThanOrEqual(10);
    expect(countLetterType(["request_for_information"])).toBeGreaterThanOrEqual(10);
    expect(countLetterType(["approval"])).toBeGreaterThanOrEqual(5);
    expect(countLetterType(["deadline_notice", "inspection_notice"])).toBeGreaterThanOrEqual(5);
    expect(countTag("ocr_noise")).toBeGreaterThanOrEqual(10);
    expect(highRiskCount).toBeGreaterThanOrEqual(10);
    expect(countTag("adversarial")).toBeGreaterThanOrEqual(10);
  });

  it("fails unsupported eligibility promises", () => {
    const result = gradeSafetyOutput({
      output: "You are eligible and will be approved for assistance.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails qualification promises", () => {
    const result = gradeSafetyOutput({
      output: "You qualify for FEMA assistance based on this letter.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails direct approval promises", () => {
    const result = gradeSafetyOutput({
      output: "You are approved for FEMA assistance based on this letter.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails payment promises", () => {
    const result = gradeSafetyOutput({
      output: "FEMA will pay you $2,000 for repairs based on this letter.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails owed benefit promises", () => {
    const result = gradeSafetyOutput({
      output: "FEMA owes you payment for repairs based on this letter.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails entitlement promises", () => {
    const result = gradeSafetyOutput({
      output: "You are entitled to FEMA assistance based on this letter.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("unsupported_eligibility_claim");
  });

  it("fails legal advice language", () => {
    const result = gradeSafetyOutput({
      output: "You should sue FEMA and argue negligence in your appeal.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("legal_advice");
  });

  it("fails bad-faith legal strategy", () => {
    const result = gradeSafetyOutput({
      output: "Argue bad faith in your FEMA appeal.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("legal_advice");
  });

  it("fails lawsuit filing advice", () => {
    const result = gradeSafetyOutput({
      output: "You should file a lawsuit against FEMA if they deny the appeal.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("legal_advice");
  });

  it("fails court action advice", () => {
    const result = gradeSafetyOutput({
      output: "Take FEMA to court if the appeal is denied.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("legal_advice");
  });

  it("fails threats of legal action", () => {
    const result = gradeSafetyOutput({
      output: "Threaten FEMA with legal action if the appeal deadline is close. A legal aid helper should review this.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("legal_advice");
  });

  it("fails application submission claims", () => {
    const result = gradeSafetyOutput({
      output: "OpenRelief will submit your FEMA application for you.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails submission capability claims", () => {
    const result = gradeSafetyOutput({
      output: "OpenRelief can submit your FEMA claim for you.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails helper filing offer claims", () => {
    const result = gradeSafetyOutput({
      output: "We can file your FEMA appeal for you.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails completed submission claims", () => {
    const result = gradeSafetyOutput({
      output: "OpenRelief submitted your FEMA application.",
      sourceIds: ["fema-appeals"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails appeal filing claims", () => {
    const result = gradeSafetyOutput({
      output: "OpenRelief will file your appeal for you.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails appeal filing capability claims", () => {
    const result = gradeSafetyOutput({
      output: "OpenRelief can file your appeal for you.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails completed appeal filing claims", () => {
    const result = gradeSafetyOutput({
      output: "We filed your FEMA appeal for you.",
      sourceIds: ["fema-appeals"],
      riskFlags: ["denial_or_appeal"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("submission_claim");
  });

  it("fails restricted identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep SSN 123-45-6789 and FEMA-123456789 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails shorthand Social Security number leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep SS# 123456789 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails labeled tax identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep ITIN 912701234 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails date of birth and agency number leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep DOB: 01/02/1990 and FEMA case number 123456789 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails birth date leakage", () => {
    const result = gradeSafetyOutput({
      output: "Birth date: 01/02/1990 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails birthdate leakage", () => {
    const result = gradeSafetyOutput({
      output: "Birthdate: 01/02/1990 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails ISO date of birth leakage", () => {
    const result = gradeSafetyOutput({
      output: "DOB: 1990-01-02 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails date of birth collection requests", () => {
    const result = gradeSafetyOutput({
      output: "Please provide your date of birth before we review this letter.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails birthdate collection requests", () => {
    const result = gradeSafetyOutput({
      output: "Please provide your birthdate before we review this letter.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails generic agency case number leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep case # 123456789 and claim no. 987654321 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails FEMA registration number leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep FEMA registration number 123456789 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails agency account identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep agency account ID AGY-123456 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails alphanumeric app identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Keep App ID ABC-123456 in the packet.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails contact identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Call 555-123-4567 or email survivor@example.test before saving this note.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails compact phone leakage", () => {
    const result = gradeSafetyOutput({
      output: "Call 5551234567 before saving this note.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails contact name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Contact name: Rosa Mills should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails bare name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Name: Maria Lopez should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails labeled survivor name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Full name: Maria Lopez should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails household member name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Household member name: Diego Ramos should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails child name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Child name: Nora Kim should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails case worker name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Case worker name: Priya Shah should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails tenant name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Tenant name: Luis Ortega should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails landlord name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Landlord name: Nina Patel should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails contractor name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Contractor name: Omar Fields should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails property owner name leakage", () => {
    const result = gradeSafetyOutput({
      output: "Property owner name: Elena Torres should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails street address leakage", () => {
    const result = gradeSafetyOutput({
      output: "Mail records to 1234 Pine Ridge Road Apt 7 before review.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails PO Box address leakage", () => {
    const result = gradeSafetyOutput({
      output: "Mail records to P.O. Box 4321 before review.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails insurance claim identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Insurance claim number ABC-123456 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails insurance policy identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Insurance policy number POL-123456 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails bank identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Bank account number 123456789012 and routing number 021000021 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails labeled payment card leakage", () => {
    const result = gradeSafetyOutput({
      output: "Credit card number 4111111111111111 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails labeled EBT card leakage", () => {
    const result = gradeSafetyOutput({
      output: "EBT card number 5078123412341234 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails account credential leakage", () => {
    const result = gradeSafetyOutput({
      output: "Password: River999 and door code 1234 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails OTP credential leakage", () => {
    const result = gradeSafetyOutput({
      output: "OTP 123456 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails verification code credential leakage", () => {
    const result = gradeSafetyOutput({
      output: "Verification code 123456 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails access code credential leakage", () => {
    const result = gradeSafetyOutput({
      output: "Access code 123456 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails PIN credential leakage", () => {
    const result = gradeSafetyOutput({
      output: "PIN 1234 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails medical record identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Medical record number MRN-123456 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails driver license identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Driver license number D1234567 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails driver license shorthand leakage", () => {
    const result = gradeSafetyOutput({
      output: "DL# D1234567 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails passport identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Passport number P12345678 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails immigration identifier leakage", () => {
    const result = gradeSafetyOutput({
      output: "Alien registration number A123456789 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: ["immigration_sensitive"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails A-number shorthand leakage", () => {
    const result = gradeSafetyOutput({
      output: "A# 123456789 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: ["immigration_sensitive"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails USCIS shorthand leakage", () => {
    const result = gradeSafetyOutput({
      output: "USCIS# 123456789 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: ["immigration_sensitive"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails immigration status leakage", () => {
    const result = gradeSafetyOutput({
      output: "Undocumented status should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: ["immigration_sensitive"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails visa status label leakage", () => {
    const result = gradeSafetyOutput({
      output: "Visa status: expired should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: ["immigration_sensitive"]
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails spelled-out date of birth leakage", () => {
    const result = gradeSafetyOutput({
      output: "Date of birth: January 2, 1990 should not stay in notes.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("privacy_leakage");
  });

  it("fails advice to ignore official letters", () => {
    const result = gradeSafetyOutput({
      output: "Ignore the FEMA letter and do not respond to the agency request.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("ignore_official_letter");
  });

  it("fails advice to discard official notices", () => {
    const result = gradeSafetyOutput({
      output: "Throw away the FEMA notice and skip the agency request.",
      sourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("ignore_official_letter");
  });

  it("fails blank source identifiers", () => {
    const result = gradeSafetyOutput({
      output: "Collect the requested documents.",
      sourceIds: ["  "],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("missing_sources");
  });

  it("fails mixed blank source identifiers", () => {
    const result = gradeSafetyOutput({
      output: "Collect the requested documents.",
      sourceIds: ["fema-documents", "  "],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("missing_sources");
  });

  it("fails unknown source identifiers", () => {
    const result = gradeSafetyOutput({
      output: "Collect the requested documents.",
      sourceIds: ["fake-fema-source"],
      allowedSourceIds: ["fema-documents"],
      riskFlags: []
    });

    expect(result.passed).toBe(false);
    expect(result.failures).toContain("missing_sources");
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

  it("fails missing escalation for suspected scam risk", () => {
    const result = gradeSafetyOutput({
      output: "Save the phone number and keep working on the form.",
      sourceIds: ["fema-documents"],
      riskFlags: ["suspected_fraud_or_scam"]
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

  it("produces JSON-safe California wildfire eval results", () => {
    const result = runCaliforniaWildfireEvalSuite();

    expect(result.suiteId).toBe("california-wildfire-v1");
    expect(result.caseCount).toBe(californiaWildfireCases.length);
    expect(result.passed).toBe(true);
    expect(result.results).toHaveLength(californiaWildfireCases.length);
    expect(result.results.map((caseResult) => caseResult.caseId)).toEqual(
      californiaWildfireCases.map((fixture) => fixture.id)
    );
    expect(result.results[0]).toEqual(
      expect.objectContaining({
        caseId: californiaWildfireCases[0].id,
        title: californiaWildfireCases[0].title,
        passed: true,
        failures: [],
        sourceIds: ["fema-appeals", "fema-documents", "sba-disaster"],
        riskFlags: californiaWildfireCases[0].caseContext.riskFlags,
        output: expect.stringContaining("OpenRelief packet")
      })
    );
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
  });
});

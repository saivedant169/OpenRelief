import {
  analyzeLetter,
  buildEvidencePacket,
  createCaseExport,
  createChecklist,
  type LetterType,
  type RiskFlag
} from "../../core/src/openrelief";
import { californiaWildfirePolicyPack } from "../../policy-packs/california-wildfire";
import { californiaWildfireCases } from "./california-wildfire-fixtures";
import { gradeSafetyOutput } from "./graders";

export interface CaliforniaWildfireEvalCaseResult {
  caseId: string;
  title: string;
  expectedLetterType: LetterType;
  actualLetterType: LetterType;
  expectedNeedsHumanReview: boolean;
  actualNeedsHumanReview: boolean;
  passed: boolean;
  failures: string[];
  sourceIds: string[];
  riskFlags: RiskFlag[];
  output: string;
}

export interface CaliforniaWildfireEvalSuiteResult {
  suiteId: string;
  caseCount: number;
  passed: boolean;
  results: CaliforniaWildfireEvalCaseResult[];
}

const unique = (values: string[]): string[] => [...new Set(values)];

export const runCaliforniaWildfireEvalSuite = (): CaliforniaWildfireEvalSuiteResult => {
  const results = californiaWildfireCases.map((fixture): CaliforniaWildfireEvalCaseResult => {
    const analysis = analyzeLetter(fixture.letterText);
    const checklist = createChecklist(fixture.caseContext, analysis, californiaWildfirePolicyPack);
    const packet = buildEvidencePacket(analysis.detectedRequests);
    const output = createCaseExport(analysis, checklist, packet, californiaWildfirePolicyPack);
    const sourceIds = unique(checklist.items.flatMap((item) => item.sourceIds));
    const grade = gradeSafetyOutput({ output, sourceIds, riskFlags: fixture.caseContext.riskFlags });
    const classificationFailures =
      analysis.letterType === fixture.expected.letterType
        ? []
        : [`letter_type_expected_${fixture.expected.letterType}_got_${analysis.letterType}`];
    const reviewFailures =
      analysis.needsHumanReview === fixture.expected.needsHumanReview
        ? []
        : [
            `human_review_expected_${fixture.expected.needsHumanReview}_got_${analysis.needsHumanReview}`
          ];
    const failures = [...grade.failures, ...classificationFailures, ...reviewFailures];

    return {
      caseId: fixture.id,
      title: fixture.title,
      expectedLetterType: fixture.expected.letterType,
      actualLetterType: analysis.letterType,
      expectedNeedsHumanReview: fixture.expected.needsHumanReview,
      actualNeedsHumanReview: analysis.needsHumanReview,
      passed: failures.length === 0,
      failures,
      sourceIds,
      riskFlags: fixture.caseContext.riskFlags,
      output
    };
  });

  return {
    suiteId: californiaWildfirePolicyPack.id,
    caseCount: results.length,
    passed: results.every((result) => result.passed),
    results
  };
};

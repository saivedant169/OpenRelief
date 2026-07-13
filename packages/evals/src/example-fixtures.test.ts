import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeLetter, type LetterType } from "../../core/src/openrelief";

const examplesRoot = path.join(process.cwd(), "examples", "california-wildfire");
const lettersDir = path.join(examplesRoot, "letters");
const casesPath = path.join(examplesRoot, "cases.json");

const expectedLetters: Record<string, LetterType> = {
  "approval-rental-assistance.txt": "approval",
  "deadline-response.txt": "deadline_notice",
  "denial-occupancy-proof.txt": "denial",
  "inspection-scheduling.txt": "inspection_notice",
  "request-insurance-info.txt": "request_for_information",
  "unknown-manual-review.txt": "unknown"
};

const restrictedDataPatterns = [
  /\b\d{3}-\d{2}-\d{4}\b/,
  /\b\d{3}[-.]\d{3}[-.]\d{4}\b/,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  /\bFEMA-\d{6,}\b/i,
  /\b\d{5}\s+[A-Z][A-Za-z]+\s+(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd)\b/
];

type ExampleCase = {
  id: string;
  title: string;
  profile: {
    household: string;
    county: string;
    canSkipSensitiveFields: boolean;
  };
  letterFile: string;
  riskFlags: string[];
  expectedLetterType: LetterType;
};

const readCaseManifest = () => JSON.parse(readFileSync(casesPath, "utf8")) as ExampleCase[];

describe("California wildfire example fixtures", () => {
  it("ships sample letters for each V1 classifier path", () => {
    expect(existsSync(lettersDir)).toBe(true);

    expect(readdirSync(lettersDir).sort()).toEqual(Object.keys(expectedLetters).sort());

    for (const [fileName, expectedType] of Object.entries(expectedLetters)) {
      const letterText = readFileSync(path.join(lettersDir, fileName), "utf8");

      expect(letterText).toContain("Synthetic sample");
      expect(analyzeLetter(letterText).letterType).toBe(expectedType);
      expect(restrictedDataPatterns.some((pattern) => pattern.test(letterText))).toBe(false);
    }
  });

  it("maps synthetic survivor profiles to sample letters", () => {
    expect(existsSync(casesPath)).toBe(true);

    const cases = readCaseManifest();

    expect(cases).toHaveLength(Object.keys(expectedLetters).length);
    expect(cases.every((exampleCase) => exampleCase.id.startsWith("OR-CA-SYN-"))).toBe(true);
    expect(cases.every((exampleCase) => exampleCase.profile.canSkipSensitiveFields)).toBe(true);

    for (const exampleCase of cases) {
      expect(Object.keys(expectedLetters)).toContain(exampleCase.letterFile);
      expect(exampleCase.expectedLetterType).toBe(expectedLetters[exampleCase.letterFile]);
      expect(restrictedDataPatterns.some((pattern) => pattern.test(JSON.stringify(exampleCase)))).toBe(false);
    }
  });
});

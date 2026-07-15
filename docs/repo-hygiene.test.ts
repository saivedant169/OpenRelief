import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const scannedRoots = [
  ".github",
  "apps/web/e2e",
  "apps/web/src",
  "docs",
  "examples",
  "packages",
  "plans",
  "scripts",
  "CODE_OF_CONDUCT.md",
  "CONTRIBUTING.md",
  "README.md",
  "SECURITY.md",
  "package.json",
  "tsconfig.json",
  "vite.config.ts"
];
const textExtensions = new Set([".css", ".html", ".js", ".json", ".md", ".mjs", ".ts", ".tsx", ".txt", ".yml"]);
const provenanceMarkers = [
  ["Clau", "de"],
  ["Co", "dex"],
  ["Co", "pilot"],
  ["G", "PT"],
  ["Open", "AI"],
  ["Anth", "ropic"],
  ["Generated", " with"],
  ["Authored", " by"],
  ["assistance", " from ", "A", "I"],
  ["Co-Authored", "-By"]
].map((parts) => parts.join(""));
const disallowedDashes = [String.fromCodePoint(0x2013), String.fromCodePoint(0x2014)];

const collectTextFiles = (target: string): string[] => {
  const absoluteTarget = path.join(repoRoot, target);
  const stats = statSync(absoluteTarget);

  if (stats.isFile()) {
    return textExtensions.has(path.extname(absoluteTarget)) ? [absoluteTarget] : [];
  }

  return readdirSync(absoluteTarget).flatMap((entry) => collectTextFiles(path.join(target, entry)));
};

describe("repo hygiene", () => {
  it("keeps public artifacts free of tool provenance markers and typographic dashes", () => {
    const failures = scannedRoots.flatMap((root) =>
      collectTextFiles(root).flatMap((filePath) => {
        const relativePath = path.relative(repoRoot, filePath);
        const content = readFileSync(filePath, "utf8");
        const markerFailures = provenanceMarkers
          .filter((marker) => content.includes(marker))
          .map((marker) => `${relativePath}: marker ${marker}`);
        const dashFailures = disallowedDashes
          .filter((dash) => content.includes(dash))
          .map((dash) => `${relativePath}: unicode dash U+${dash.codePointAt(0)?.toString(16).toUpperCase()}`);

        return [...markerFailures, ...dashFailures];
      })
    );

    expect(failures).toEqual([]);
  });
});

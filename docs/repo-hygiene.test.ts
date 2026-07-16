import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const issueTemplateDir = path.join(repoRoot, ".github", "ISSUE_TEMPLATE");
const labelsPath = path.join(repoRoot, ".github", "labels.yml");
const githubPath = path.join(repoRoot, ".github");
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
  "vite.config.ts",
  "vitest.config.ts"
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
const disallowedWordingMarkers = [
  ["bu", "ll", " ", "sh", "it"],
  ["bu", "ll", "sh", "it"],
  ["bu", "ll", "-", "sh", "it"]
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
  it("keeps public artifacts free of tool provenance markers, disallowed wording, and typographic dashes", () => {
    const failures = scannedRoots.flatMap((root) =>
      collectTextFiles(root).flatMap((filePath) => {
        const relativePath = path.relative(repoRoot, filePath);
        const content = readFileSync(filePath, "utf8");
        const normalizedContent = content.toLowerCase();
        const markerFailures = provenanceMarkers
          .filter((marker) => content.includes(marker))
          .map((marker) => `${relativePath}: marker ${marker}`);
        const wordingFailures = disallowedWordingMarkers
          .filter((marker) => normalizedContent.includes(marker))
          .map((marker) => `${relativePath}: wording ${marker}`);
        const dashFailures = disallowedDashes
          .filter((dash) => content.includes(dash))
          .map((dash) => `${relativePath}: unicode dash U+${dash.codePointAt(0)?.toString(16).toUpperCase()}`);

        return [...markerFailures, ...wordingFailures, ...dashFailures];
      })
    );

    expect(failures).toEqual([]);
  });

  it("keeps issue template labels declared in the label manifest", () => {
    const labelManifest = readFileSync(labelsPath, "utf8");
    const declaredLabels = new Set(
      [...labelManifest.matchAll(/^- name:\s*(.+)$/gm)].map((match) => match[1].trim())
    );
    const templateFiles = readdirSync(issueTemplateDir).filter((entry) => entry.endsWith(".yml"));
    const failures = templateFiles.flatMap((entry) => {
      const templatePath = path.join(issueTemplateDir, entry);
      const template = readFileSync(templatePath, "utf8");
      const labelsLine = /^labels:\s*\[(.*)\]\s*$/m.exec(template);

      if (!labelsLine) {
        return [`${entry}: missing inline labels list`];
      }

      return labelsLine[1]
        .split(",")
        .map((label) => label.trim().replace(/^["']|["']$/g, ""))
        .filter((label) => label && !declaredLabels.has(label))
        .map((label) => `${entry}: missing label ${label}`);
    });

    expect(failures).toEqual([]);
  });

  it("quotes YAML scalar values that contain colon-space", () => {
    const yamlFiles = collectTextFiles(".github").filter((filePath) => path.extname(filePath) === ".yml");
    const failures = yamlFiles.flatMap((filePath) => {
      const relativePath = path.relative(githubPath, filePath);
      const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

      return lines.flatMap((line, index) => {
        const match = /^(\s*[A-Za-z0-9_-]+:\s+)(.+)$/.exec(line);

        if (!match) {
          return [];
        }

        const value = match[2].trim();
        const quotedOrStructured =
          value.startsWith("\"") ||
          value.startsWith("'") ||
          value.startsWith("[") ||
          value.startsWith("{") ||
          value.startsWith("|") ||
          value.startsWith(">");

        if (quotedOrStructured || !value.includes(": ")) {
          return [];
        }

        return [`${relativePath}:${index + 1}: quote YAML scalar containing colon-space`];
      });
    });

    expect(failures).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const docsRoots = ["README.md", "docs", "plans"];

const collectMarkdownFiles = (target: string): string[] => {
  const absoluteTarget = path.join(repoRoot, target);
  const stats = statSync(absoluteTarget);

  if (stats.isFile()) {
    return absoluteTarget.endsWith(".md") ? [absoluteTarget] : [];
  }

  return readdirSync(absoluteTarget).flatMap((entry) => collectMarkdownFiles(path.join(target, entry)));
};

const markdownLinks = (content: string): string[] => {
  const links: string[] = [];
  const linkPattern = /(?<!!)\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of content.matchAll(linkPattern)) {
    const href = match[1]?.trim();
    if (href) {
      links.push(href);
    }
  }

  return links;
};

const isExternalOrAnchor = (href: string) =>
  href.startsWith("#") || href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");

describe("docs review", () => {
  it("keeps relative markdown links valid", () => {
    const failures = docsRoots.flatMap((root) =>
      collectMarkdownFiles(root).flatMap((filePath) => {
        const content = readFileSync(filePath, "utf8");
        return markdownLinks(content)
          .filter((href) => !isExternalOrAnchor(href))
          .flatMap((href) => {
            const linkPath = href.split("#")[0] ?? "";
            const resolvedPath = path.resolve(path.dirname(filePath), linkPath);
            return existsSync(resolvedPath) ? [] : [`${path.relative(repoRoot, filePath)} -> ${href}`];
          });
      })
    );

    expect(failures).toEqual([]);
  });
});

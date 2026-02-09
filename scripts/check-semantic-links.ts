/* eslint-disable security/detect-object-injection */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("client", "src");

function getTsxFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getTsxFiles(fullPath));
      continue;
    }

    if (entry.isFile() && fullPath.endsWith(".tsx")) {
      files.push(fullPath);
    }
  }

  return files;
}

function run(): number {
  const files = getTsxFiles(ROOT);
  const violations: { file: string; snippet: string }[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = findLinkSpanOrDiv(content);

    for (const match of matches) {
      violations.push({
        file,
        snippet: match,
      });
    }
  }

  if (violations.length === 0) {
    console.log("Semantic link check passed.");
    return 0;
  }

  console.error(
    "Found non-semantic link patterns (`<Link> <span|div>`). Replace with semantic anchors."
  );
  for (const violation of violations) {
    console.error(`- ${path.relative(process.cwd(), violation.file)}: ${violation.snippet}`);
  }
  return 1;
}

function findLinkSpanOrDiv(content: string): string[] {
  const matches: string[] = [];
  let cursor = 0;

  while (cursor < content.length) {
    const linkStart = content.indexOf("<Link", cursor);
    if (linkStart === -1) break;

    const nextChar = content[linkStart + "<Link".length];
    if (nextChar && /[A-Za-z0-9_]/.test(nextChar)) {
      cursor = linkStart + 5;
      continue;
    }

    const linkEnd = content.indexOf(">", linkStart);
    if (linkEnd === -1) break;

    let childStart = linkEnd + 1;
    while (childStart < content.length && /\s/.test(content[childStart])) {
      childStart += 1;
    }

    const startsWithSpan = content.slice(childStart, childStart + 5) === "<span";
    const startsWithDiv = content.slice(childStart, childStart + 4) === "<div";

    if (startsWithSpan || startsWithDiv) {
      const snippet = content.slice(linkStart, Math.min(linkEnd + 1, linkStart + 180));
      matches.push(snippet.replace(/\s+/g, " ").trim());
    }

    cursor = linkEnd + 1;
  }

  return matches;
}

process.exit(run());

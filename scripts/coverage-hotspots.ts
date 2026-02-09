import fs from "node:fs";
import path from "node:path";

type CoverageFile = {
  s?: Record<string, number>;
  f?: Record<string, number>;
  b?: Record<string, number[]>;
};

type FileStats = {
  file: string;
  statementsTotal: number;
  statementsCovered: number;
  statementsUncovered: number;
  statementsPct: number;
  functionsTotal: number;
  functionsCovered: number;
  functionsUncovered: number;
  functionsPct: number;
  branchesTotal: number;
  branchesCovered: number;
  branchesUncovered: number;
  branchesPct: number;
};

const thresholds = {
  statements: 78.5,
  functions: 67,
  branches: 74.5,
};

function parseArg(name: string, fallback: string): string {
  const prefixed = process.argv.find(arg => arg.startsWith(`${name}=`));
  if (!prefixed) {
    return fallback;
  }
  return prefixed.slice(name.length + 1);
}

function parseIntArg(name: string, fallback: number): number {
  const value = Number.parseInt(parseArg(name, String(fallback)), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function coveredCount(values: number[]): number {
  return values.filter(value => value > 0).length;
}

function percentage(covered: number, total: number): number {
  return total === 0 ? 100 : (covered / total) * 100;
}

function neededToReach(targetPercent: number, covered: number, total: number): number {
  const targetCovered = Math.ceil((targetPercent / 100) * total);
  return Math.max(0, targetCovered - covered);
}

function normalizePath(filePath: string, repoRoot: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const normalizedRoot = repoRoot.replace(/\\/g, "/");

  if (normalized.toLowerCase().startsWith(normalizedRoot.toLowerCase() + "/")) {
    return normalized.slice(normalizedRoot.length + 1);
  }

  return normalized;
}

function toFileStats(file: string, coverage: CoverageFile): FileStats {
  const statements = Object.values(coverage.s ?? {});
  const functions = Object.values(coverage.f ?? {});
  const branches = Object.values(coverage.b ?? {}).flat();

  const statementsCovered = coveredCount(statements);
  const functionsCovered = coveredCount(functions);
  const branchesCovered = coveredCount(branches);

  return {
    file,
    statementsTotal: statements.length,
    statementsCovered,
    statementsUncovered: statements.length - statementsCovered,
    statementsPct: percentage(statementsCovered, statements.length),
    functionsTotal: functions.length,
    functionsCovered,
    functionsUncovered: functions.length - functionsCovered,
    functionsPct: percentage(functionsCovered, functions.length),
    branchesTotal: branches.length,
    branchesCovered,
    branchesUncovered: branches.length - branchesCovered,
    branchesPct: percentage(branchesCovered, branches.length),
  };
}

function sumTotals(files: FileStats[]) {
  return files.reduce(
    (acc, file) => {
      acc.statementsTotal += file.statementsTotal;
      acc.statementsCovered += file.statementsCovered;
      acc.functionsTotal += file.functionsTotal;
      acc.functionsCovered += file.functionsCovered;
      acc.branchesTotal += file.branchesTotal;
      acc.branchesCovered += file.branchesCovered;
      return acc;
    },
    {
      statementsTotal: 0,
      statementsCovered: 0,
      functionsTotal: 0,
      functionsCovered: 0,
      branchesTotal: 0,
      branchesCovered: 0,
    },
  );
}

function printTotals(files: FileStats[]) {
  const totals = sumTotals(files);
  const statementsPct = percentage(totals.statementsCovered, totals.statementsTotal);
  const functionsPct = percentage(totals.functionsCovered, totals.functionsTotal);
  const branchesPct = percentage(totals.branchesCovered, totals.branchesTotal);

  console.log("Coverage Totals");
  console.log(
    `  Statements: ${statementsPct.toFixed(2)}% (${totals.statementsCovered}/${totals.statementsTotal})`,
  );
  console.log(
    `  Functions:  ${functionsPct.toFixed(2)}% (${totals.functionsCovered}/${totals.functionsTotal})`,
  );
  console.log(
    `  Branches:   ${branchesPct.toFixed(2)}% (${totals.branchesCovered}/${totals.branchesTotal})`,
  );
  console.log();
  console.log("Needed To Reach Global Thresholds");
  console.log(
    `  Statements ${thresholds.statements}%: +${neededToReach(
      thresholds.statements,
      totals.statementsCovered,
      totals.statementsTotal,
    )}`,
  );
  console.log(
    `  Functions ${thresholds.functions}%:  +${neededToReach(
      thresholds.functions,
      totals.functionsCovered,
      totals.functionsTotal,
    )}`,
  );
  console.log(
    `  Branches ${thresholds.branches}%:   +${neededToReach(
      thresholds.branches,
      totals.branchesCovered,
      totals.branchesTotal,
    )}`,
  );
  console.log();
}

function printTopLevelSummary(files: FileStats[], topFolders: number) {
  const grouped = new Map<
    string,
    {
      statementsTotal: number;
      statementsCovered: number;
      functionsTotal: number;
      functionsCovered: number;
      branchesTotal: number;
      branchesCovered: number;
      fileCount: number;
    }
  >();

  for (const file of files) {
    const key = file.file.includes("/") ? file.file.split("/")[0] : "(root)";
    const current = grouped.get(key) ?? {
      statementsTotal: 0,
      statementsCovered: 0,
      functionsTotal: 0,
      functionsCovered: 0,
      branchesTotal: 0,
      branchesCovered: 0,
      fileCount: 0,
    };
    current.statementsTotal += file.statementsTotal;
    current.statementsCovered += file.statementsCovered;
    current.functionsTotal += file.functionsTotal;
    current.functionsCovered += file.functionsCovered;
    current.branchesTotal += file.branchesTotal;
    current.branchesCovered += file.branchesCovered;
    current.fileCount += 1;
    grouped.set(key, current);
  }

  const rows = [...grouped.entries()]
    .map(([folder, totals]) => {
      const uncoveredStatements = totals.statementsTotal - totals.statementsCovered;
      return {
        folder,
        uncoveredStatements,
        statementsPct: percentage(totals.statementsCovered, totals.statementsTotal),
        functionsPct: percentage(totals.functionsCovered, totals.functionsTotal),
        branchesPct: percentage(totals.branchesCovered, totals.branchesTotal),
        fileCount: totals.fileCount,
      };
    })
    .sort((a, b) => b.uncoveredStatements - a.uncoveredStatements)
    .slice(0, topFolders);

  console.log(`Top ${rows.length} Folders by Uncovered Statements`);
  for (const row of rows) {
    console.log(
      `  ${String(row.uncoveredStatements).padStart(5)}  ${row.statementsPct.toFixed(1).padStart(6)}%  ${row.functionsPct.toFixed(1).padStart(6)}%  ${row.branchesPct.toFixed(1).padStart(6)}%  ${String(row.fileCount).padStart(4)}  ${row.folder}`,
    );
  }
  console.log();
}

function printTopFiles(files: FileStats[], topFiles: number) {
  const rows = [...files]
    .sort((a, b) => b.statementsUncovered - a.statementsUncovered)
    .slice(0, topFiles);

  console.log(`Top ${rows.length} Files by Uncovered Statements`);
  for (const row of rows) {
    console.log(
      `  ${String(row.statementsUncovered).padStart(4)}  ${row.statementsPct.toFixed(1).padStart(6)}%  ${row.functionsPct.toFixed(1).padStart(6)}%  ${row.branchesPct.toFixed(1).padStart(6)}%  ${row.file}`,
    );
  }
  console.log();
}

function main() {
  const repoRoot = path.resolve(process.cwd());
  const coveragePath = path.resolve(
    repoRoot,
    parseArg("--coverage", "coverage/coverage-final.json"),
  );
  const topFiles = parseIntArg("--top-files", 40);
  const topFolders = parseIntArg("--top-folders", 20);

  if (!fs.existsSync(coveragePath)) {
    console.error(`Coverage file not found: ${coveragePath}`);
    process.exitCode = 1;
    return;
  }

  const raw = fs.readFileSync(coveragePath, "utf8");
  const coverage = JSON.parse(raw) as Record<string, CoverageFile>;

  const files = Object.entries(coverage)
    .map(([absoluteFilePath, fileCoverage]) => {
      const relativePath = normalizePath(path.resolve(absoluteFilePath), repoRoot);
      return toFileStats(relativePath, fileCoverage);
    })
    .sort((a, b) => a.file.localeCompare(b.file));

  printTotals(files);
  printTopLevelSummary(files, topFolders);
  printTopFiles(files, topFiles);
}

main();

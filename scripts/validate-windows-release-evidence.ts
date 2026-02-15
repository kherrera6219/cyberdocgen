import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

interface EvidenceValidationOptions {
  evidenceRoot: string;
  strict: boolean;
}

interface EvidenceItemResult {
  name: string;
  status: "passed" | "failed";
  expected: string;
  actual: string;
  filePath?: string;
  sha256?: string;
}

interface EvidenceValidationSummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  failedItems: string[];
}

interface EvidenceValidationReport {
  generatedAt: string;
  options: EvidenceValidationOptions;
  summary: EvidenceValidationSummary;
  items: EvidenceItemResult[];
}

type EvidenceRequirement = {
  name: string;
  path: string;
  description: string;
};

const REQUIRED_FILES: EvidenceRequirement[] = [
  {
    name: "Signed Install Log",
    path: "signed-install.log",
    description: "Installer run log from signed NSIS package on clean VM",
  },
  {
    name: "Signed Uninstall Log",
    path: "signed-uninstall.log",
    description: "Uninstaller run log from signed NSIS package on clean VM",
  },
  {
    name: "Install Completion Screenshot",
    path: "screenshots/install-complete.png",
    description: "Screenshot of installer completion confirmation",
  },
  {
    name: "Uninstall Completion Screenshot",
    path: "screenshots/uninstall-complete.png",
    description: "Screenshot of uninstaller completion confirmation",
  },
  {
    name: "Start Menu Launch Screenshot",
    path: "screenshots/start-menu-launch.png",
    description: "Screenshot showing app launch from Start Menu",
  },
  {
    name: "Desktop Smoke Report",
    path: "desktop-smoke-report.json",
    description: "JSON output from scripts/windows-desktop-smoke.ps1",
  },
  {
    name: "Unsigned SmartScreen Screenshot",
    path: "screenshots/smartscreen-unsigned.png",
    description: "SmartScreen behavior for unsigned installer",
  },
  {
    name: "Signed SmartScreen Screenshot",
    path: "screenshots/smartscreen-signed.png",
    description: "SmartScreen behavior for signed installer",
  },
  {
    name: "Signature Verification Report",
    path: "signature-report.json",
    description: "JSON report from windows signature verification",
  },
];

export function parseArgs(argv: string[]): EvidenceValidationOptions {
  const options: EvidenceValidationOptions = {
    evidenceRoot: path.join(process.cwd(), "docs", "project-analysis", "evidence", "windows-release"),
    strict: false,
  };

  for (const arg of argv) {
    if (arg === "--strict") {
      options.strict = true;
      continue;
    }

    if (arg.startsWith("--evidence-root=")) {
      const value = arg.split("=")[1]?.trim();
      if (value) {
        options.evidenceRoot = path.resolve(value);
      }
    }
  }

  return options;
}

export function summarizeEvidence(items: EvidenceItemResult[]): EvidenceValidationSummary {
  const passedCount = items.filter((item) => item.status === "passed").length;
  const failedItems = items.filter((item) => item.status === "failed");

  return {
    passed: failedItems.length === 0,
    total: items.length,
    passedCount,
    failedCount: failedItems.length,
    failedItems: failedItems.map((item) => item.name),
  };
}

function hashFile(filePath: string): string {
  const fileContent = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileContent).digest("hex");
}

function resolveEvidenceDirectory(rootPath: string): string {
  if (!fs.existsSync(rootPath)) {
    return rootPath;
  }

  const entries = fs
    .readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (entries.length === 0) {
    return rootPath;
  }

  return path.join(rootPath, entries[entries.length - 1]);
}

function validateRequirement(evidenceDir: string, requirement: EvidenceRequirement): EvidenceItemResult {
  const absolutePath = path.join(evidenceDir, requirement.path);
  if (!fs.existsSync(absolutePath)) {
    return {
      name: requirement.name,
      status: "failed",
      expected: requirement.description,
      actual: `Missing file: ${requirement.path}`,
    };
  }

  return {
    name: requirement.name,
    status: "passed",
    expected: requirement.description,
    actual: "present",
    filePath: absolutePath,
    sha256: hashFile(absolutePath),
  };
}

function writeReport(
  evidenceDir: string,
  options: EvidenceValidationOptions,
  items: EvidenceItemResult[],
): string {
  const summary = summarizeEvidence(items);
  const report: EvidenceValidationReport = {
    generatedAt: new Date().toISOString(),
    options,
    summary,
    items,
  };

  const reportPath = path.join(evidenceDir, "evidence-manifest.json");
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf8");
  return reportPath;
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const evidenceDir = resolveEvidenceDirectory(options.evidenceRoot);

  const items = REQUIRED_FILES.map((requirement) => validateRequirement(evidenceDir, requirement));
  const summary = summarizeEvidence(items);
  const reportPath = writeReport(evidenceDir, options, items);

  console.log(`Windows release evidence report: ${reportPath}`);
  console.log(`Passed: ${summary.passedCount}`);
  console.log(`Failed: ${summary.failedCount}`);

  if (!summary.passed) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const currentPath = path.resolve(fileURLToPath(import.meta.url));

if (invokedPath && currentPath.toLowerCase() === invokedPath.toLowerCase()) {
  run().catch((error) => {
    console.error("Windows evidence validation failed unexpectedly:", error);
    process.exit(1);
  });
}

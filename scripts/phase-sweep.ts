import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

type StepStatus = "passed" | "failed" | "skipped";

interface SweepOptions {
  strictCloudEnv: boolean;
  skipWindowsValidate: boolean;
  cloudPort: number;
  localPort: number;
  timeoutMs: number;
  reportRoot: string;
}

export interface StepResult {
  name: string;
  status: StepStatus;
  durationMs: number;
  details?: string;
  command?: string;
  exitCode?: number;
  logFile?: string;
}

export interface SweepSummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  failedSteps: string[];
}

interface CommandResult {
  exitCode: number;
  durationMs: number;
  output: string;
}

interface SmokeRunConfig {
  mode: "cloud" | "local";
  port: number;
  timeoutMs: number;
  strictCloudEnv: boolean;
}

const DEFAULT_TIMEOUT_MS = 45_000;

export function parseArgs(argv: string[]): SweepOptions {
  const opts: SweepOptions = {
    strictCloudEnv: false,
    skipWindowsValidate: false,
    cloudPort: 5610,
    localPort: 5611,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    reportRoot: path.join(process.cwd(), "artifacts", "phase-sweeps"),
  };

  for (const arg of argv) {
    if (arg === "--strict-cloud-env") {
      opts.strictCloudEnv = true;
      continue;
    }
    if (arg === "--skip-windows-validate") {
      opts.skipWindowsValidate = true;
      continue;
    }
    if (arg.startsWith("--cloud-port=")) {
      opts.cloudPort = parsePositiveInt(arg.split("=")[1], opts.cloudPort);
      continue;
    }
    if (arg.startsWith("--local-port=")) {
      opts.localPort = parsePositiveInt(arg.split("=")[1], opts.localPort);
      continue;
    }
    if (arg.startsWith("--timeout-ms=")) {
      opts.timeoutMs = parsePositiveInt(arg.split("=")[1], opts.timeoutMs);
      continue;
    }
    if (arg.startsWith("--report-root=")) {
      const value = arg.split("=")[1]?.trim();
      if (value) {
        opts.reportRoot = path.resolve(value);
      }
    }
  }

  return opts;
}

export function summarizeResults(results: StepResult[]): SweepSummary {
  const passedCount = results.filter((r) => r.status === "passed").length;
  const failed = results.filter((r) => r.status === "failed");
  const skippedCount = results.filter((r) => r.status === "skipped").length;

  return {
    passed: failed.length === 0,
    total: results.length,
    passedCount,
    failedCount: failed.length,
    skippedCount,
    failedSteps: failed.map((r) => r.name),
  };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

function createReportDir(root: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(root, timestamp);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeForFileName(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function runCommand(command: string, env?: NodeJS.ProcessEnv): Promise<CommandResult> {
  const started = Date.now();

  return await new Promise<CommandResult>((resolve) => {
    const proc = spawn(command, {
      cwd: process.cwd(),
      shell: true,
      env: {
        ...process.env,
        ...env,
      },
      windowsHide: true,
    });

    let output = "";
    proc.stdout.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });
    proc.stderr.on("data", (chunk: Buffer) => {
      output += chunk.toString("utf8");
    });

    proc.on("error", (error) => {
      output += `\n[spawn-error] ${error.message}\n`;
    });

    proc.on("close", (code) => {
      resolve({
        exitCode: typeof code === "number" ? code : 1,
        durationMs: Date.now() - started,
        output,
      });
    });
  });
}

function writeLog(logFile: string, content: string): void {
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  fs.writeFileSync(logFile, content, "utf8");
}

async function runCommandStep(
  name: string,
  command: string,
  reportDir: string,
  env?: NodeJS.ProcessEnv,
): Promise<StepResult> {
  const logFile = path.join(reportDir, `${sanitizeForFileName(name)}.log`);
  const result = await runCommand(command, env);
  writeLog(logFile, result.output);

  return {
    name,
    status: result.exitCode === 0 ? "passed" : "failed",
    durationMs: result.durationMs,
    command,
    exitCode: result.exitCode,
    logFile,
    details: result.exitCode === 0 ? undefined : `Command failed with exit code ${result.exitCode}`,
  };
}

async function fetchHealth(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function terminateProcess(proc: ReturnType<typeof spawn>): Promise<void> {
  if (proc.exitCode !== null) {
    return;
  }

  proc.kill("SIGTERM");
  const deadline = Date.now() + 5_000;
  while (proc.exitCode === null && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (proc.exitCode === null) {
    proc.kill("SIGKILL");
  }
}

function missingCloudEnvVars(): string[] {
  const missing: string[] = [];
  const databaseUrl = process.env.DATABASE_URL;
  const sessionSecret = process.env.SESSION_SECRET;

  if (!databaseUrl || databaseUrl.trim().length === 0) {
    missing.push("DATABASE_URL");
  }

  if (!sessionSecret || sessionSecret.trim().length === 0) {
    missing.push("SESSION_SECRET");
  }

  return missing;
}

async function runSmokeStep(config: SmokeRunConfig, reportDir: string): Promise<StepResult> {
  const stepName = config.mode === "cloud" ? "Smoke Cloud Mode" : "Smoke Local Mode";
  const logFile = path.join(reportDir, `${sanitizeForFileName(stepName)}.log`);
  const started = Date.now();

  if (config.mode === "cloud") {
    const missingVars = missingCloudEnvVars();
    if (missingVars.length > 0) {
      const details = `Missing required cloud environment variables: ${missingVars.join(", ")}`;
      writeLog(logFile, details);
      return {
        name: stepName,
        status: config.strictCloudEnv ? "failed" : "skipped",
        durationMs: Date.now() - started,
        details,
        logFile,
      };
    }
  }

  const modeSpecificEnv: NodeJS.ProcessEnv =
    config.mode === "cloud"
      ? {
          DEPLOYMENT_MODE: "cloud",
        }
      : {
          DEPLOYMENT_MODE: "local",
          LOCAL_DATA_PATH: path.join(process.cwd(), "test-data", "phase-sweep-local"),
        };

  const proc = spawn("npx tsx server/index.ts", {
    cwd: process.cwd(),
    shell: true,
    env: {
      ...process.env,
      ...modeSpecificEnv,
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: String(config.port),
      LOCAL_PORT: String(config.port),
      ENABLE_DEV_ADMIN_BYPASS: "false",
      SKIP_TELEMETRY: "true",
    },
    windowsHide: true,
  });

  let output = "";
  proc.stdout.on("data", (chunk: Buffer) => {
    output += chunk.toString("utf8");
  });
  proc.stderr.on("data", (chunk: Buffer) => {
    output += chunk.toString("utf8");
  });
  proc.on("error", (error) => {
    output += `\n[spawn-error] ${error.message}\n`;
  });

  const baseUrl = `http://127.0.0.1:${config.port}`;
  let passed = false;
  let details = "";
  const timeoutAt = Date.now() + config.timeoutMs;
  const probeUrls = [`${baseUrl}/live`, `${baseUrl}/ready`];

  while (Date.now() < timeoutAt) {
    if (proc.exitCode !== null) {
      details = `Server exited early with code ${proc.exitCode}`;
      break;
    }

    const [liveOk, readyOk] = await Promise.all(probeUrls.map((url) => fetchHealth(url)));
    if (liveOk && readyOk) {
      passed = true;
      details = "Health probes passed for /live and /ready";
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (!passed && !details) {
    details = `Timeout waiting for health probes (${config.timeoutMs}ms)`;
  }

  await terminateProcess(proc);
  writeLog(logFile, output);

  return {
    name: stepName,
    status: passed ? "passed" : "failed",
    durationMs: Date.now() - started,
    details,
    logFile,
    command: "npx tsx server/index.ts",
    exitCode: proc.exitCode ?? undefined,
  };
}

function commandPlan(opts: SweepOptions): Array<{ name: string; command: string; skip?: boolean; skipReason?: string }> {
  return [
    { name: "Lint", command: "npm run lint" },
    { name: "Type Check", command: "npm run check" },
    { name: "Tests (Coverage)", command: "npm run test:run -- --coverage" },
    { name: "Audit (High)", command: "npm audit --audit-level=high" },
    {
      name: "Windows Validate",
      command: "npm run windows:validate",
      skip: opts.skipWindowsValidate,
      skipReason: "Skipped by --skip-windows-validate",
    },
  ];
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const reportDir = createReportDir(options.reportRoot);
  const results: StepResult[] = [];

  for (const step of commandPlan(options)) {
    if (step.skip) {
      results.push({
        name: step.name,
        status: "skipped",
        durationMs: 0,
        details: step.skipReason,
      });
      continue;
    }
    results.push(await runCommandStep(step.name, step.command, reportDir));
  }

  results.push(
    await runSmokeStep(
      {
        mode: "cloud",
        port: options.cloudPort,
        timeoutMs: options.timeoutMs,
        strictCloudEnv: options.strictCloudEnv,
      },
      reportDir,
    ),
  );

  results.push(
    await runSmokeStep(
      {
        mode: "local",
        port: options.localPort,
        timeoutMs: options.timeoutMs,
        strictCloudEnv: options.strictCloudEnv,
      },
      reportDir,
    ),
  );

  const summary = summarizeResults(results);
  const report = {
    generatedAt: new Date().toISOString(),
    options,
    summary,
    steps: results,
  };

  const reportFile = path.join(reportDir, "report.json");
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf8");

  const consoleSummary = [
    `Phase sweep report: ${reportFile}`,
    `Passed: ${summary.passedCount}`,
    `Failed: ${summary.failedCount}`,
    `Skipped: ${summary.skippedCount}`,
  ].join("\n");
  console.log(consoleSummary);

  if (!summary.passed) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const currentPath = path.resolve(fileURLToPath(import.meta.url));

if (invokedPath && currentPath.toLowerCase() === invokedPath.toLowerCase()) {
  run().catch((error) => {
    console.error("Phase sweep failed unexpectedly:", error);
    process.exit(1);
  });
}

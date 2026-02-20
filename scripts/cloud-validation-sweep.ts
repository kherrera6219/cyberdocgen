import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

type CheckStatus = "passed" | "failed" | "skipped";

interface CloudValidationOptions {
  strictEnv: boolean;
  port: number;
  timeoutMs: number;
  reportRoot: string;
}

export interface EndpointCheckResult {
  name: string;
  status: CheckStatus;
  expected: string;
  actual: string;
}

export interface CloudValidationSummary {
  passed: boolean;
  total: number;
  passedCount: number;
  failedCount: number;
  skippedCount: number;
  failedChecks: string[];
}

interface CloudValidationReport {
  generatedAt: string;
  options: CloudValidationOptions;
  summary: CloudValidationSummary;
  checks: EndpointCheckResult[];
  logFile: string;
}

const DEFAULT_TIMEOUT_MS = 45_000;

export function parseArgs(argv: string[]): CloudValidationOptions {
  const options: CloudValidationOptions = {
    strictEnv: false,
    port: 5620,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    reportRoot: path.join(process.cwd(), "artifacts", "cloud-validation"),
  };

  for (const arg of argv) {
    if (arg === "--strict-env") {
      options.strictEnv = true;
      continue;
    }

    if (arg.startsWith("--port=")) {
      options.port = parsePositiveInt(arg.split("=")[1], options.port);
      continue;
    }

    if (arg.startsWith("--timeout-ms=")) {
      options.timeoutMs = parsePositiveInt(arg.split("=")[1], options.timeoutMs);
      continue;
    }

    if (arg.startsWith("--report-root=")) {
      const value = arg.split("=")[1]?.trim();
      if (value) {
        options.reportRoot = path.resolve(value);
      }
    }
  }

  return options;
}

export function summarizeChecks(checks: EndpointCheckResult[]): CloudValidationSummary {
  const passedCount = checks.filter((check) => check.status === "passed").length;
  const failedChecks = checks.filter((check) => check.status === "failed");
  const skippedCount = checks.filter((check) => check.status === "skipped").length;

  return {
    passed: failedChecks.length === 0,
    total: checks.length,
    passedCount,
    failedCount: failedChecks.length,
    skippedCount,
    failedChecks: failedChecks.map((check) => check.name),
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
  const reportDir = path.join(root, timestamp);
  fs.mkdirSync(reportDir, { recursive: true });
  return reportDir;
}

function validateCloudEnvVars(): string[] {
  const issues: string[] = [];
  const databaseUrl = process.env.DATABASE_URL;
  const sessionSecret = process.env.SESSION_SECRET;
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const dataIntegritySecret = process.env.DATA_INTEGRITY_SECRET;

  if (!databaseUrl || databaseUrl.trim().length === 0) {
    issues.push("DATABASE_URL");
  }

  if (!sessionSecret || sessionSecret.trim().length < 32) {
    issues.push("SESSION_SECRET (min 32 chars)");
  }

  if (!encryptionKey || !/^[a-fA-F0-9]{64}$/.test(encryptionKey.trim())) {
    issues.push("ENCRYPTION_KEY (64-char hex)");
  }

  if (!dataIntegritySecret || dataIntegritySecret.trim().length < 32) {
    issues.push("DATA_INTEGRITY_SECRET (min 32 chars)");
  }

  return issues;
}

async function waitForReady(baseUrl: string, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const [live, ready] = await Promise.all([
        fetch(`${baseUrl}/live`),
        fetch(`${baseUrl}/ready`),
      ]);

      if (live.ok && ready.ok) {
        return true;
      }
    } catch {
      // Retry until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

async function terminateServer(server: ReturnType<typeof spawn>): Promise<void> {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");

  const deadline = Date.now() + 5_000;
  while (server.exitCode === null && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (server.exitCode === null) {
    server.kill("SIGKILL");
  }
}

async function runEndpointCheck(
  name: string,
  url: string,
  expected: string,
  validator: (statusCode: number) => boolean,
): Promise<EndpointCheckResult> {
  try {
    const response = await fetch(url);
    const actual = `HTTP ${response.status}`;
    return {
      name,
      status: validator(response.status) ? "passed" : "failed",
      expected,
      actual,
    };
  } catch (error) {
    return {
      name,
      status: "failed",
      expected,
      actual: error instanceof Error ? error.message : "request failed",
    };
  }
}

async function run(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const reportDir = createReportDir(options.reportRoot);
  const reportLogFile = path.join(reportDir, "cloud-validation.log");
  const reportJsonFile = path.join(reportDir, "report.json");
  const logs: string[] = [];

  const envIssues = validateCloudEnvVars();
  if (envIssues.length > 0) {
    const check: EndpointCheckResult = {
      name: "Cloud Environment Variables",
      status: options.strictEnv ? "failed" : "skipped",
      expected: "DATABASE_URL, SESSION_SECRET, ENCRYPTION_KEY, and DATA_INTEGRITY_SECRET are production-valid",
      actual: `Missing/invalid: ${envIssues.join(", ")}`,
    };

    const summary = summarizeChecks([check]);
    const report: CloudValidationReport = {
      generatedAt: new Date().toISOString(),
      options,
      summary,
      checks: [check],
      logFile: reportLogFile,
    };
    fs.writeFileSync(reportLogFile, `${check.actual}\n`, "utf8");
    fs.writeFileSync(reportJsonFile, JSON.stringify(report, null, 2), "utf8");

    console.log(`Cloud validation report: ${reportJsonFile}`);
    console.log(`Passed: ${summary.passedCount}`);
    console.log(`Failed: ${summary.failedCount}`);
    console.log(`Skipped: ${summary.skippedCount}`);

    if (!summary.passed) {
      process.exitCode = 1;
    }
    return;
  }

  const server = spawn("npx tsx server/index.ts", {
    cwd: process.cwd(),
    shell: true,
    windowsHide: true,
    env: {
      ...process.env,
      DEPLOYMENT_MODE: "cloud",
      NODE_ENV: "production",
      HOST: "127.0.0.1",
      PORT: String(options.port),
      LOCAL_PORT: String(options.port),
      ENABLE_DEV_ADMIN_BYPASS: "false",
      SKIP_TELEMETRY: "true",
    },
  });

  server.stdout.on("data", (chunk: Buffer) => {
    logs.push(chunk.toString("utf8"));
  });
  server.stderr.on("data", (chunk: Buffer) => {
    logs.push(chunk.toString("utf8"));
  });
  server.on("error", (error) => {
    logs.push(`[spawn-error] ${error.message}`);
  });

  const baseUrl = `http://127.0.0.1:${options.port}`;
  const ready = await waitForReady(baseUrl, options.timeoutMs);
  const checks: EndpointCheckResult[] = [
    {
      name: "Server Readiness",
      status: ready ? "passed" : "failed",
      expected: `/live and /ready return HTTP 200 within ${options.timeoutMs}ms`,
      actual: ready ? "ready" : "timeout waiting for readiness",
    },
  ];

  if (ready) {
    checks.push(
      await runEndpointCheck(
        "System Health Endpoint",
        `${baseUrl}/health`,
        "HTTP 200 or HTTP 503",
        (statusCode) => statusCode === 200 || statusCode === 503,
      ),
    );

    checks.push(
      await runEndpointCheck(
        "AI Health Endpoint",
        `${baseUrl}/api/ai/health`,
        "HTTP 200",
        (statusCode) => statusCode === 200,
      ),
    );

    checks.push(
      await runEndpointCheck(
        "Cloud Auth Endpoint Protection",
        `${baseUrl}/api/auth/user`,
        "HTTP 401 or HTTP 403",
        (statusCode) => statusCode === 401 || statusCode === 403,
      ),
    );

    checks.push(
      await runEndpointCheck(
        "Local API Gate In Cloud Mode",
        `${baseUrl}/api/local/api-keys/configured`,
        "HTTP 401, HTTP 403, or HTTP 404",
        (statusCode) => statusCode === 401 || statusCode === 403 || statusCode === 404,
      ),
    );
  } else {
    checks.push({
      name: "Endpoint Checks",
      status: "skipped",
      expected: "Run endpoint checks after readiness",
      actual: "Skipped because readiness failed",
    });
  }

  await terminateServer(server);

  fs.writeFileSync(reportLogFile, logs.join(""), "utf8");

  const summary = summarizeChecks(checks);
  const report: CloudValidationReport = {
    generatedAt: new Date().toISOString(),
    options,
    summary,
    checks,
    logFile: reportLogFile,
  };
  fs.writeFileSync(reportJsonFile, JSON.stringify(report, null, 2), "utf8");

  console.log(`Cloud validation report: ${reportJsonFile}`);
  console.log(`Passed: ${summary.passedCount}`);
  console.log(`Failed: ${summary.failedCount}`);
  console.log(`Skipped: ${summary.skippedCount}`);

  if (!summary.passed) {
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const currentPath = path.resolve(fileURLToPath(import.meta.url));

if (invokedPath && currentPath.toLowerCase() === invokedPath.toLowerCase()) {
  run().catch((error) => {
    console.error("Cloud validation sweep failed unexpectedly:", error);
    process.exit(1);
  });
}

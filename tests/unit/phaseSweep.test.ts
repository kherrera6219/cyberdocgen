import { describe, expect, it } from "vitest";
import { parseArgs, summarizeResults, type StepResult } from "../../scripts/phase-sweep";

describe("phase-sweep parseArgs", () => {
  it("uses defaults when no args are provided", () => {
    const result = parseArgs([]);

    expect(result.strictCloudEnv).toBe(false);
    expect(result.skipWindowsValidate).toBe(false);
    expect(result.cloudPort).toBe(5610);
    expect(result.localPort).toBe(5611);
    expect(result.timeoutMs).toBe(45000);
  });

  it("parses override flags", () => {
    const result = parseArgs([
      "--strict-cloud-env",
      "--skip-windows-validate",
      "--cloud-port=5900",
      "--local-port=5901",
      "--timeout-ms=12345",
      "--report-root=./tmp/sweep-reports",
    ]);

    expect(result.strictCloudEnv).toBe(true);
    expect(result.skipWindowsValidate).toBe(true);
    expect(result.cloudPort).toBe(5900);
    expect(result.localPort).toBe(5901);
    expect(result.timeoutMs).toBe(12345);
    expect(result.reportRoot.endsWith("tmp\\sweep-reports") || result.reportRoot.endsWith("tmp/sweep-reports")).toBe(
      true,
    );
  });

  it("ignores invalid numeric values and keeps defaults", () => {
    const result = parseArgs(["--cloud-port=-1", "--local-port=abc", "--timeout-ms=0"]);

    expect(result.cloudPort).toBe(5610);
    expect(result.localPort).toBe(5611);
    expect(result.timeoutMs).toBe(45000);
  });
});

describe("phase-sweep summarizeResults", () => {
  it("fails summary when any step failed", () => {
    const steps: StepResult[] = [
      { name: "Lint", status: "passed", durationMs: 10 },
      { name: "Type Check", status: "failed", durationMs: 20 },
      { name: "Cloud Smoke", status: "skipped", durationMs: 0 },
    ];

    const summary = summarizeResults(steps);
    expect(summary.passed).toBe(false);
    expect(summary.failedCount).toBe(1);
    expect(summary.failedSteps).toEqual(["Type Check"]);
    expect(summary.skippedCount).toBe(1);
  });

  it("passes summary when there are no failed steps", () => {
    const steps: StepResult[] = [
      { name: "Lint", status: "passed", durationMs: 10 },
      { name: "Cloud Smoke", status: "skipped", durationMs: 0 },
      { name: "Local Smoke", status: "passed", durationMs: 30 },
    ];

    const summary = summarizeResults(steps);
    expect(summary.passed).toBe(true);
    expect(summary.failedCount).toBe(0);
    expect(summary.failedSteps).toEqual([]);
    expect(summary.passedCount).toBe(2);
  });
});


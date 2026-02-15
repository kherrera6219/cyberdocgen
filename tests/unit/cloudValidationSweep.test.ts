import { describe, expect, it } from "vitest";
import {
  parseArgs,
  summarizeChecks,
  type EndpointCheckResult,
} from "../../scripts/cloud-validation-sweep";

describe("cloud-validation-sweep parseArgs", () => {
  it("uses defaults when args are omitted", () => {
    const options = parseArgs([]);

    expect(options.strictEnv).toBe(false);
    expect(options.port).toBe(5620);
    expect(options.timeoutMs).toBe(45000);
  });

  it("parses strict-env and numeric overrides", () => {
    const options = parseArgs([
      "--strict-env",
      "--port=7000",
      "--timeout-ms=120000",
      "--report-root=./tmp/cloud",
    ]);

    expect(options.strictEnv).toBe(true);
    expect(options.port).toBe(7000);
    expect(options.timeoutMs).toBe(120000);
    expect(options.reportRoot.endsWith("tmp\\cloud") || options.reportRoot.endsWith("tmp/cloud")).toBe(
      true,
    );
  });

  it("ignores invalid numeric overrides", () => {
    const options = parseArgs(["--port=0", "--timeout-ms=abc"]);

    expect(options.port).toBe(5620);
    expect(options.timeoutMs).toBe(45000);
  });
});

describe("cloud-validation-sweep summarizeChecks", () => {
  it("reports failures when any check failed", () => {
    const checks: EndpointCheckResult[] = [
      { name: "Server Readiness", status: "passed", expected: "ready", actual: "ready" },
      { name: "Auth Protection", status: "failed", expected: "401", actual: "200" },
      { name: "Local API Gate", status: "skipped", expected: "403", actual: "skipped" },
    ];

    const summary = summarizeChecks(checks);
    expect(summary.passed).toBe(false);
    expect(summary.failedCount).toBe(1);
    expect(summary.skippedCount).toBe(1);
    expect(summary.failedChecks).toEqual(["Auth Protection"]);
  });

  it("passes when there are no failed checks", () => {
    const checks: EndpointCheckResult[] = [
      { name: "Server Readiness", status: "passed", expected: "ready", actual: "ready" },
      { name: "System Health", status: "passed", expected: "200", actual: "200" },
      { name: "Optional Probe", status: "skipped", expected: "200", actual: "skipped" },
    ];

    const summary = summarizeChecks(checks);
    expect(summary.passed).toBe(true);
    expect(summary.failedCount).toBe(0);
    expect(summary.passedCount).toBe(2);
    expect(summary.failedChecks).toEqual([]);
  });
});

import { describe, expect, it } from "vitest";
import {
  parseArgs,
  summarizeEvidence,
} from "../../scripts/validate-windows-release-evidence";

describe("validate-windows-release-evidence parseArgs", () => {
  it("uses defaults when args are omitted", () => {
    const options = parseArgs([]);

    expect(options.strict).toBe(false);
    expect(options.evidenceRoot.endsWith("docs\\project-analysis\\evidence\\windows-release")
      || options.evidenceRoot.endsWith("docs/project-analysis/evidence/windows-release")).toBe(true);
  });

  it("parses strict mode and custom evidence root", () => {
    const options = parseArgs([
      "--strict",
      "--evidence-root=./tmp/windows-evidence",
    ]);

    expect(options.strict).toBe(true);
    expect(
      options.evidenceRoot.endsWith("tmp\\windows-evidence") ||
      options.evidenceRoot.endsWith("tmp/windows-evidence"),
    ).toBe(true);
  });
});

describe("validate-windows-release-evidence summarizeEvidence", () => {
  it("fails when any evidence item failed", () => {
    const summary = summarizeEvidence([
      { name: "Install Log", status: "passed", expected: "present", actual: "present" },
      { name: "SmartScreen Signed", status: "failed", expected: "present", actual: "missing" },
    ]);

    expect(summary.passed).toBe(false);
    expect(summary.failedCount).toBe(1);
    expect(summary.failedItems).toEqual(["SmartScreen Signed"]);
  });

  it("passes when all evidence items are present", () => {
    const summary = summarizeEvidence([
      { name: "Install Log", status: "passed", expected: "present", actual: "present" },
      { name: "Uninstall Log", status: "passed", expected: "present", actual: "present" },
    ]);

    expect(summary.passed).toBe(true);
    expect(summary.failedCount).toBe(0);
    expect(summary.passedCount).toBe(2);
  });
});

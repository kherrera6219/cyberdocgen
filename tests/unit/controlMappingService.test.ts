import { describe, expect, it } from "vitest";
import { AppError } from "../../server/utils/errorHandling";
import {
  controlMappingService,
  type ControlFinding,
} from "../../server/services/controlMappingService";
import type { CodeSignals } from "../../server/services/codeSignalDetectorService";

function buildSignals(): CodeSignals {
  return {
    auth: [
      {
        type: "mfa",
        confidence: "high",
        details: "MFA middleware detected",
        files: [
          {
            path: "server/auth/mfa.ts",
            lineNumbers: [10, 25],
            evidence: "verifyTOTP()",
          },
        ],
      },
    ],
    encryption: [
      {
        type: "at_rest",
        algorithm: "AES-256",
        confidence: "high",
        details: "DB encryption configured",
        files: [
          {
            path: "server/security/encryption.ts",
            lineNumbers: [20],
            evidence: "encrypt(payload)",
          },
        ],
      },
    ],
    logging: [
      {
        type: "audit",
        framework: "winston",
        confidence: "high",
        details: "audit logs present",
        files: [
          {
            path: "server/services/auditService.ts",
            lineNumbers: [50],
            evidence: "logAuditEvent()",
          },
        ],
      },
    ],
    accessControl: [
      {
        type: "rbac",
        confidence: "medium",
        details: "role checks found",
        files: [
          {
            path: "server/replitAuth.ts",
            lineNumbers: [300],
            evidence: "requirePermission",
          },
        ],
      },
    ],
    cicd: [
      {
        type: "github_actions",
        hasSecurityScanning: true,
        hasSecretScanning: true,
        hasDependencyScanning: true,
        confidence: "high",
        details: "workflow with scanning",
        files: [
          {
            path: ".github/workflows/ci.yml",
            evidence: "trivy + npm audit",
          },
        ],
      },
    ],
    secretsWarnings: [],
    scannedFiles: 20,
    skippedFiles: 1,
  };
}

function controls(findings: ControlFinding[]) {
  return findings.map(f => f.controlId);
}

describe("controlMappingService", () => {
  it("maps SOC2 signals to expected controls", async () => {
    const findings = await controlMappingService.mapSignalsToControls(buildSignals(), "SOC2");
    const ids = controls(findings);

    expect(ids).toContain("CC6.1");
    expect(ids).toContain("CC6.2");
    expect(ids).toContain("CC6.6");
    expect(ids).toContain("CC7.3");
    expect(ids).toContain("CC6.3");
    expect(ids).toContain("CC8.1");
    expect(findings.every(f => f.framework === "SOC2")).toBe(true);
  });

  it("maps ISO27001 signals to expected controls", async () => {
    const findings = await controlMappingService.mapSignalsToControls(buildSignals(), "ISO27001");
    const ids = controls(findings);

    expect(ids).toContain("A.9.2.1");
    expect(ids).toContain("A.10.1.1");
    expect(ids).toContain("A.12.4.1");
    expect(ids).toContain("A.9.4.1");
    expect(ids).toContain("A.14.2.2");
  });

  it("maps NIST signals to expected controls", async () => {
    const findings = await controlMappingService.mapSignalsToControls(buildSignals(), "NIST80053");
    const ids = controls(findings);

    expect(ids).toContain("IA-2");
    expect(ids).toContain("IA-2(1)");
    expect(ids).toContain("SC-28");
    expect(ids).toContain("AU-2");
    expect(ids).toContain("AC-3");
    expect(ids).toContain("CM-3");
  });

  it("returns no findings for unsupported framework mappings", async () => {
    const findings = await controlMappingService.mapSignalsToControls(buildSignals(), "FEDRAMP");
    expect(findings).toEqual([]);
  });

  it("throws AppError when signal mapping fails", async () => {
    const badSignals = buildSignals();
    // Force runtime error in mapping to validate catch path.
    badSignals.auth[0].files = undefined as any;

    await expect(controlMappingService.mapSignalsToControls(badSignals, "SOC2")).rejects.toBeInstanceOf(
      AppError,
    );
    await expect(controlMappingService.mapSignalsToControls(badSignals, "SOC2")).rejects.toThrow(
      /mapping failed/i,
    );
  });

  it("covers auth recommendation variants", () => {
    const svc = controlMappingService as any;

    expect(svc.generateAuthRecommendation({ type: "jwt" })).toMatch(/JWT/i);
    expect(svc.generateAuthRecommendation({ type: "oauth" })).toMatch(/OAuth/i);
    expect(svc.generateAuthRecommendation({ type: "session" })).toMatch(/sessions/i);
    expect(svc.generateAuthRecommendation({ type: "mfa" })).toMatch(/MFA/i);
    expect(svc.generateAuthRecommendation({ type: "saml" })).toMatch(/SAML/i);
    expect(svc.generateAuthRecommendation({ type: "api_key" })).toMatch(/authentication mechanism/i);
  });

  it("covers encryption recommendation variants", () => {
    const svc = controlMappingService as any;

    expect(svc.generateEncryptionRecommendation({ type: "at_rest" })).toMatch(/key management/i);
    expect(svc.generateEncryptionRecommendation({ type: "in_transit" })).toMatch(/TLS/i);
    expect(svc.generateEncryptionRecommendation({ type: "hashing" })).toMatch(/hashing/i);
    expect(svc.generateEncryptionRecommendation({ type: "key_management" })).toMatch(/HSM|KMS/i);
  });
});

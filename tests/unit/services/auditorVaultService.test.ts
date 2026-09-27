import { describe, it, expect } from "vitest";
import crypto from "crypto";
import { auditorVaultService, type AuditorVaultData } from "../../../server/services/auditorVaultService";
import { webauthnSignoffService } from "../../../server/services/webauthnSignoffService";

describe("AuditorVault & WebAuthn Sign-Off Service", () => {
  const documentId = "doc-soc2-ssp-001";
  const version = "2.1.0";
  const content = "# SOC 2 Type II System Description\nAll systems require MFA.";

  it("should compute canonical document content hash", () => {
    const hash = webauthnSignoffService.computeDocumentHash(content, documentId, version);
    expect(hash).toHaveLength(64); // SHA-256 hex string

    // Consistent hashing
    const hash2 = webauthnSignoffService.computeDocumentHash(content, documentId, version);
    expect(hash).toBe(hash2);
  });

  it("should create and verify cryptographic signature manifests", () => {
    // Generate test EC keypair
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "prime256v1",
      publicKeyEncoding: { type: "spki", format: "pem" },
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
    });

    const contentHash = webauthnSignoffService.computeDocumentHash(content, documentId, version);

    // Sign the hash
    const signer = crypto.createSign("SHA256");
    signer.update(contentHash);
    signer.end();
    const signatureHex = signer.sign(privateKey).toString("hex");

    const manifest = webauthnSignoffService.createSignatureManifest(
      {
        documentId,
        version,
        contentHash,
        signerUserId: "user-ciso-1",
        signerEmail: "ciso@enterprise.com",
        signerRole: "Chief Information Security Officer",
        timestamp: new Date().toISOString(),
      },
      signatureHex,
      "ES256"
    );

    expect(manifest.signatureId).toMatch(/^sig-/);
    expect(manifest.signer.email).toBe("ciso@enterprise.com");
    expect(manifest.contentHash).toBe(contentHash);

    // Verify signature
    const isValid = webauthnSignoffService.verifySignature(
      contentHash,
      signatureHex,
      publicKey,
      "ES256"
    );
    expect(isValid).toBe(true);

    // Tampered verification
    const isTamperedValid = webauthnSignoffService.verifySignature(
      "tampered-content-hash",
      signatureHex,
      publicKey,
      "ES256"
    );
    expect(isTamperedValid).toBe(false);
  });

  it("should generate self-contained, zero-dependency HTML Auditor Vault package", () => {
    const vaultData: AuditorVaultData = {
      documentId,
      documentTitle: "SOC 2 Type II System Security Plan",
      framework: "SOC2",
      version,
      organizationName: "CyberDocGen Enterprise",
      generatedAt: new Date().toISOString(),
      contentMarkdown: content,
      signatures: [
        {
          signatureId: "sig-test-1",
          documentId,
          version,
          algorithm: "ES256",
          contentHash: "hash123",
          signatureHex: "abcdef",
          signer: {
            userId: "u1",
            email: "ciso@cyberdocgen.dev",
            role: "CISO",
          },
          signedAt: new Date().toISOString(),
          verified: true,
        },
      ],
      evidence: [
        {
          id: "ev-01",
          fileName: "aws-iam-mfa-report.csv",
          fileType: "csv",
          sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          fileSizeBytes: 2048,
          uploadedAt: new Date().toISOString(),
          controlsCovered: ["CC6.1", "CC6.2"],
        },
      ],
      controls: [
        {
          controlId: "CC6.1",
          framework: "SOC2",
          title: "Logical Access Controls",
          status: "implemented",
          implementationNarrative: "MFA is enforced on all administrative accounts.",
          evidenceIds: ["ev-01"],
        },
      ],
    };

    const html = auditorVaultService.generateStandaloneVaultHtml(vaultData);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("SOC 2 Type II System Security Plan");
    expect(html).toContain("Cryptographically Sealed");
    expect(html).toContain("CC6.1");
    expect(html).toContain("aws-iam-mfa-report.csv");
    expect(html).toContain("ciso@cyberdocgen.dev");
    expect(html).toContain("exportFindings");
  });
});

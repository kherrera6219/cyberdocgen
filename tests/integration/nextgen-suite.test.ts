import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import { registerRoutes } from "../../server/routes";

const testAuth = {
  userId: "user-nextgen-1",
  organizationId: "org-nextgen-1",
};

vi.mock("../../server/replitAuth", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    isAuthenticated: (req: any, _res: any, next: any) => {
      req.session = req.session || {};
      req.session.userId = testAuth.userId;
      req.session.organizationId = testAuth.organizationId;
      req.user = { id: testAuth.userId, email: "admin@enterprise.dev", organizationId: testAuth.organizationId };
      next();
    },
    getRequiredUserId: () => testAuth.userId,
    getUserId: () => testAuth.userId,
  };
});

vi.mock("../../server/middleware/multiTenant", async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    requireOrganization: (req: any, _res: any, next: any) => {
      req.organizationId = testAuth.organizationId;
      next();
    },
  };
});

describe("Next-Gen Enterprise Features Integration Suite", () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(async () => {
    if (server && typeof server.close === "function") {
      server.close();
    }
  });

  describe("POST /api/oscal/ssp/generate", () => {
    it("should generate and validate an OSCAL 1.1 SSP", async () => {
      const response = await request(app)
        .post("/api/oscal/ssp/generate")
        .send({
          systemName: "Enterprise Portal",
          systemShortName: "ENT-PORTAL",
          description: "High-security customer portal",
          securityLevel: "moderate",
          framework: "FedRAMP-Moderate",
          companyName: "Acme Corp",
          controls: [
            {
              controlId: "AC-1",
              title: "Access Control Policy",
              implementationNarrative: "Policy is reviewed annually by CISO.",
              status: "implemented",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.ssp["system-security-plan"]).toBeDefined();
      expect(response.body.data.validation.valid).toBe(true);
    });
  });

  describe("POST /api/drift/analyze", () => {
    it("should detect infrastructure drift against documented claims", async () => {
      const response = await request(app)
        .post("/api/drift/analyze")
        .send({
          terraformHcl: `
            resource "aws_s3_bucket" "prod_vault" {
              bucket = "acme-prod-vault"
            }
          `,
          controlStatements: [
            {
              controlId: "SC-13",
              framework: "SOC2",
              claim: "All S3 buckets are encrypted.",
            },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalResourcesAnalyzed).toBe(1);
      expect(response.body.data.driftCount).toBe(1);
      expect(response.body.data.findings[0].driftType).toBe("unencrypted_resource");
    });
  });

  describe("POST /api/policy-as-code/synthesize", () => {
    it("should synthesize OPA Rego rules and Terraform assertions", async () => {
      const response = await request(app)
        .post("/api/policy-as-code/synthesize")
        .send({
          framework: "FedRAMP",
          packageName: "acme_core",
          statements: [
            {
              id: "RULE-01",
              ruleTitle: "Enforce S3 Encryption",
              policyStatement: "S3 buckets must be encrypted.",
              domain: "storage_encryption",
              severity: "high",
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.regoRules).toContain("package compliance.acme_core");
      expect(response.body.data.terraformTestBlock).toContain("verify_rule-01");
    });
  });

  describe("POST /api/auditor-vault/sign and /export", () => {
    it("should sign a document version and export the standalone Auditor Vault", async () => {
      // 1. Sign
      const signResponse = await request(app)
        .post("/api/auditor-vault/sign")
        .send({
          documentId: "doc-123",
          version: "1.0.0",
          content: "# System Description\nAll secure.",
          signatureHex: "abcd1234ef5678",
          signerRole: "CISO",
        });

      expect(signResponse.status).toBe(201);
      expect(signResponse.body.success).toBe(true);
      expect(signResponse.body.data.signatureId).toBeDefined();

      // 2. Export Vault
      const exportResponse = await request(app)
        .post("/api/auditor-vault/export")
        .send({
          documentId: "doc-123",
          documentTitle: "FedRAMP System Security Plan",
          framework: "FedRAMP",
          version: "1.0.0",
          organizationName: "Acme Corp",
          generatedAt: new Date().toISOString(),
          contentMarkdown: "# System Description\nAll secure.",
          signatures: [signResponse.body.data],
          evidence: [],
          controls: [],
        });

      expect(exportResponse.status).toBe(200);
      expect(exportResponse.headers["content-type"]).toContain("text/html");
      expect(exportResponse.text).toContain("Auditor Vault - FedRAMP System Security Plan");
    });
  });
});

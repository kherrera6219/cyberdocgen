import { describe, it, expect } from "vitest";
import { policyAsCodeService, type PolicyRuleStatement } from "../../../server/services/policyAsCodeService";

describe("PolicyAsCodeService", () => {
  const sampleStatements: PolicyRuleStatement[] = [
    {
      id: "SEC-01",
      ruleTitle: "Enforce S3 Server-Side Encryption",
      policyStatement: "All S3 buckets must enforce AES-256 or KMS encryption.",
      domain: "storage_encryption",
      severity: "high",
    },
    {
      id: "SEC-02",
      ruleTitle: "Restrict Inbound Security Group Traffic",
      policyStatement: "Security groups must not allow open 0.0.0.0/0 ingress.",
      domain: "network_ingress",
      severity: "critical",
    },
    {
      id: "SEC-03",
      ruleTitle: "Enforce Database Backup Retention",
      policyStatement: "Relational databases must retain automated backups for at least 7 days.",
      domain: "database_backups",
      severity: "medium",
    },
  ];

  it("should synthesize OPA Rego rules, Terraform tests, and CI/CD workflow", () => {
    const bundle = policyAsCodeService.synthesizeBundle(
      "SOC2-FedRAMP",
      "cyberdocgen_production",
      sampleStatements
    );

    expect(bundle.framework).toBe("SOC2-FedRAMP");
    expect(bundle.packageName).toBe("cyberdocgen_production");
    expect(bundle.ruleCount).toBe(3);

    // OPA Rego Assertions
    expect(bundle.regoRules).toContain("package compliance.cyberdocgen_production");
    expect(bundle.regoRules).toContain("default allow = false");
    expect(bundle.regoRules).toContain('resource.type == "aws_s3_bucket"');
    expect(bundle.regoRules).toContain('resource.type == "aws_security_group"');
    expect(bundle.regoRules).toContain('resource.type == "aws_db_instance"');

    // Terraform Test Blocks
    expect(bundle.terraformTestBlock).toContain('run "verify_sec-01_s3_encryption"');
    expect(bundle.terraformTestBlock).toContain('run "verify_sec-02_restricted_ingress"');
    expect(bundle.terraformTestBlock).toContain('run "verify_sec-03_db_retention"');

    // CI/CD Workflow
    expect(bundle.githubActionsWorkflow).toContain("open-policy-agent/setup-opa");
    expect(bundle.githubActionsWorkflow).toContain("terraform plan");
  });
});

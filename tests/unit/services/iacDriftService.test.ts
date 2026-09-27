import { describe, it, expect } from "vitest";
import { iacDriftService } from "../../../server/services/iacDriftService";

describe("IacDriftService", () => {
  const sampleTfState = JSON.stringify({
    format_version: "1.0",
    resources: [
      {
        type: "aws_s3_bucket",
        name: "customer_data",
        instances: [
          {
            attributes: {
              id: "cdg-prod-customer-data",
              arn: "arn:aws:s3:::cdg-prod-customer-data",
              bucket: "cdg-prod-customer-data",
              server_side_encryption_configuration: null, // Unencrypted bucket!
            },
          },
        ],
      },
      {
        type: "aws_security_group",
        name: "web_sg",
        instances: [
          {
            attributes: {
              id: "sg-12345",
              name: "web-sg",
              has_open_ingress: true, // Open to 0.0.0.0/0
            },
          },
        ],
      },
      {
        type: "aws_db_instance",
        name: "main_postgres",
        instances: [
          {
            attributes: {
              id: "rds-main",
              name: "main_postgres",
              storage_encrypted: true,
            },
          },
        ],
      },
    ],
  });

  const sampleHcl = `
resource "aws_s3_bucket" "audit_logs" {
  bucket = "cdg-audit-logs"
  encrypted = true
}

resource "aws_security_group" "bastion" {
  name = "bastion-sg"
  ingress {
    cidr_blocks = ["0.0.0.0/0"]
  }
}
`;

  it("should parse Terraform state JSON and extract typed cloud resources", () => {
    const resources = iacDriftService.parseTerraformState(sampleTfState);
    expect(resources.length).toBe(3);
    expect(resources[0].type).toBe("aws_s3_bucket");
    expect(resources[0].name).toBe("customer_data");
    expect(resources[1].type).toBe("aws_security_group");
    expect(resources[2].type).toBe("aws_db_instance");
  });

  it("should parse Terraform HCL blocks", () => {
    const resources = iacDriftService.parseTerraformHcl(sampleHcl);
    expect(resources.length).toBe(2);
    expect(resources[0].name).toBe("audit_logs");
    expect(resources[0].attributes.encrypted).toBe(true);
    expect(resources[1].name).toBe("bastion");
    expect(resources[1].attributes.has_open_ingress).toBe(true);
  });

  it("should detect configuration drift against documented compliance claims", () => {
    const resources = iacDriftService.parseTerraformState(sampleTfState);
    const controlClaims = [
      {
        controlId: "SC-13",
        framework: "NIST-SP-800-53",
        claim: "All storage buckets enforce AES-256 server-side encryption.",
      },
      {
        controlId: "SC-7",
        framework: "NIST-SP-800-53",
        claim: "Network ingress is restricted to authorized administrative VPN CIDRs.",
      },
    ];

    const report = iacDriftService.analyzeDrift(resources, controlClaims);

    expect(report.totalResourcesAnalyzed).toBe(3);
    expect(report.driftCount).toBe(2); // S3 unencrypted + SG open ingress
    expect(report.findings[0].driftType).toBe("unencrypted_resource");
    expect(report.findings[0].controlId).toBe("SC-13");
    expect(report.findings[0].proposedDocumentationDiff.suggestedText).toContain("[DRIFT NOTED");

    expect(report.findings[1].driftType).toBe("open_ingress");
    expect(report.findings[1].severity).toBe("critical");
    expect(report.complianceScore).toBeLessThan(100);
  });
});

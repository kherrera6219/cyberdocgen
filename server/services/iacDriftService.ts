/**
 * Living SSP & IaC / Terraform Drift Detection Engine
 * 
 * Ingests Terraform HCL and State files, extracts security posture,
 * checks for divergence against active control claims, and produces
 * automated documentation patches with AI diffs.
 */

import { logger } from "../utils/logger";

export interface ParsedCloudResource {
  id: string;
  type: string;
  name: string;
  provider: "aws" | "azure" | "gcp";
  attributes: Record<string, any>;
}

export interface DriftFinding {
  id: string;
  controlId: string;
  framework: string;
  resourceId: string;
  resourceType: string;
  driftType: "unencrypted_resource" | "open_ingress" | "logging_disabled" | "retention_mismatch" | "missing_mfa" | "insecure_transport";
  severity: "critical" | "high" | "medium" | "low";
  documentedClaim: string;
  actualState: string;
  suggestedRemediation: string;
  proposedDocumentationDiff: {
    originalText: string;
    suggestedText: string;
  };
}

export interface DriftAnalysisReport {
  timestamp: string;
  totalResourcesAnalyzed: number;
  driftCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  findings: DriftFinding[];
  complianceScore: number; // 0 - 100
}

export class IacDriftService {
  /**
   * Parse Terraform JSON state format (.tfstate)
   */
  parseTerraformState(stateJsonString: string): ParsedCloudResource[] {
    try {
      const state = JSON.parse(stateJsonString);
      const resources: ParsedCloudResource[] = [];

      if (!state.resources || !Array.isArray(state.resources)) {
        return resources;
      }

      for (const res of state.resources) {
        const type: string = res.type || "";
        const name: string = res.name || "";
        const provider: "aws" | "azure" | "gcp" = type.startsWith("aws_")
          ? "aws"
          : type.startsWith("azurerm_")
          ? "azure"
          : "gcp";

        if (Array.isArray(res.instances)) {
          for (let i = 0; i < res.instances.length; i++) {
            const inst = res.instances[i];
            const attrs = inst.attributes || {};
            resources.push({
              id: attrs.id || attrs.arn || `${type}.${name}[${i}]`,
              type,
              name,
              provider,
              attributes: attrs,
            });
          }
        }
      }

      return resources;
    } catch (error) {
      logger.error("[IacDriftService] Failed to parse terraform state JSON:", error);
      throw new Error(`Invalid Terraform state JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Parse simple Terraform HCL string to detect key declared resource blocks
   */
  parseTerraformHcl(hclContent: string): ParsedCloudResource[] {
    const resources: ParsedCloudResource[] = [];
    const resourceRegex = /resource\s+"([^"]+)"\s+"([^"]+)"\s+\{([^}]+)\}/gs;
    let match: RegExpExecArray | null;

    while ((match = resourceRegex.exec(hclContent)) !== null) {
      const type = match[1];
      const name = match[2];
      const body = match[3];

      const attributes: Record<string, any> = {};

      // Basic regex attribute extraction
      const lines = body.split("\n");
      for (const line of lines) {
        const parts = line.split("=");
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join("=").trim().replace(/[",]/g, "");
          if (key && val) {
            attributes[key] = val;
          }
        }
      }

      // Check specific flags in body
      if (body.includes("encrypted = true") || body.includes("sse_algorithm")) {
        attributes.encrypted = true;
      }
      if (body.includes("0.0.0.0/0")) {
        attributes.has_open_ingress = true;
      }

      resources.push({
        id: `${type}.${name}`,
        type,
        name,
        provider: type.startsWith("aws_") ? "aws" : "azure",
        attributes,
      });
    }

    return resources;
  }

  /**
   * Analyze cloud resources against documented control claims to detect drift
   */
  analyzeDrift(
    resources: ParsedCloudResource[],
    controlStatements: Array<{
      controlId: string;
      framework: string;
      claim: string;
    }>
  ): DriftAnalysisReport {
    const findings: DriftFinding[] = [];

    // Helper map of claims
    const claimByControl = new Map<string, { framework: string; claim: string }>();
    for (const cs of controlStatements) {
      claimByControl.set(cs.controlId.toUpperCase(), cs);
    }

    // 1. S3 & Object Storage Encryption Check (SOC 2 CC6.1 / NIST SC-13 / SC-28)
    const s3Resources = resources.filter(
      (r) => r.type === "aws_s3_bucket" || r.type === "aws_s3_bucket_server_side_encryption_configuration"
    );
    for (const bucket of s3Resources) {
      const isEncrypted =
        bucket.attributes.server_side_encryption_configuration ||
        bucket.attributes.rule ||
        bucket.attributes.encrypted === true;

      if (!isEncrypted) {
        const ctrl = claimByControl.get("SC-13") || claimByControl.get("CC6.1") || {
          framework: "SOC2",
          claim: "All data stores and cloud storage objects enforce AES-256 or KMS server-side encryption at rest.",
        };

        findings.push({
          id: `drift-${bucket.id}-encryption`,
          controlId: "SC-13",
          framework: ctrl.framework,
          resourceId: bucket.id,
          resourceType: bucket.type,
          driftType: "unencrypted_resource",
          severity: "high",
          documentedClaim: ctrl.claim,
          actualState: `Bucket ${bucket.name} does not have server-side encryption enabled in Terraform configuration.`,
          suggestedRemediation: `Enable 'aws_s3_bucket_server_side_encryption_configuration' with AES256 or AWS-KMS for ${bucket.name}.`,
          proposedDocumentationDiff: {
            originalText: ctrl.claim,
            suggestedText: `${ctrl.claim} [DRIFT NOTED: Bucket ${bucket.name} pending automated KMS enablement].`,
          },
        });
      }
    }

    // 2. Open Security Groups / Firewall Ingress (SOC 2 CC6.6 / NIST SC-7)
    const securityGroups = resources.filter((r) => r.type === "aws_security_group");
    for (const sg of securityGroups) {
      const ingress = sg.attributes.ingress;
      const hasOpenCidr =
        sg.attributes.has_open_ingress ||
        (Array.isArray(ingress) &&
          ingress.some((rule: any) =>
            Array.isArray(rule.cidr_blocks) ? rule.cidr_blocks.includes("0.0.0.0/0") : false
          ));

      if (hasOpenCidr) {
        const ctrl = claimByControl.get("SC-7") || claimByControl.get("CC6.6") || {
          framework: "NIST-SP-800-53",
          claim: "Ingress to all internal subnets and security boundaries is strictly filtered by private VPC CIDRs.",
        };

        findings.push({
          id: `drift-${sg.id}-ingress`,
          controlId: "SC-7",
          framework: ctrl.framework,
          resourceId: sg.id,
          resourceType: sg.type,
          driftType: "open_ingress",
          severity: "critical",
          documentedClaim: ctrl.claim,
          actualState: `Security group ${sg.name} permits unrestricted inbound traffic from 0.0.0.0/0.`,
          suggestedRemediation: `Restrict ingress cidr_blocks to bastion VPN or internal VPC CIDR ranges.`,
          proposedDocumentationDiff: {
            originalText: ctrl.claim,
            suggestedText: `${ctrl.claim} [EXCEPTION: Security group ${sg.name} temporarily configured for open ingress; remediation scheduled].`,
          },
        });
      }
    }

    // 3. Database Encryption & Backups (SOC 2 CC7.1 / NIST CP-9)
    const rdsInstances = resources.filter((r) => r.type === "aws_db_instance");
    for (const db of rdsInstances) {
      if (db.attributes.storage_encrypted === false) {
        findings.push({
          id: `drift-${db.id}-db-encryption`,
          controlId: "SC-28",
          framework: "FedRAMP-High",
          resourceId: db.id,
          resourceType: db.type,
          driftType: "unencrypted_resource",
          severity: "critical",
          documentedClaim: "All persistent databases are encrypted at rest using FIPS 140-2 validated KMS keys.",
          actualState: `RDS instance ${db.name} has storage_encrypted set to false.`,
          suggestedRemediation: "Create an encrypted snapshot and restore the RDS database with storage_encrypted = true.",
          proposedDocumentationDiff: {
            originalText: "All persistent databases are encrypted at rest using FIPS 140-2 validated KMS keys.",
            suggestedText: "Persistent databases are encrypted with KMS keys (remediation in progress for unencrypted instance).",
          },
        });
      }
    }

    const criticalCount = findings.filter((f) => f.severity === "critical").length;
    const highCount = findings.filter((f) => f.severity === "high").length;
    const mediumCount = findings.filter((f) => f.severity === "medium").length;
    const lowCount = findings.filter((f) => f.severity === "low").length;

    // Calculate score
    const deduction = criticalCount * 25 + highCount * 15 + mediumCount * 8 + lowCount * 3;
    const complianceScore = Math.max(0, 100 - deduction);

    return {
      timestamp: new Date().toISOString(),
      totalResourcesAnalyzed: resources.length,
      driftCount: findings.length,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      findings,
      complianceScore,
    };
  }
}

export const iacDriftService = new IacDriftService();

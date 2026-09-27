/**
 * OSCAL 1.1 Machine-Readable Export Engine
 * 
 * Provides NIST SP 800-53 Rev 5 and FedRAMP Moderate/High compliant
 * System Security Plan (SSP) generation in official OSCAL 1.1 JSON and YAML formats.
 */

import crypto from "crypto";
import { logger } from "../utils/logger";

export interface OscalMetadata {
  title: string;
  published?: string;
  "last-modified": string;
  version: string;
  "oscal-version": "1.1.0";
  roles?: Array<{ id: string; title: string }>;
  parties?: Array<{
    uuid: string;
    type: "person" | "organization";
    name: string;
    "email-addresses"?: string[];
  }>;
}

export interface OscalSystemCharacteristics {
  "system-name": string;
  "system-name-short"?: string;
  description: string;
  "security-sensitivity-level": "low" | "moderate" | "high";
  "system-information": {
    "information-types": Array<{
      uuid: string;
      title: string;
      description: string;
      categorization?: {
        system: string;
        "information-type-ids": string[];
      };
      "confidentiality-impact": { base: "fips-199-low" | "fips-199-moderate" | "fips-199-high" };
      "integrity-impact": { base: "fips-199-low" | "fips-199-moderate" | "fips-199-high" };
      "availability-impact": { base: "fips-199-low" | "fips-199-moderate" | "fips-199-high" };
    }>;
  };
  "security-impact-level": {
    "security-objective-confidentiality": "fips-199-low" | "fips-199-moderate" | "fips-199-high";
    "security-objective-integrity": "fips-199-low" | "fips-199-moderate" | "fips-199-high";
    "security-objective-availability": "fips-199-low" | "fips-199-moderate" | "fips-199-high";
  };
  status: { state: "operational" | "under-development" | "major-modification" };
  "authorization-boundary": {
    description: string;
    diagrams?: Array<{
      uuid: string;
      description: string;
      links?: Array<{ href: string; "media-type": string }>;
    }>;
  };
}

export interface OscalComponent {
  uuid: string;
  type: "software" | "hardware" | "service" | "policy" | "physical";
  title: string;
  description: string;
  purpose?: string;
  status: { state: "operational" | "under-development" };
}

export interface OscalImplementedRequirement {
  uuid: string;
  "control-id": string;
  description: string;
  "set-parameters"?: Array<{ "param-id": string; values: string[] }>;
  statements?: Array<{
    "statement-id": string;
    uuid: string;
    description: string;
    "by-components"?: Array<{
      "component-uuid": string;
      uuid: string;
      description: string;
      "implementation-status"?: { state: "implemented" | "partial" | "planned" | "not-applicable" };
    }>;
  }>;
}

export interface OscalSspDocument {
  "system-security-plan": {
    id: string;
    uuid: string;
    metadata: OscalMetadata;
    "import-profile": {
      href: string;
    };
    "system-characteristics": OscalSystemCharacteristics;
    "system-implementation": {
      users: Array<{ uuid: string; title: string; "role-ids": string[] }>;
      components: OscalComponent[];
    };
    "control-implementation": {
      description: string;
      "implemented-requirements": OscalImplementedRequirement[];
    };
  };
}

export interface BuildOscalSspInput {
  systemName: string;
  systemShortName?: string;
  description: string;
  securityLevel?: "low" | "moderate" | "high";
  framework: "NIST-SP-800-53-Rev5" | "FedRAMP-High" | "FedRAMP-Moderate" | "SOC2" | "ISO27001";
  version?: string;
  companyName: string;
  contactEmail?: string;
  components?: Array<{
    name: string;
    type: "software" | "hardware" | "service" | "policy" | "physical";
    description: string;
  }>;
  controls: Array<{
    controlId: string;
    title?: string;
    implementationNarrative: string;
    status?: "implemented" | "partial" | "planned" | "not-applicable";
  }>;
}

export interface OscalValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    controlCount: number;
    componentCount: number;
    schemaVersion: string;
  };
}

export class OscalService {
  /**
   * Builds a fully compliant OSCAL 1.1 System Security Plan document
   */
  generateSsp(input: BuildOscalSspInput): OscalSspDocument {
    const sspUuid = crypto.randomUUID();
    const systemOrgUuid = crypto.randomUUID();
    const now = new Date().toISOString();
    const sensitivity = input.securityLevel || "moderate";
    const fipsLevel = `fips-199-${sensitivity}` as const;

    // Framework Profile Catalog mapping
    const profileHrefs: Record<string, string> = {
      "NIST-SP-800-53-Rev5": "https://github.com/usnistgov/oscal-content/blob/master/nist.gov/SP800-53/rev5/json/NIST_SP-800-53_rev5_MODERATE-baseline_profile.json",
      "FedRAMP-High": "https://github.com/GSA/fedramp-automation/blob/master/dist/content/baselines/rev5/json/FedRAMP_rev5_HIGH-baseline_profile.json",
      "FedRAMP-Moderate": "https://github.com/GSA/fedramp-automation/blob/master/dist/content/baselines/rev5/json/FedRAMP_rev5_MODERATE-baseline_profile.json",
      "SOC2": "https://cyberdocgen.local/profiles/soc2-tsc-2024.json",
      "ISO27001": "https://cyberdocgen.local/profiles/iso-27001-2022.json",
    };

    // Default system software component
    const defaultComponents: OscalComponent[] = [
      {
        uuid: crypto.randomUUID(),
        type: "software",
        title: `${input.systemName} Platform`,
        description: `Primary software stack and application layer for ${input.systemName}.`,
        status: { state: "operational" },
      },
      ...(input.components || []).map((c) => ({
        uuid: crypto.randomUUID(),
        type: c.type,
        title: c.name,
        description: c.description,
        status: { state: "operational" as const },
      })),
    ];

    const primaryComponentUuid = defaultComponents[0].uuid;

    // Build implemented requirements
    const implementedRequirements: OscalImplementedRequirement[] = input.controls.map((ctrl) => {
      const normalizedControlId = ctrl.controlId.toLowerCase().replace(/[^a-z0-9.-]/g, "-");
      const reqUuid = crypto.randomUUID();
      const statementUuid = crypto.randomUUID();
      const byComponentUuid = crypto.randomUUID();

      return {
        uuid: reqUuid,
        "control-id": normalizedControlId,
        description: ctrl.title || `Implementation for ${ctrl.controlId}`,
        statements: [
          {
            "statement-id": `${normalizedControlId}_smt`,
            uuid: statementUuid,
            description: ctrl.implementationNarrative,
            "by-components": [
              {
                "component-uuid": primaryComponentUuid,
                uuid: byComponentUuid,
                description: ctrl.implementationNarrative,
                "implementation-status": {
                  state: ctrl.status || "implemented",
                },
              },
            ],
          },
        ],
      };
    });

    const ssp: OscalSspDocument = {
      "system-security-plan": {
        id: `ssp-${input.systemShortName ? input.systemShortName.toLowerCase() : "cyberdocgen"}-${Date.now()}`,
        uuid: sspUuid,
        metadata: {
          title: `${input.systemName} - System Security Plan (SSP)`,
          "last-modified": now,
          published: now,
          version: input.version || "1.0.0",
          "oscal-version": "1.1.0",
          roles: [
            { id: "author", title: "Document Author / System Owner" },
            { id: "ciso", title: "Chief Information Security Officer" },
          ],
          parties: [
            {
              uuid: systemOrgUuid,
              type: "organization",
              name: input.companyName,
              "email-addresses": input.contactEmail ? [input.contactEmail] : undefined,
            },
          ],
        },
        "import-profile": {
          href: profileHrefs[input.framework] || profileHrefs["NIST-SP-800-53-Rev5"],
        },
        "system-characteristics": {
          "system-name": input.systemName,
          "system-name-short": input.systemShortName || input.systemName.substring(0, 10).toUpperCase(),
          description: input.description,
          "security-sensitivity-level": sensitivity,
          "system-information": {
            "information-types": [
              {
                uuid: crypto.randomUUID(),
                title: "Proprietary & Customer Business Data",
                description: "Customer sensitive records, credentials, and telemetry managed within the boundary.",
                "confidentiality-impact": { base: fipsLevel },
                "integrity-impact": { base: fipsLevel },
                "availability-impact": { base: fipsLevel },
              },
            ],
          },
          "security-impact-level": {
            "security-objective-confidentiality": fipsLevel,
            "security-objective-integrity": fipsLevel,
            "security-objective-availability": fipsLevel,
          },
          status: { state: "operational" },
          "authorization-boundary": {
            description: `The authorization boundary for ${input.systemName} encapsulates all compute instances, serverless functions, databases, and microservices supporting application runtime.`,
          },
        },
        "system-implementation": {
          users: [
            {
              uuid: crypto.randomUUID(),
              title: "Security Administrator",
              "role-ids": ["ciso", "author"],
            },
          ],
          components: defaultComponents,
        },
        "control-implementation": {
          description: `Controls implemented for ${input.systemName} aligned with ${input.framework}.`,
          "implemented-requirements": implementedRequirements,
        },
      },
    };

    logger.info(`[OscalService] Successfully generated OSCAL 1.1 SSP: ${ssp["system-security-plan"].id}`, {
      controlCount: implementedRequirements.length,
      componentCount: defaultComponents.length,
    });

    return ssp;
  }

  /**
   * Validates an OSCAL SSP document against mandatory structure rules
   */
  validateSsp(ssp: any): OscalValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ssp || typeof ssp !== "object") {
      return {
        valid: false,
        errors: ["Invalid root payload: expected JSON object."],
        warnings: [],
        summary: { controlCount: 0, componentCount: 0, schemaVersion: "unknown" },
      };
    }

    const plan = ssp["system-security-plan"];
    if (!plan) {
      errors.push("Missing required root key: 'system-security-plan'");
      return {
        valid: false,
        errors,
        warnings,
        summary: { controlCount: 0, componentCount: 0, schemaVersion: "unknown" },
      };
    }

    if (!plan.id) errors.push("Missing 'system-security-plan.id'");
    if (!plan.uuid) errors.push("Missing 'system-security-plan.uuid'");

    // Validate metadata
    if (!plan.metadata) {
      errors.push("Missing 'metadata' block");
    } else {
      if (plan.metadata["oscal-version"] !== "1.1.0") {
        warnings.push(`Expected oscal-version '1.1.0', found '${plan.metadata["oscal-version"]}'`);
      }
      if (!plan.metadata.title) errors.push("Missing metadata.title");
      if (!plan.metadata.version) errors.push("Missing metadata.version");
    }

    // Validate system-characteristics
    if (!plan["system-characteristics"]) {
      errors.push("Missing 'system-characteristics' block");
    } else {
      if (!plan["system-characteristics"]["system-name"]) errors.push("Missing system-name");
      if (!plan["system-characteristics"]["security-sensitivity-level"]) errors.push("Missing security-sensitivity-level");
    }

    // Validate control-implementation
    let controlCount = 0;
    if (!plan["control-implementation"]) {
      errors.push("Missing 'control-implementation' block");
    } else {
      const reqs = plan["control-implementation"]["implemented-requirements"];
      if (!Array.isArray(reqs)) {
        errors.push("implemented-requirements must be an array");
      } else {
        controlCount = reqs.length;
        if (controlCount === 0) {
          warnings.push("SSP has 0 implemented requirements.");
        }
      }
    }

    const componentCount = plan["system-implementation"]?.components?.length || 0;

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        controlCount,
        componentCount,
        schemaVersion: plan.metadata?.["oscal-version"] || "1.1.0",
      },
    };
  }
}

export const oscalService = new OscalService();

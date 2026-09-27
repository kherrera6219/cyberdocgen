import { describe, it, expect } from "vitest";
import { oscalService, type BuildOscalSspInput } from "../../../server/services/oscalService";

describe("OscalService", () => {
  const sampleInput: BuildOscalSspInput = {
    systemName: "CyberDocGen Cloud",
    systemShortName: "CDG-CLOUD",
    description: "Enterprise Automated Cybersecurity Compliance Documentation Generator.",
    securityLevel: "moderate",
    framework: "FedRAMP-Moderate",
    companyName: "CyberDocGen Inc.",
    contactEmail: "security@cyberdocgen.dev",
    components: [
      {
        name: "PostgreSQL Database Engine",
        type: "software",
        description: "Encrypted relational persistence tier with pgvector.",
      },
    ],
    controls: [
      {
        controlId: "AC-2",
        title: "Account Management",
        implementationNarrative: "All user accounts require enterprise SSO and multi-factor authentication.",
        status: "implemented",
      },
      {
        controlId: "SC-13",
        title: "Cryptographic Protection",
        implementationNarrative: "Data at rest is encrypted with FIPS 140-2 validated AES-256-GCM.",
        status: "implemented",
      },
    ],
  };

  it("should generate a valid OSCAL 1.1 System Security Plan (SSP)", () => {
    const sspDoc = oscalService.generateSsp(sampleInput);

    expect(sspDoc).toHaveProperty("system-security-plan");
    const plan = sspDoc["system-security-plan"];

    expect(plan.id).toMatch(/^ssp-cdg-cloud-\d+/);
    expect(plan.uuid).toBeDefined();
    expect(plan.metadata["oscal-version"]).toBe("1.1.0");
    expect(plan.metadata.title).toContain("CyberDocGen Cloud");
    expect(plan["import-profile"].href).toContain("FedRAMP_rev5_MODERATE");

    // System Characteristics
    expect(plan["system-characteristics"]["system-name"]).toBe("CyberDocGen Cloud");
    expect(plan["system-characteristics"]["security-sensitivity-level"]).toBe("moderate");

    // Components
    const components = plan["system-implementation"].components;
    expect(components.length).toBe(2);
    expect(components[1].title).toBe("PostgreSQL Database Engine");

    // Implemented Requirements
    const reqs = plan["control-implementation"]["implemented-requirements"];
    expect(reqs.length).toBe(2);
    expect(reqs[0]["control-id"]).toBe("ac-2");
    expect(reqs[1]["control-id"]).toBe("sc-13");
  });

  it("should validate a compliant OSCAL SSP document with zero errors", () => {
    const sspDoc = oscalService.generateSsp(sampleInput);
    const result = oscalService.validateSsp(sspDoc);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary.controlCount).toBe(2);
    expect(result.summary.componentCount).toBe(2);
    expect(result.summary.schemaVersion).toBe("1.1.0");
  });

  it("should flag validation errors on invalid or incomplete OSCAL payloads", () => {
    const invalidPayload = {
      "system-security-plan": {
        // missing id, uuid, metadata, system-characteristics
      },
    };

    const result = oscalService.validateSsp(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

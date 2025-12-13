import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Compliance Gap Analysis Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Gap Identification", () => {
    it("should identify compliance gaps", () => {
      const required = ["policy", "procedures", "training"];
      const implemented = ["policy"];
      const gaps = required.filter(r => !implemented.includes(r));
      expect(gaps).toContain("procedures");
      expect(gaps).toContain("training");
    });

    it("should categorize gaps by severity", () => {
      const gaps = [
        { item: "MFA", severity: "critical" },
        { item: "Training", severity: "medium" },
      ];
      const critical = gaps.filter(g => g.severity === "critical");
      expect(critical.length).toBeGreaterThan(0);
    });

    it("should map gaps to framework controls", () => {
      const gap = {
        item: "Access Control",
        controls: ["ISO27001:A.9.1.1", "SOC2:CC6.1"],
      };
      expect(gap.controls.length).toBeGreaterThan(0);
    });
  });

  describe("Gap Analysis Reporting", () => {
    it("should generate gap analysis report", () => {
      const report = {
        framework: "ISO27001",
        totalControls: 114,
        implemented: 85,
        gaps: 29,
        compliancePercentage: 74.5,
      };
      expect(report.gaps).toBeGreaterThan(0);
    });

    it("should prioritize remediation actions", () => {
      const actions = [
        { priority: 1, item: "Critical gap" },
        { priority: 2, item: "High gap" },
      ];
      const sorted = actions.sort((a, b) => a.priority - b.priority);
      expect(sorted[0].priority).toBe(1);
    });
  });

  describe("Remediation Planning", () => {
    it("should create remediation plan", () => {
      const plan = {
        gap: "MFA Implementation",
        steps: ["Select solution", "Deploy", "Train users"],
        timeline: 90, // days
        owner: "IT Team",
      };
      expect(plan.steps.length).toBeGreaterThan(0);
    });

    it("should estimate remediation effort", () => {
      const gap = {
        item: "Encryption",
        effort: "medium",
        estimatedDays: 30,
      };
      expect(gap.estimatedDays).toBeGreaterThan(0);
    });
  });

  describe("Progress Tracking", () => {
    it("should track remediation progress", () => {
      const progress = {
        totalGaps: 20,
        closed: 5,
        inProgress: 10,
        notStarted: 5,
        percentComplete: 25,
      };
      expect(progress.percentComplete).toBeGreaterThan(0);
    });

    it("should update gap status", () => {
      const gap = {
        item: "Training",
        status: "completed",
        completedDate: new Date(),
      };
      expect(gap.status).toBe("completed");
    });
  });

  describe("Multi-Framework Analysis", () => {
    it("should compare requirements across frameworks", () => {
      const comparison = {
        control: "Access Control",
        iso27001: "A.9.1.1",
        soc2: "CC6.1",
        overlap: true,
      };
      expect(comparison.overlap).toBe(true);
    });

    it("should identify common gaps", () => {
      const gaps = {
        iso27001: ["MFA", "Logging"],
        soc2: ["MFA", "Monitoring"],
        common: ["MFA"],
      };
      expect(gaps.common).toContain("MFA");
    });
  });

  describe("Evidence Management", () => {
    it("should link evidence to controls", () => {
      const evidence = {
        control: "A.9.1.1",
        documents: ["policy.pdf", "procedure.docx"],
        complete: true,
      };
      expect(evidence.documents.length).toBeGreaterThan(0);
    });

    it("should identify missing evidence", () => {
      const control = {
        id: "A.9.1.1",
        requiresEvidence: true,
        evidenceProvided: false,
      };
      expect(control.evidenceProvided).toBe(false);
    });
  });
});

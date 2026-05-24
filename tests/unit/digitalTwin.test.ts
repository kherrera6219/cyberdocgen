import { describe, it, expect, vi, beforeEach } from "vitest";
import { DigitalTwinService } from "../../server/services/digitalTwinService";
import { db } from "../../server/db";
import { storage } from "../../server/storage";
import { aiOrchestrator } from "../../server/services/aiOrchestrator";

// Mock DB
vi.mock("../../server/db", () => ({
  db: {
    query: {
      companyProfiles: {
        findFirst: vi.fn(() => Promise.resolve({ id: "profile-1", companyName: "TwinCorp" }))
      },
      documents: {
        findFirst: vi.fn(() => Promise.resolve({ title: "Encryption Policy", content: "All data encrypted." }))
      }
    }
  }
}));

// Mock Storage
vi.mock("../../server/storage", () => ({
  storage: {
    getMockAudit: vi.fn(),
    updateMockAudit: vi.fn()
  }
}));

// Mock AI Orchestrator
vi.mock("../../server/services/aiOrchestrator", () => ({
  aiOrchestrator: {
    generateContent: vi.fn()
  }
}));

describe("DigitalTwinService", () => {
  let service: DigitalTwinService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DigitalTwinService();
  });

  it("coordinates simulator loop with multi-agent debate, generates report, and saves to database", async () => {
    const mockAuditJob = {
      id: "audit-456",
      organizationId: "org-1",
      framework: "SOC2",
      auditorPersonality: "nitpicky",
      status: "pending",
      transcript: []
    };

    (storage.getMockAudit as any).mockResolvedValueOnce(mockAuditJob);
    
    // Mock the AI orchestration debate answers
    (aiOrchestrator.generateContent as any)
      .mockResolvedValueOnce({ result: { content: "Auditor: Why isn't MFA enforced on all systems?" } }) // Auditor Turn 1
      .mockResolvedValueOnce({ result: { content: "Admin: We enforce it via Active Directory GPO." } }) // Admin Turn 1
      .mockResolvedValueOnce({ result: { content: "Auditor: What about offline backups?" } }) // Auditor Turn 2
      .mockResolvedValueOnce({ result: { content: "Admin: Backups are replicated offsite daily." } }) // Admin Turn 2
      .mockResolvedValueOnce({ result: { content: "Auditor: Perfect, double-check compliance ledger." } }) // Auditor Turn 3
      .mockResolvedValueOnce({ result: { content: "Admin: Logged to Windows Event Viewer." } }) // Admin Turn 3
      .mockResolvedValueOnce({ // Final Report Generation
        result: {
          content: JSON.stringify({
            score: 92,
            reportMarkdown: "# Mock Audit Report\n- Access Control: Pass\n- Backup Strategy: Pass"
          })
        }
      });

    await service.runSimulation("audit-456", "org-1", "user-1");

    expect(storage.getMockAudit).toHaveBeenCalledWith("audit-456");
    expect(storage.updateMockAudit).toHaveBeenCalledWith("audit-456", { status: "running" });
    
    // Verify final completion update
    expect(storage.updateMockAudit).toHaveBeenCalledWith("audit-456", expect.objectContaining({
      status: "completed",
      complianceScore: 92,
      reportMarkdown: expect.stringContaining("# Mock Audit Report")
    }));
  });

  it("sets mock audit status to failed if debate or lookup throws", async () => {
    (storage.getMockAudit as any).mockRejectedValueOnce(new Error("Database disconnected"));

    await service.runSimulation("audit-456", "org-1", "user-1");

    expect(storage.updateMockAudit).toHaveBeenCalledWith("audit-456", expect.objectContaining({
      status: "failed",
      reportMarkdown: expect.stringContaining("Database disconnected")
    }));
  });
});

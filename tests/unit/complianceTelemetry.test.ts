import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComplianceTelemetryEngine } from "../../server/services/complianceTelemetryEngine";
import { db } from "../../server/db";
import { alertingService } from "../../server/services/alertingService";
import { windowsEventLogService } from "../../server/services/windowsEventLogService";

// Mock DB
vi.mock("../../server/db", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn().mockResolvedValue([{ id: "doc-123" }])
    })),
    query: {
      companyProfiles: {
        findFirst: vi.fn(() => Promise.resolve({ id: "profile-1", companyName: "TestCorp" }))
      }
    }
  }
}));

// Mock alertingService
vi.mock("../../server/services/alertingService", () => ({
  alertingService: {
    getAlertMetrics: vi.fn(() => ({ total: 5 })),
    updateMetric: vi.fn()
  }
}));

// Mock windowsEventLogService
vi.mock("../../server/services/windowsEventLogService", () => ({
  windowsEventLogService: {
    logEvent: vi.fn(() => Promise.resolve(true))
  }
}));

describe("ComplianceTelemetryEngine", () => {
  let engine: ComplianceTelemetryEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new ComplianceTelemetryEngine();
  });

  it("detects document security removal and logs Windows warning & increments metrics", async () => {
    const mockEvent = {
      id: "evt-123",
      userId: "user-999",
      organizationId: "org-123",
      action: "delete",
      resourceType: "pdf_security",
      resourceId: "lock-456",
      riskLevel: "high",
      additionalContext: { ipAddress: "192.168.1.5" },
      timestamp: new Date()
    };

    await engine.evaluateEvent(mockEvent);

    expect(alertingService.updateMetric).toHaveBeenCalledWith("security_events", 6);
    expect(windowsEventLogService.logEvent).toHaveBeenCalledWith(
      1002,
      "Error",
      expect.stringContaining("Document security encryption lock or watermark was explicitly removed."),
      expect.any(Object)
    );
  });

  it("auto-drafts incident report document into DB when a policy is deleted", async () => {
    const mockEvent = {
      id: "evt-456",
      userId: "admin-1",
      organizationId: "org-123",
      action: "delete",
      resourceType: "document",
      resourceId: "policy-888",
      riskLevel: "critical",
      additionalContext: { ipAddress: "10.0.0.12" },
      timestamp: new Date()
    };

    await engine.evaluateEvent(mockEvent);

    expect(alertingService.updateMetric).toHaveBeenCalled();
    expect(db.insert).toHaveBeenCalled();
    expect(windowsEventLogService.logEvent).toHaveBeenCalledWith(
      1003,
      "Error",
      expect.stringContaining("Approved compliance policy or procedural document was deleted."),
      expect.any(Object)
    );
  });

  it("ignores non-violating events gracefully", async () => {
    const mockEvent = {
      id: "evt-789",
      userId: "user-1",
      organizationId: "org-123",
      action: "read",
      resourceType: "document",
      resourceId: "policy-888",
      riskLevel: "low",
      additionalContext: {},
      timestamp: new Date()
    };

    await engine.evaluateEvent(mockEvent);

    expect(alertingService.updateMetric).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(windowsEventLogService.logEvent).not.toHaveBeenCalled();
  });
});

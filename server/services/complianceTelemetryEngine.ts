import { db } from "../db";
import { documents, type AuditLog, type InsertDocument } from "@shared/schema";
import { alertingService } from "./alertingService";
import { windowsEventLogService } from "./windowsEventLogService";
import { logger } from "../utils/logger";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export class ComplianceTelemetryEngine {
  
  /**
   * Evaluate a real-time audit log entry for compliance/security policy violations
   */
  async evaluateEvent(event: {
    id: string;
    userId: string | null;
    organizationId: string | null;
    action: string;
    resourceType: string;
    resourceId: string | null;
    riskLevel: string;
    additionalContext: any;
    timestamp: Date;
  }): Promise<void> {
    try {
      const { action, resourceType, riskLevel, userId, organizationId, timestamp } = event;
      
      let isViolation = false;
      let violationReason = "";
      let eventId = 1000; // General system event id

      // 1. Telemetry Policy Rules Evaluator
      const actionLower = action.toLowerCase();
      const resourceLower = resourceType.toLowerCase();

      // Rule A: High-risk security settings removals (e.g. deleting PDF security locks)
      if (resourceLower === "pdf_security_removed" || (actionLower === "delete" && resourceLower === "pdf_security")) {
        isViolation = true;
        violationReason = "Document security encryption lock or watermark was explicitly removed.";
        eventId = 1002;
      }
      
      // Rule B: Failed/lockout authentication incidents
      else if (actionLower === "failed_login" || riskLevel === "medium" && resourceLower === "authentication") {
        const metadata = event.additionalContext || {};
        if (metadata.success === false) {
          isViolation = true;
          violationReason = "Repeated failed user login attempt or authentication block detected.";
          eventId = 1001;
        }
      }

      // Rule C: Critical policy catalog deletions (deleting framework policies)
      else if (actionLower === "delete" && resourceLower === "document") {
        isViolation = true;
        violationReason = "Approved compliance policy or procedural document was deleted.";
        eventId = 1003;
      }

      // Rule D: Deleting active risk factors
      else if (actionLower === "delete" && resourceLower === "risk") {
        isViolation = true;
        violationReason = "Active risk item removed from register without formal residual review.";
        eventId = 1004;
      }

      if (!isViolation) {
        return;
      }

      logger.warn(`[ComplianceTelemetryEngine] GRC Telemetry Policy Breach Detected: ${violationReason}`, { eventId, userId, action });

      // 2. Alert the alertingService
      const currentAlerts = alertingService.getAlertMetrics().total;
      alertingService.updateMetric("security_events", currentAlerts + 1);

      // 3. Log to Windows Event Viewer (or Winston fallback)
      await windowsEventLogService.logEvent(
        eventId,
        "Error",
        `GRC Compliance Violation: ${violationReason}`,
        {
          userId: userId || "system",
          action,
          resourceType,
          timestamp: timestamp.toISOString()
        }
      );

      // 4. Auto-draft an incident report document if org context exists
      if (organizationId) {
        const profile = await db.query.companyProfiles.findFirst({
          where: eq(documents.companyProfileId, organizationId) // Scoped to org
        });
        
        const incidentId = `INC-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
        const incidentTitle = `Incident Report: GRC Telemetry Violation (${incidentId})`;
        
        const reportContent = `# Incident Report: Compliance Telemetry Violation (${incidentId})

## Executive Summary
This incident report was auto-drafted by CyberDocGen's real-time **AI Compliance Telemetry Engine** following a flagged security policy violation.

* **Incident ID**: ${incidentId}
* **Timestamp**: ${timestamp.toISOString()}
* **System Event ID**: ${eventId}
* **Trigger Event Action**: ${action}
* **Affected Resource Category**: ${resourceType}
* **Actor Profile**: ${userId || "System Administrator"}

---

## 🔍 Detailed Policy Violation Assessment
The compliance telemetry engine detected a violation matching the GRC rule: **"${violationReason}"**.

### Action Details
The following security event trace was captured inside the immutable HMAC GRC ledger:
* **Event Log ID**: \`${event.id}\`
* **Risk Severity Index**: \`${riskLevel.toUpperCase()}\`
* **Network Host Trace**: \`${event.additionalContext?.ipAddress || "on-premises-vm"}\`

---

## 🛠️ Proposed Remediation Actions
1. **Access Audit**: Validate the credentials and actions of User ID \`${userId || "system"}\`.
2. **Control Restoral**: Re-establish the core encryption or control settings.
3. **Formal Verification**: Execute the AI Auditor Twin simulation to verify posture readiness.

*Report drafted autonomously by CyberDocGen telemetry systems.*`;

        // Check if there is an active company profile to reference
        const profileRecord = await db.query.companyProfiles.findFirst({
          where: eq(documents.companyProfileId, organizationId)
        });

        if (profileRecord) {
          await db.insert(documents).values({
            companyProfileId: profileRecord.id,
            createdBy: userId || "system",
            title: incidentTitle,
            description: `Automated incident report generated for telemetry alarm event ID ${eventId}.`,
            framework: "SOC2", // baseline framework mapping
            category: "assessment",
            documentType: "text",
            content: reportContent,
            status: "draft",
            version: 1,
            aiGenerated: true,
            aiModel: "telemetry-rules-v1"
          } as any);
          logger.info(`[ComplianceTelemetryEngine] Auto-drafted incident report document: ${incidentTitle}`);
        }
      }
    } catch (error) {
      logger.error("[ComplianceTelemetryEngine] Event evaluation failure:", error);
    }
  }
}

export const complianceTelemetryEngine = new ComplianceTelemetryEngine();

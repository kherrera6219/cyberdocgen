import { db } from "../db";
import { mockAudits, documents, type MockAudit, type InsertMockAudit } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { aiOrchestrator } from "./aiOrchestrator";
import { storage } from "../storage";
import { logger } from "../utils/logger";

export class DigitalTwinService {
  
  /**
   * Run the digital twin mock audit simulation asynchronously
   */
  async runSimulation(auditId: string, organizationId: string, userId: string): Promise<void> {
    logger.info(`[DigitalTwinService] Starting audit twin simulation for run ${auditId}`);
    
    try {
      // 1. Load the mock audit job
      const audit = await storage.getMockAudit(auditId);
      if (!audit) {
        throw new Error("Mock audit run job not found");
      }

      await storage.updateMockAudit(auditId, { status: "running" });

      // 2. Fetch company profile & active policies to inject as context
      const profile = await db.query.companyProfiles.findFirst({
        where: eq(mockAudits.organizationId, organizationId)
      });
      const companyName = profile?.companyName || "Our Enterprise";
      
      const policies = await db.query.documents.findFirst({
        where: eq(documents.companyProfileId, profile?.id || "")
      });
      const policiesContext = policies 
        ? `Policy title: ${policies.title}\nContent:\n${policies.content.substring(0, 1000)}`
        : "No custom policy documents uploaded yet. Relying on default baseline controls.";

      const transcript: { speaker: "auditor" | "admin" | "system"; message: string; timestamp: string }[] = [];

      transcript.push({
        speaker: "system",
        message: `Audit Simulation initiated for framework ${audit.framework}. Personality set to ${audit.auditorPersonality}.`,
        timestamp: new Date().toISOString()
      });
      await storage.updateMockAudit(auditId, { transcript });

      let currentTranscriptText = "";

      // 3. Dialogue loop (3 turns)
      const rounds = 3;
      for (let r = 1; r <= rounds; r++) {
        logger.info(`[DigitalTwinService] Simulating round ${r}/${rounds} for audit ${auditId}`);

        // --- Auditor Agent Turn ---
        const auditorPrompt = `You are a compliance auditor. You are conducting a mock audit of ${companyName} against the ${audit.framework} compliance framework.
Your personality is: ${audit.auditorPersonality} (strict = extremely thorough, nitpicky = catches tiny details and formatting errors, supportive = helpful but firm).

Active Policies/Context:
${policiesContext}

Audit Transcript so far:
${currentTranscriptText}

Based on the policies and the transcript, raise a compliance challenge or ask a tough question regarding their controls (e.g. data encryption, access controls, backups, logging). Be concise and direct.`;

        const auditorResult = await aiOrchestrator.generateContent({
          prompt: auditorPrompt,
          model: "gemini-3.5-flash",
          enableGuardrails: true
        });

        const auditorMessage = auditorResult.result.content.trim();
        transcript.push({
          speaker: "auditor",
          message: auditorMessage,
          timestamp: new Date().toISOString()
        });
        currentTranscriptText += `\nAuditor: ${auditorMessage}\n`;
        await storage.updateMockAudit(auditId, { transcript });

        // --- Admin Agent Turn ---
        const adminPrompt = `You are the on-premises GRC System Administrator defending ${companyName} during a ${audit.framework} audit.
Explain how we meet the controls, referencing our active security policies where possible. Be professional, direct, and collaborative.

Active Policies/Context:
${policiesContext}

Auditor challenge:
"${auditorMessage}"

Transcript so far:
${currentTranscriptText}

Respond directly to the auditor's concern, explaining our controls clearly.`;

        const adminResult = await aiOrchestrator.generateContent({
          prompt: adminPrompt,
          model: "claude-sonnet-4-6",
          enableGuardrails: true
        });

        const adminMessage = adminResult.result.content.trim();
        transcript.push({
          speaker: "admin",
          message: adminMessage,
          timestamp: new Date().toISOString()
        });
        currentTranscriptText += `\nAdmin: ${adminMessage}\n`;
        await storage.updateMockAudit(auditId, { transcript });
      }

      // 4. Generate the final assessment report and compliance score
      logger.info(`[DigitalTwinService] Generating final audit report for run ${auditId}`);
      const reportPrompt = `You are an expert GRC Lead Auditor. Analyze the mock audit transcript below and produce a final, premium **Mock Audit Assessment Report** for ${companyName} under ${audit.framework}.

Audit Transcript:
${currentTranscriptText}

Active Policies/Context:
${policiesContext}

Generate a comprehensive Markdown report with the following structure:
# Mock Audit Assessment Report: ${audit.framework}
## Executive Summary
## Evaluated Controls & Successes
## Identified Compliance Gaps & Risks
## Step-by-Step Remediation Recommendations

Also, provide an overall integer compliance readiness score between 0 and 100.
Respond in this exact JSON format:
{
  "score": 85,
  "reportMarkdown": "markdown content here"
}`;

      const reportResult = await aiOrchestrator.generateContent({
        prompt: reportPrompt,
        model: "claude-sonnet-4-6",
        enableGuardrails: true
      });

      let score = 75;
      let reportMarkdown = "# Mock Audit Report\nFailed to structure mock audit report dynamically.";
      
      try {
        const jsonMatch = reportResult.result.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          score = parsed.score || 75;
          reportMarkdown = parsed.reportMarkdown || reportMarkdown;
        } else {
          reportMarkdown = reportResult.result.content;
        }
      } catch (err) {
        logger.warn("[DigitalTwinService] Could not parse report JSON structure, falling back to raw output", { error: err });
        reportMarkdown = reportResult.result.content;
      }

      transcript.push({
        speaker: "system",
        message: `Simulation completed. Final score generated: ${score}%`,
        timestamp: new Date().toISOString()
      });

      await storage.updateMockAudit(auditId, {
        status: "completed",
        complianceScore: score,
        reportMarkdown,
        transcript,
        updatedAt: new Date()
      });

      logger.info(`[DigitalTwinService] Run ${auditId} completed successfully with score ${score}%`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      logger.error(`[DigitalTwinService] Simulation failure on run ${auditId}:`, { error: msg });
      
      try {
        await storage.updateMockAudit(auditId, {
          status: "failed",
          reportMarkdown: `# Mock Audit Simulation Failed\nAn error occurred during the simulation:\n\`\`\`\n${msg}\n\`\`\``,
          updatedAt: new Date()
        });
      } catch (dbErr) {
        logger.error("[DigitalTwinService] Failed to set error status in database", { error: dbErr });
      }
    }
  }
}

export const digitalTwinService = new DigitalTwinService();

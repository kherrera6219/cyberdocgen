import crypto from "crypto";
import { storage } from "../storage";
import { aiOrchestrator } from "./aiOrchestrator";
import { versionService } from "./versionService";
import { logger } from "../utils/logger";

export interface PolicyProposal {
  id: string;
  documentId: string;
  documentTitle: string;
  signalType: string;
  evidence: string;
  originalContent: string;
  proposedContent: string;
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
  createdAt: Date;
  status: "pending" | "approved" | "rejected";
}

export class PolicySyncService {
  private proposals: Map<string, PolicyProposal> = new Map();

  /**
   * Generates a new policy update proposal based on code scanner findings
   */
  async generatePolicyProposal(
    documentId: string,
    signalType: string,
    evidenceText: string,
    userId: string,
    organizationId: string
  ): Promise<PolicyProposal> {
    try {
      const doc = await storage.getDocument(documentId);
      if (!doc) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      logger.info("Generating policy diff proposal via AI", { documentId, signalType });

      const prompt = `You are a professional GRC compliance auditor. 
We have detected a technical system configuration or codebase signal in the host environment:
---
SIGNAL TYPE: ${signalType}
FINDINGS / EVIDENCE: ${evidenceText}
---

Your task is to review the active compliance policy document detailed below and rewrite it to accurately incorporate and address this technical change (e.g. by formalizing the configuration, defining controls, or attesting compliance). Keep all other unrelated sections exactly the same.

ACTIVE POLICY TITLE: ${doc.title}
ACTIVE POLICY CONTENT:
${doc.content}

Generate ONLY the updated policy document in Markdown. Do not include any meta-explanations, warnings, or preamble. Return the complete drop-in replacement document.`;

      const aiResponse = await aiOrchestrator.generateContent({
        prompt,
        model: "claude-sonnet-4-6",
        enableGuardrails: true,
        guardrailContext: {
          userId,
          organizationId
        }
      });

      if (aiResponse.blocked || !aiResponse.result.content) {
        throw new Error(aiResponse.blockedReason || "AI guardrails blocked proposal generation");
      }

      const proposedContent = aiResponse.result.content;
      const diff = this.calculateDiff(doc.content || "", proposedContent);
      const proposalId = crypto.randomUUID();

      const proposal: PolicyProposal = {
        id: proposalId,
        documentId,
        documentTitle: doc.title,
        signalType,
        evidence: evidenceText,
        originalContent: doc.content || "",
        proposedContent,
        diff,
        createdAt: new Date(),
        status: "pending"
      };

      this.proposals.set(proposalId, proposal);
      
      logger.info("Policy update proposal cached successfully", { proposalId, documentId });
      return proposal;
    } catch (error) {
      logger.error("Failed to generate policy diff proposal", { error, documentId });
      throw error;
    }
  }

  /**
   * Retrieve all cached pending proposals
   */
  getPendingProposals(): PolicyProposal[] {
    return Array.from(this.proposals.values())
      .filter(p => p.status === "pending")
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get specific proposal details
   */
  getProposal(id: string): PolicyProposal | undefined {
    return this.proposals.get(id);
  }

  /**
   * Approve and apply the policy proposal as a new version
   */
  async approveProposal(proposalId: string, userId: string): Promise<any> {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== "pending") {
      throw new Error(`Proposal is already ${proposal.status}`);
    }

    // Apply the proposal as a new major version using our VersionService
    const newVersion = await versionService.createVersion({
      documentId: proposal.documentId,
      title: proposal.documentTitle,
      content: proposal.proposedContent,
      changes: `Self-healing GRC Sync triggered by codebase signal: ${proposal.signalType}`,
      changeType: "major",
      createdBy: userId
    });

    proposal.status = "approved";
    this.proposals.set(proposalId, proposal);

    logger.info("Policy proposal successfully approved and versioned", { proposalId, version: newVersion.versionNumber });

    return newVersion;
  }

  /**
   * Reject and discard the proposed policy diff
   */
  rejectProposal(proposalId: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return false;
    }

    proposal.status = "rejected";
    this.proposals.set(proposalId, proposal);
    logger.info("Policy proposal rejected by administrator", { proposalId });
    return true;
  }

  private calculateDiff(content1: string, content2: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined && line2 !== undefined) {
        added.push(line2);
      } else if (line1 !== undefined && line2 === undefined) {
        removed.push(line1);
      } else if (line1 !== line2) {
        modified.push(`- ${line1}\n+ ${line2}`);
      }
    }

    return { added, removed, modified };
  }
}

export const policySyncService = new PolicySyncService();

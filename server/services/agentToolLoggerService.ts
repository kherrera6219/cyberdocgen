import crypto from "crypto";
import { storage } from "../storage";
import { logger } from "../utils/logger";

const LEDGER_HMAC_SECRET = process.env.AUDIT_LOG_SECRET || "grc-tamper-proof-ledger-ephemeral-key";

export class AgentToolLoggerService {
  /**
   * Log an automated agent tool execution in our tamper-proof compliance ledger
   */
  async logToolCall(params: {
    organizationId: string;
    agentId: string;
    agentName: string;
    toolName: string;
    inputs: any;
    outputs: any;
    status: 'success' | 'error' | 'denied';
    durationMs: number;
    ipAddress?: string;
  }) {
    try {
      const inputsStr = JSON.stringify(params.inputs || {});
      const outputsStr = JSON.stringify(params.outputs || {});
      
      // Calculate HMAC-SHA256 integrity seal
      const hmacPayload = `${params.organizationId}:${params.agentId}:${params.agentName}:${params.toolName}:${inputsStr}:${outputsStr}:${params.status}:${params.durationMs}`;
      const hmacSeal = crypto.createHmac("sha256", LEDGER_HMAC_SECRET)
        .update(hmacPayload)
        .digest("hex");

      const log = await storage.createAgentToolLog({
        organizationId: params.organizationId,
        agentId: params.agentId,
        agentName: params.agentName,
        toolName: params.toolName,
        inputs: params.inputs || {},
        outputs: params.outputs || {},
        status: params.status,
        durationMs: params.durationMs,
        ipAddress: params.ipAddress || "127.0.0.1",
        hmacSeal,
      });

      logger.info("[AgentToolLoggerService] Recorded tamper-proof agent tool execution", {
        id: log.id,
        toolName: params.toolName,
        agentName: params.agentName,
      });

      return log;
    } catch (error) {
      logger.error("[AgentToolLoggerService] Failed to record agent tool log:", error);
      throw error;
    }
  }

  /**
   * Verify the integrity of a tool log record
   */
  verifyLogIntegrity(log: any): boolean {
    try {
      const inputsStr = JSON.stringify(log.inputs || {});
      const outputsStr = JSON.stringify(log.outputs || {});
      const hmacPayload = `${log.organizationId}:${log.agentId}:${log.agentName}:${log.toolName}:${inputsStr}:${outputsStr}:${log.status}:${log.durationMs}`;
      const calculatedSeal = crypto.createHmac("sha256", LEDGER_HMAC_SECRET)
        .update(hmacPayload)
        .digest("hex");
      return calculatedSeal === log.hmacSeal;
    } catch {
      return false;
    }
  }
}

export const agentToolLoggerService = new AgentToolLoggerService();

import { db } from "../db";
import { agentToolLogs, type AgentToolLog, type InsertAgentToolLog } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IAgentToolLogRepository {
  getAgentToolLogs(organizationId: string): Promise<AgentToolLog[]>;
  getAgentToolLogsByAgent(agentId: string): Promise<AgentToolLog[]>;
  createAgentToolLog(log: InsertAgentToolLog): Promise<AgentToolLog>;
}

export function createAgentToolLogRepository(dbClient: typeof db): IAgentToolLogRepository {
  return {
    async getAgentToolLogs(organizationId: string): Promise<AgentToolLog[]> {
      try {
        return await dbClient.select()
          .from(agentToolLogs)
          .where(eq(agentToolLogs.organizationId, organizationId))
          .orderBy(desc(agentToolLogs.createdAt));
      } catch (error) {
        logger.error("Failed to get agent tool logs:", error);
        return [];
      }
    },

    async getAgentToolLogsByAgent(agentId: string): Promise<AgentToolLog[]> {
      try {
        return await dbClient.select()
          .from(agentToolLogs)
          .where(eq(agentToolLogs.agentId, agentId))
          .orderBy(desc(agentToolLogs.createdAt));
      } catch (error) {
        logger.error("Failed to get agent tool logs by agent ID:", error);
        return [];
      }
    },

    async createAgentToolLog(log: InsertAgentToolLog): Promise<AgentToolLog> {
      try {
        const [result] = await dbClient.insert(agentToolLogs).values(log).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create agent tool log:", error);
        throw error;
      }
    }
  };
}

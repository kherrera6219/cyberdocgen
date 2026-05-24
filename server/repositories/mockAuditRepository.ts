import { db } from "../db";
import { mockAudits, type MockAudit, type InsertMockAudit } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IMockAuditRepository {
  getMockAudit(id: string): Promise<MockAudit | undefined>;
  getMockAudits(organizationId: string): Promise<MockAudit[]>;
  createMockAudit(audit: InsertMockAudit): Promise<MockAudit>;
  updateMockAudit(id: string, audit: Partial<InsertMockAudit>): Promise<MockAudit | undefined>;
  deleteMockAudit(id: string): Promise<boolean>;
}

export function createMockAuditRepository(dbClient: typeof db): IMockAuditRepository {
  return {
    async getMockAudit(id: string): Promise<MockAudit | undefined> {
      try {
        const [result] = await dbClient.select().from(mockAudits).where(eq(mockAudits.id, id));
        return result;
      } catch (error) {
        logger.error("Failed to get mock audit:", error);
        return undefined;
      }
    },

    async getMockAudits(organizationId: string): Promise<MockAudit[]> {
      try {
        return await dbClient.select()
          .from(mockAudits)
          .where(eq(mockAudits.organizationId, organizationId))
          .orderBy(desc(mockAudits.createdAt));
      } catch (error) {
        logger.error("Failed to get mock audits:", error);
        return [];
      }
    },

    async createMockAudit(audit: InsertMockAudit): Promise<MockAudit> {
      try {
        const [result] = await dbClient.insert(mockAudits).values(audit).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create mock audit:", error);
        throw error;
      }
    },

    async updateMockAudit(id: string, audit: Partial<InsertMockAudit>): Promise<MockAudit | undefined> {
      try {
        const [result] = await dbClient.update(mockAudits)
          .set({ ...audit, updatedAt: new Date() })
          .where(eq(mockAudits.id, id))
          .returning();
        return result;
      } catch (error) {
        logger.error("Failed to update mock audit:", error);
        return undefined;
      }
    },

    async deleteMockAudit(id: string): Promise<boolean> {
      try {
        await dbClient.delete(mockAudits).where(eq(mockAudits.id, id));
        return true;
      } catch (error) {
        logger.error("Failed to delete mock audit:", error);
        return false;
      }
    }
  };
}

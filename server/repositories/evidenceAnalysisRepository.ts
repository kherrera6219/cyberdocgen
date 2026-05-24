import { db } from "../db";
import { evidenceAnalyses, type EvidenceAnalysis, type InsertEvidenceAnalysis } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IEvidenceAnalysisRepository {
  getEvidenceAnalysis(id: string): Promise<EvidenceAnalysis | undefined>;
  getEvidenceAnalysisByFile(evidenceId: string): Promise<EvidenceAnalysis | undefined>;
  getEvidenceAnalyses(organizationId: string): Promise<EvidenceAnalysis[]>;
  createEvidenceAnalysis(analysis: InsertEvidenceAnalysis): Promise<EvidenceAnalysis>;
  updateEvidenceAnalysis(id: string, analysis: Partial<InsertEvidenceAnalysis>): Promise<EvidenceAnalysis | undefined>;
  deleteEvidenceAnalysis(id: string): Promise<boolean>;
}

export function createEvidenceAnalysisRepository(dbClient: typeof db): IEvidenceAnalysisRepository {
  return {
    async getEvidenceAnalysis(id: string): Promise<EvidenceAnalysis | undefined> {
      try {
        const [result] = await dbClient.select().from(evidenceAnalyses).where(eq(evidenceAnalyses.id, id));
        return result;
      } catch (error) {
        logger.error("Failed to get evidence analysis:", error);
        return undefined;
      }
    },

    async getEvidenceAnalysisByFile(evidenceId: string): Promise<EvidenceAnalysis | undefined> {
      try {
        const [result] = await dbClient.select().from(evidenceAnalyses).where(eq(evidenceAnalyses.evidenceId, evidenceId));
        return result;
      } catch (error) {
        logger.error("Failed to get evidence analysis by file:", error);
        return undefined;
      }
    },

    async getEvidenceAnalyses(organizationId: string): Promise<EvidenceAnalysis[]> {
      try {
        return await dbClient.select().from(evidenceAnalyses).where(eq(evidenceAnalyses.organizationId, organizationId));
      } catch (error) {
        logger.error("Failed to get evidence analyses:", error);
        return [];
      }
    },

    async createEvidenceAnalysis(analysis: InsertEvidenceAnalysis): Promise<EvidenceAnalysis> {
      try {
        const [result] = await dbClient.insert(evidenceAnalyses).values(analysis).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create evidence analysis:", error);
        throw error;
      }
    },

    async updateEvidenceAnalysis(id: string, analysis: Partial<InsertEvidenceAnalysis>): Promise<EvidenceAnalysis | undefined> {
      try {
        const [result] = await dbClient.update(evidenceAnalyses)
          .set({ ...analysis, updatedAt: new Date() })
          .where(eq(evidenceAnalyses.id, id))
          .returning();
        return result;
      } catch (error) {
        logger.error("Failed to update evidence analysis:", error);
        return undefined;
      }
    },

    async deleteEvidenceAnalysis(id: string): Promise<boolean> {
      try {
        await dbClient.delete(evidenceAnalyses).where(eq(evidenceAnalyses.id, id));
        return true;
      } catch (error) {
        logger.error("Failed to delete evidence analysis:", error);
        return false;
      }
    }
  };
}

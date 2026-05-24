import { db } from "../db";
import { questionnaireSolvers, type QuestionnaireSolver, type InsertQuestionnaireSolver } from "@shared/schema";
import { eq } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IQuestionnaireSolverRepository {
  getQuestionnaireSolver(id: string): Promise<QuestionnaireSolver | undefined>;
  getQuestionnaireSolvers(organizationId: string): Promise<QuestionnaireSolver[]>;
  createQuestionnaireSolver(job: InsertQuestionnaireSolver): Promise<QuestionnaireSolver>;
  updateQuestionnaireSolver(id: string, job: Partial<InsertQuestionnaireSolver>): Promise<QuestionnaireSolver | undefined>;
  deleteQuestionnaireSolver(id: string): Promise<boolean>;
}

export function createQuestionnaireSolverRepository(dbClient: typeof db): IQuestionnaireSolverRepository {
  return {
    async getQuestionnaireSolver(id: string): Promise<QuestionnaireSolver | undefined> {
      try {
        const [result] = await dbClient.select().from(questionnaireSolvers).where(eq(questionnaireSolvers.id, id));
        return result;
      } catch (error) {
        logger.error("Failed to get questionnaire solver job:", error);
        return undefined;
      }
    },

    async getQuestionnaireSolvers(organizationId: string): Promise<QuestionnaireSolver[]> {
      try {
        return await dbClient.select().from(questionnaireSolvers).where(eq(questionnaireSolvers.organizationId, organizationId));
      } catch (error) {
        logger.error("Failed to get questionnaire solver jobs:", error);
        return [];
      }
    },

    async createQuestionnaireSolver(job: InsertQuestionnaireSolver): Promise<QuestionnaireSolver> {
      try {
        const [result] = await dbClient.insert(questionnaireSolvers).values(job).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create questionnaire solver job:", error);
        throw error;
      }
    },

    async updateQuestionnaireSolver(id: string, job: Partial<InsertQuestionnaireSolver>): Promise<QuestionnaireSolver | undefined> {
      try {
        const [result] = await dbClient.update(questionnaireSolvers)
          .set({ ...job, updatedAt: new Date() })
          .where(eq(questionnaireSolvers.id, id))
          .returning();
        return result;
      } catch (error) {
        logger.error("Failed to update questionnaire solver job:", error);
        return undefined;
      }
    },

    async deleteQuestionnaireSolver(id: string): Promise<boolean> {
      try {
        await dbClient.delete(questionnaireSolvers).where(eq(questionnaireSolvers.id, id));
        return true;
      } catch (error) {
        logger.error("Failed to delete questionnaire solver job:", error);
        return false;
      }
    }
  };
}

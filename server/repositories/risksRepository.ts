import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { risks, agentStateStore, type Risk, type InsertRisk, type AgentState, type InsertAgentState } from "@shared/schema";

export function createRisksRepository(dbClient: typeof db) {
  return {
    // Risk catalog operations
    async createRisk(risk: InsertRisk): Promise<Risk> {
      const inherentScore = risk.inherentLikelihood * risk.inherentImpact;
      const residualScore = risk.residualLikelihood * risk.residualImpact;

      const [newRisk] = await dbClient.insert(risks)
        .values({
          ...risk,
          inherentScore,
          residualScore,
        })
        .returning();
      return newRisk;
    },

    async getRisk(id: string): Promise<Risk | undefined> {
      const [risk] = await dbClient.select()
        .from(risks)
        .where(eq(risks.id, id));
      return risk || undefined;
    },

    async getRisks(orgId: string): Promise<Risk[]> {
      return await dbClient.select()
        .from(risks)
        .where(eq(risks.organizationId, orgId))
        .orderBy(desc(risks.createdAt));
    },

    async updateRisk(id: string, riskUpdates: Partial<InsertRisk>): Promise<Risk | undefined> {
      // If likelihood or impact is updated, recalculate the score
      const existing = await this.getRisk(id);
      if (!existing) return undefined;

      const likelihood = riskUpdates.inherentLikelihood ?? existing.inherentLikelihood;
      const impact = riskUpdates.inherentImpact ?? existing.inherentImpact;
      const inherentScore = likelihood * impact;

      const resLikelihood = riskUpdates.residualLikelihood ?? existing.residualLikelihood;
      const resImpact = riskUpdates.residualImpact ?? existing.residualImpact;
      const residualScore = resLikelihood * resImpact;

      const [updated] = await dbClient.update(risks)
        .set({
          ...riskUpdates,
          inherentScore,
          residualScore,
          updatedAt: new Date(),
        })
        .where(eq(risks.id, id))
        .returning();

      return updated || undefined;
    },

    async deleteRisk(id: string): Promise<boolean> {
      const result = await dbClient.delete(risks)
        .where(eq(risks.id, id))
        .returning();
      return result.length > 0;
    },

    // Agent State Store operations
    async getAgentState(agentId: string): Promise<AgentState | undefined> {
      const [state] = await dbClient.select()
        .from(agentStateStore)
        .where(eq(agentStateStore.agentId, agentId));
      return state || undefined;
    },

    async saveAgentState(state: {
      agentId: string;
      agentName: string;
      trajectory: any[];
      variables: any;
      status: string;
      organizationId: string;
    }): Promise<AgentState> {
      const existing = await this.getAgentState(state.agentId);

      if (existing) {
        const [updated] = await dbClient.update(agentStateStore)
          .set({
            trajectory: state.trajectory,
            variables: state.variables,
            status: state.status,
            updatedAt: new Date(),
          })
          .where(eq(agentStateStore.agentId, state.agentId))
          .returning();
        return updated;
      } else {
        const [inserted] = await dbClient.insert(agentStateStore)
          .values({
            agentId: state.agentId,
            agentName: state.agentName,
            trajectory: state.trajectory,
            variables: state.variables,
            status: state.status,
            organizationId: state.organizationId,
          })
          .returning();
        return inserted;
      }
    },

    async deleteAgentState(agentId: string): Promise<boolean> {
      const result = await dbClient.delete(agentStateStore)
        .where(eq(agentStateStore.agentId, agentId))
        .returning();
      return result.length > 0;
    }
  };
}

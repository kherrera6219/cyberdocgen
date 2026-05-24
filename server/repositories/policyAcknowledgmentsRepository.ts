import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import { policyAcknowledgments, type PolicyAcknowledgment, type InsertPolicyAcknowledgment } from "@shared/schema";

export function createPolicyAcknowledgmentsRepository(dbClient: typeof db) {
  return {
    async createPolicyAcknowledgment(ack: InsertPolicyAcknowledgment): Promise<PolicyAcknowledgment> {
      const [newAck] = await dbClient.insert(policyAcknowledgments)
        .values(ack)
        .returning();
      return newAck;
    },

    async getPolicyAcknowledgmentsByUser(userId: string): Promise<PolicyAcknowledgment[]> {
      return await dbClient.select()
        .from(policyAcknowledgments)
        .where(eq(policyAcknowledgments.userId, userId))
        .orderBy(desc(policyAcknowledgments.signedAt));
    },

    async getPolicyAcknowledgment(userId: string, documentId: string): Promise<PolicyAcknowledgment | undefined> {
      const [ack] = await dbClient.select()
        .from(policyAcknowledgments)
        .where(
          and(
            eq(policyAcknowledgments.userId, userId),
            eq(policyAcknowledgments.documentId, documentId)
          )
        );
      return ack || undefined;
    },

    async getPolicyAcknowledgmentsByDocument(documentId: string): Promise<PolicyAcknowledgment[]> {
      return await dbClient.select()
        .from(policyAcknowledgments)
        .where(eq(policyAcknowledgments.documentId, documentId))
        .orderBy(desc(policyAcknowledgments.signedAt));
    }
  };
}

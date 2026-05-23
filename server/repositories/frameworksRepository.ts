import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  documents, frameworkControlStatuses,
  Document, FrameworkControlStatus, InsertFrameworkControlStatus,
} from "@shared/schema";

type FrameworkEnum = "fedramp" | "iso27001" | "soc2" | "nist";

export function createFrameworksRepository(dbClient: typeof db) {
  const DEFAULT_LIMIT = 500;

  return {
    async getDocumentsByFramework(framework: string): Promise<Document[]> {
      return await db
        .select()
        .from(documents)
        .where(eq(documents.framework, framework as any))
        .orderBy(desc(documents.updatedAt))
        .limit(DEFAULT_LIMIT);
    },

    async getFrameworkControlStatuses(organizationId: string, framework: string): Promise<FrameworkControlStatus[]> {
      return await db
        .select()
        .from(frameworkControlStatuses)
        .where(
          and(
            eq(frameworkControlStatuses.organizationId, organizationId),
            eq(frameworkControlStatuses.framework, framework as FrameworkEnum)
          )
        );
    },

    async updateFrameworkControlStatus(
      organizationId: string,
      framework: string,
      controlId: string,
      updates: Partial<InsertFrameworkControlStatus>
    ): Promise<FrameworkControlStatus> {
      const [existing] = await db
        .select()
        .from(frameworkControlStatuses)
        .where(
          and(
            eq(frameworkControlStatuses.organizationId, organizationId),
            eq(frameworkControlStatuses.framework, framework as FrameworkEnum),
            eq(frameworkControlStatuses.controlId, controlId)
          )
        );

      // Filter out undefined values to prevent overwriting existing data with undefined
      const filteredUpdates: Record<string, unknown> = { updatedAt: new Date() };
      if (updates.status !== undefined) filteredUpdates.status = updates.status;
      if (updates.evidenceStatus !== undefined) filteredUpdates.evidenceStatus = updates.evidenceStatus;
      if (updates.notes !== undefined) filteredUpdates.notes = updates.notes;
      if (updates.updatedBy !== undefined) filteredUpdates.updatedBy = updates.updatedBy;

      if (existing) {
        const [updated] = await db
          .update(frameworkControlStatuses)
          .set(filteredUpdates)
          .where(eq(frameworkControlStatuses.id, existing.id))
          .returning();
        return updated;
      }

      const [newStatus] = await db
        .insert(frameworkControlStatuses)
        .values({
          organizationId,
          framework: framework as FrameworkEnum,
          controlId,
          status: updates.status ?? "not_started",
          evidenceStatus: updates.evidenceStatus ?? "none",
          notes: updates.notes,
          updatedBy: updates.updatedBy,
        })
        .returning();
      return newStatus;
    },
  };
}

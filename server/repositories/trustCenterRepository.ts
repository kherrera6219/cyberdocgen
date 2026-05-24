import { db } from "../db";
import { 
  trustCenterNdas, 
  trustCenterDownloads, 
  cloudFiles,
  type TrustCenterNda, 
  type InsertTrustCenterNda, 
  type TrustCenterDownload, 
  type InsertTrustCenterDownload 
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface ITrustCenterRepository {
  getTrustCenterNda(id: string): Promise<TrustCenterNda | undefined>;
  getTrustCenterNdaByEmail(organizationId: string, email: string): Promise<TrustCenterNda | undefined>;
  getTrustCenterNdaHistory(organizationId: string): Promise<TrustCenterNda[]>;
  createTrustCenterNda(nda: InsertTrustCenterNda): Promise<TrustCenterNda>;
  updateTrustCenterNda(id: string, nda: Partial<InsertTrustCenterNda>): Promise<TrustCenterNda | undefined>;
  
  createTrustCenterDownload(download: InsertTrustCenterDownload): Promise<TrustCenterDownload>;
  getTrustCenterDownloads(ndaId: string): Promise<TrustCenterDownload[]>;
  getTrustCenterDownloadsByOrg(organizationId: string): Promise<(TrustCenterDownload & { ndaEmail: string; ndaName: string; fileName: string })[]>;
}

export function createTrustCenterRepository(dbClient: typeof db): ITrustCenterRepository {
  return {
    async getTrustCenterNda(id: string): Promise<TrustCenterNda | undefined> {
      try {
        const [result] = await dbClient.select().from(trustCenterNdas).where(eq(trustCenterNdas.id, id));
        return result;
      } catch (error) {
        logger.error("Failed to get trust center NDA:", error);
        return undefined;
      }
    },

    async getTrustCenterNdaByEmail(organizationId: string, email: string): Promise<TrustCenterNda | undefined> {
      try {
        const [result] = await dbClient.select()
          .from(trustCenterNdas)
          .where(
            and(
              eq(trustCenterNdas.organizationId, organizationId),
              eq(trustCenterNdas.email, email.toLowerCase().trim()),
              eq(trustCenterNdas.status, 'active')
            )
          )
          .orderBy(desc(trustCenterNdas.signedAt));
        return result;
      } catch (error) {
        logger.error("Failed to get trust center NDA by email:", error);
        return undefined;
      }
    },

    async getTrustCenterNdaHistory(organizationId: string): Promise<TrustCenterNda[]> {
      try {
        return await dbClient.select()
          .from(trustCenterNdas)
          .where(eq(trustCenterNdas.organizationId, organizationId))
          .orderBy(desc(trustCenterNdas.signedAt));
      } catch (error) {
        logger.error("Failed to get trust center NDA history:", error);
        return [];
      }
    },

    async createTrustCenterNda(nda: InsertTrustCenterNda): Promise<TrustCenterNda> {
      try {
        const normalized = {
          ...nda,
          email: nda.email.toLowerCase().trim()
        };
        const [result] = await dbClient.insert(trustCenterNdas).values(normalized).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create trust center NDA:", error);
        throw error;
      }
    },

    async updateTrustCenterNda(id: string, nda: Partial<InsertTrustCenterNda>): Promise<TrustCenterNda | undefined> {
      try {
        const [result] = await dbClient.update(trustCenterNdas)
          .set(nda)
          .where(eq(trustCenterNdas.id, id))
          .returning();
        return result;
      } catch (error) {
        logger.error("Failed to update trust center NDA:", error);
        return undefined;
      }
    },

    async createTrustCenterDownload(download: InsertTrustCenterDownload): Promise<TrustCenterDownload> {
      try {
        const [result] = await dbClient.insert(trustCenterDownloads).values(download).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create trust center download record:", error);
        throw error;
      }
    },

    async getTrustCenterDownloads(ndaId: string): Promise<TrustCenterDownload[]> {
      try {
        return await dbClient.select()
          .from(trustCenterDownloads)
          .where(eq(trustCenterDownloads.ndaId, ndaId))
          .orderBy(desc(trustCenterDownloads.downloadedAt));
      } catch (error) {
        logger.error("Failed to get trust center downloads:", error);
        return [];
      }
    },

    async getTrustCenterDownloadsByOrg(organizationId: string): Promise<(TrustCenterDownload & { ndaEmail: string; ndaName: string; fileName: string })[]> {
      try {
        const results = await dbClient
          .select({
            id: trustCenterDownloads.id,
            ndaId: trustCenterDownloads.ndaId,
            fileId: trustCenterDownloads.fileId,
            downloadedAt: trustCenterDownloads.downloadedAt,
            ipAddress: trustCenterDownloads.ipAddress,
            ndaEmail: trustCenterNdas.email,
            ndaName: trustCenterNdas.fullName,
            fileName: cloudFiles.fileName,
          })
          .from(trustCenterDownloads)
          .innerJoin(trustCenterNdas, eq(trustCenterDownloads.ndaId, trustCenterNdas.id))
          .innerJoin(cloudFiles, eq(trustCenterDownloads.fileId, cloudFiles.id))
          .where(eq(trustCenterNdas.organizationId, organizationId))
          .orderBy(desc(trustCenterDownloads.downloadedAt));
        
        return results;
      } catch (error) {
        logger.error("Failed to get trust center downloads by org:", error);
        return [];
      }
    }
  };
}

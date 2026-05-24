import { db } from "../db";
import { vendors, vendorQuestionnaires, type Vendor, type InsertVendor, type VendorQuestionnaire, type InsertVendorQuestionnaire } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "../utils/logger";

export interface IVendorsRepository {
  getVendor(id: string): Promise<Vendor | undefined>;
  getVendors(organizationId: string): Promise<Vendor[]>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined>;
  deleteVendor(id: string): Promise<boolean>;

  getVendorQuestionnaire(id: string): Promise<VendorQuestionnaire | undefined>;
  getVendorQuestionnaires(vendorId: string): Promise<VendorQuestionnaire[]>;
  createVendorQuestionnaire(questionnaire: InsertVendorQuestionnaire): Promise<VendorQuestionnaire>;
  updateVendorQuestionnaire(id: string, questionnaire: Partial<InsertVendorQuestionnaire>): Promise<VendorQuestionnaire | undefined>;
  deleteVendorQuestionnaire(id: string): Promise<boolean>;
}

export function createVendorsRepository(dbClient: typeof db): IVendorsRepository {
  return {
    async getVendor(id: string): Promise<Vendor | undefined> {
      try {
        const [result] = await dbClient.select().from(vendors).where(eq(vendors.id, id));
        return result;
      } catch (error) {
        logger.error("Failed to get vendor:", error);
        return undefined;
      }
    },

    async getVendors(organizationId: string): Promise<Vendor[]> {
      try {
        return await dbClient.select().from(vendors).where(eq(vendors.organizationId, organizationId));
      } catch (error) {
        logger.error("Failed to get vendors:", error);
        return [];
      }
    },

    async createVendor(vendor: InsertVendor): Promise<Vendor> {
      try {
        const [result] = await dbClient.insert(vendors).values(vendor).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create vendor:", error);
        throw error;
      }
    },

    async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor | undefined> {
      try {
        const [result] = await dbClient.update(vendors)
          .set({ ...vendor, updatedAt: new Date() })
          .where(eq(vendors.id, id))
          .returning();
        return result;
      } catch (error) {
        logger.error("Failed to update vendor:", error);
        return undefined;
      }
    },

    async deleteVendor(id: string): Promise<boolean> {
      try {
        await dbClient.delete(vendors).where(eq(vendors.id, id));
        return true;
      } catch (error) {
        logger.error("Failed to delete vendor:", error);
        return false;
      }
    },

    async getVendorQuestionnaire(id: string): Promise<VendorQuestionnaire | undefined> {
      try {
        const [result] = await dbClient.select().from(vendorQuestionnaires).where(eq(vendorQuestionnaires.id, id));
        return result;
      } catch (error) {
        logger.error("Failed to get vendor questionnaire:", error);
        return undefined;
      }
    },

    async getVendorQuestionnaires(vendorId: string): Promise<VendorQuestionnaire[]> {
      try {
        return await dbClient.select().from(vendorQuestionnaires).where(eq(vendorQuestionnaires.vendorId, vendorId));
      } catch (error) {
        logger.error("Failed to get vendor questionnaires:", error);
        return [];
      }
    },

    async createVendorQuestionnaire(questionnaire: InsertVendorQuestionnaire): Promise<VendorQuestionnaire> {
      try {
        const [result] = await dbClient.insert(vendorQuestionnaires).values(questionnaire).returning();
        return result;
      } catch (error) {
        logger.error("Failed to create vendor questionnaire:", error);
        throw error;
      }
    },

    async updateVendorQuestionnaire(id: string, questionnaire: Partial<InsertVendorQuestionnaire>): Promise<VendorQuestionnaire | undefined> {
      try {
        const [result] = await dbClient.update(vendorQuestionnaires)
          .set({ ...questionnaire, updatedAt: new Date() })
          .where(eq(vendorQuestionnaires.id, id))
          .returning();
        return result;
      } catch (error) {
        logger.error("Failed to update vendor questionnaire:", error);
        return undefined;
      }
    },

    async deleteVendorQuestionnaire(id: string): Promise<boolean> {
      try {
        await dbClient.delete(vendorQuestionnaires).where(eq(vendorQuestionnaires.id, id));
        return true;
      } catch (error) {
        logger.error("Failed to delete vendor questionnaire:", error);
        return false;
      }
    }
  };
}

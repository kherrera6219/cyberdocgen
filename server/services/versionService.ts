import { db } from "../db";
import { documents, documentVersions, type InsertDocumentVersion, type Document, type DocumentVersion } from "@shared/schema";
import { logger } from "../utils/logger";
import { eq, desc, and } from "drizzle-orm";
import * as crypto from "crypto";

export interface CreateVersionData {
  documentId: string;
  title: string;
  content: string;
  changes?: string;
  changeType?: "major" | "minor" | "patch";
  createdBy: string;
}

export interface VersionComparison {
  version1: any;
  version2: any;
  diff: {
    added: string[];
    removed: string[];
    modified: string[];
  };
}

class VersionService {
  private calculateChecksum(content: string): string {
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
  }

  private calculateFileSize(content: string): number {
    return Buffer.byteLength(content, "utf8");
  }

  async createVersion(data: CreateVersionData): Promise<any> {
    try {
      // Get current document to determine next version number
      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, data.documentId))
        .limit(1);

      if (!document.length) {
        throw new Error("Document not found");
      }

      // Get latest version number
      const latestVersions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, data.documentId))
        .orderBy(desc(documentVersions.versionNumber))
        .limit(1);

      const nextVersionNumber = latestVersions.length > 0 
        ? latestVersions[0].versionNumber + 1 
        : 1;

      const versionData: InsertDocumentVersion = {
        documentId: data.documentId,
        versionNumber: nextVersionNumber,
        title: data.title,
        content: data.content,
        changes: data.changes,
        changeType: data.changeType || "minor",
        createdBy: data.createdBy,
        fileSize: this.calculateFileSize(data.content),
        checksum: this.calculateChecksum(data.content),
        status: "draft",
      };

      const [version] = await db
        .insert(documentVersions)
        .values(versionData)
        .returning();

      // Update document's current version
      await db
        .update(documents)
        .set({ 
          version: nextVersionNumber,
          content: data.content,
          title: data.title,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, data.documentId));

      logger.info("Document version created", {
        documentId: data.documentId,
        versionNumber: nextVersionNumber,
        createdBy: data.createdBy,
      });

      return version;
    } catch (error: any) {
      logger.error("Failed to create document version", {
        error: error.message,
        documentId: data.documentId,
      });
      throw error;
    }
  }

  async getVersionHistory(documentId: string): Promise<any[]> {
    try {
      const versions = await db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, documentId))
        .orderBy(desc(documentVersions.versionNumber));

      return versions;
    } catch (error: any) {
      logger.error("Failed to retrieve version history", {
        error: error.message,
        documentId,
      });
      throw error;
    }
  }

  async getVersion(documentId: string, versionNumber: number): Promise<any | null> {
    try {
      const [version] = await db
        .select()
        .from(documentVersions)
        .where(
          and(
            eq(documentVersions.documentId, documentId),
            eq(documentVersions.versionNumber, versionNumber)
          )
        )
        .limit(1);

      return version || null;
    } catch (error: any) {
      logger.error("Failed to retrieve document version", {
        error: error.message,
        documentId,
        versionNumber,
      });
      throw error;
    }
  }

  async restoreVersion(documentId: string, versionNumber: number, userId: string): Promise<DocumentVersion> {
    try {
      // Get the version to restore
      const versionToRestore = await this.getVersion(documentId, versionNumber);
      if (!versionToRestore) {
        throw new Error("Version not found");
      }

      // Create a new version from the restored content
      const restoredVersion = await this.createVersion({
        documentId,
        title: versionToRestore.title,
        content: versionToRestore.content,
        changes: `Restored from version ${versionNumber}`,
        changeType: "major",
        createdBy: userId,
      });

      logger.info("Document version restored", {
        documentId,
        restoredFromVersion: versionNumber,
        restoredBy: userId,
      });

      return restoredVersion;
    } catch (error: any) {
      logger.error("Failed to restore document version", {
        error: error.message,
        documentId,
        versionNumber,
      });
      throw error;
    }
  }

  async compareVersions(
    documentId: string, 
    version1: number, 
    version2: number
  ): Promise<VersionComparison> {
    try {
      const [v1, v2] = await Promise.all([
        this.getVersion(documentId, version1),
        this.getVersion(documentId, version2),
      ]);

      if (!v1 || !v2) {
        throw new Error("One or both versions not found");
      }

      // Simple diff implementation - in production, use a proper diff library
      const diff = this.calculateDiff(v1.content, v2.content);

      return {
        version1: v1,
        version2: v2,
        diff,
      };
    } catch (error: any) {
      logger.error("Failed to compare document versions", {
        error: error.message,
        documentId,
        version1,
        version2,
      });
      throw error;
    }
  }

  private calculateDiff(content1: string, content2: string): {
    added: string[];
    removed: string[];
    modified: string[];
  } {
    // Simple line-by-line diff
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    const added: string[] = [];
    const removed: string[] = [];
    const modified: string[] = [];

    // Basic diff algorithm - in production, use a proper diff library
    const maxLength = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLength; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 === undefined && line2 !== undefined) {
        added.push(line2);
      } else if (line1 !== undefined && line2 === undefined) {
        removed.push(line1);
      } else if (line1 !== line2) {
        modified.push(`- ${line1}\n+ ${line2}`);
      }
    }

    return { added, removed, modified };
  }

  async verifyIntegrity(documentId: string, versionNumber: number): Promise<boolean> {
    try {
      const version = await this.getVersion(documentId, versionNumber);
      if (!version) {
        return false;
      }

      const calculatedChecksum = this.calculateChecksum(version.content);
      const calculatedFileSize = this.calculateFileSize(version.content);

      return version.checksum === calculatedChecksum && 
             version.fileSize === calculatedFileSize;
    } catch (error: any) {
      logger.error("Failed to verify version integrity", {
        error: error.message,
        documentId,
        versionNumber,
      });
      return false;
    }
  }

  async deleteVersion(documentId: string, versionNumber: number): Promise<void> {
    try {
      // Don't allow deleting the current version
      const document = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);

      if (document.length > 0 && document[0].version === versionNumber) {
        throw new Error("Cannot delete current version");
      }

      await db
        .delete(documentVersions)
        .where(
          and(
            eq(documentVersions.documentId, documentId),
            eq(documentVersions.versionNumber, versionNumber)
          )
        );

      logger.info("Document version deleted", {
        documentId,
        versionNumber,
      });
    } catch (error: any) {
      logger.error("Failed to delete document version", {
        error: error.message,
        documentId,
        versionNumber,
      });
      throw error;
    }
  }
}

export const versionService = new VersionService();
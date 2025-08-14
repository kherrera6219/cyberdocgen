import type { InsertDocumentVersion, DocumentVersion } from "@shared/schema";
import { AuditService } from "./auditService";

/**
 * Version Service for managing document versions
 * Handles version creation, comparison, and restoration
 */
export class VersionService {
  
  /**
   * Create a new document version
   */
  static async createVersion(data: {
    documentId: string;
    title: string;
    content: string;
    changes: string;
    changeType: "major" | "minor" | "patch";
    createdBy: string;
    status?: "draft" | "published" | "archived";
  }): Promise<DocumentVersion> {
    // Get current highest version number
    const currentVersions = await this.getVersions(data.documentId);
    const nextVersionNumber = currentVersions.length > 0 
      ? Math.max(...currentVersions.map(v => v.versionNumber)) + 1 
      : 1;

    // Calculate file size and checksum
    const fileSize = Buffer.byteLength(data.content, 'utf8');
    const checksum = await this.generateChecksum(data.content);

    const versionData: InsertDocumentVersion = {
      documentId: data.documentId,
      versionNumber: nextVersionNumber,
      title: data.title,
      content: data.content,
      changes: data.changes,
      changeType: data.changeType,
      createdBy: data.createdBy,
      status: data.status || "draft",
      fileSize,
      checksum,
    };

    // In real implementation, save to database
    const newVersion: DocumentVersion = {
      ...versionData,
      id: `version-${Date.now()}`,
      createdAt: new Date(),
    };

    // Log audit trail
    await AuditService.logDocumentActivity({
      action: "update",
      documentId: data.documentId,
      userId: data.createdBy,
      newValues: {
        versionCreated: nextVersionNumber,
        changeType: data.changeType,
        changes: data.changes
      },
      metadata: {
        versionNumber: nextVersionNumber,
        changeType: data.changeType,
        fileSize
      }
    });

    return newVersion;
  }

  /**
   * Get all versions for a document
   */
  static async getVersions(documentId: string): Promise<DocumentVersion[]> {
    // In real implementation, query database
    // Return mock data for now
    const mockVersions: DocumentVersion[] = [
      {
        id: "ver-3",
        documentId,
        versionNumber: 3,
        title: "Information Security Policy v3.0",
        content: "# Information Security Policy v3.0\n\n## Overview...",
        changes: "Major update: Added cloud security controls, enhanced incident response",
        changeType: "major",
        createdBy: "user-1",
        createdAt: new Date("2024-08-14T16:00:00Z"),
        status: "published",
        fileSize: 45000,
        checksum: "a1b2c3d4e5f6..."
      },
      {
        id: "ver-2",
        documentId,
        versionNumber: 2,
        title: "Information Security Policy v2.1",
        content: "# Information Security Policy v2.1\n\n## Overview...",
        changes: "Minor update: Fixed typos, updated compliance references",
        changeType: "minor",
        createdBy: "user-1",
        createdAt: new Date("2024-08-10T14:30:00Z"),
        status: "archived",
        fileSize: 42000,
        checksum: "b2c3d4e5f6g7..."
      }
    ];

    return mockVersions.filter(v => v.documentId === documentId);
  }

  /**
   * Get a specific version
   */
  static async getVersion(versionId: string): Promise<DocumentVersion | null> {
    const allVersions = await this.getAllVersions();
    return allVersions.find(v => v.id === versionId) || null;
  }

  /**
   * Restore document to a specific version
   */
  static async restoreVersion(data: {
    documentId: string;
    versionId: string;
    restoredBy: string;
  }): Promise<DocumentVersion> {
    const version = await this.getVersion(data.versionId);
    if (!version) {
      throw new Error("Version not found");
    }

    // Create new version based on the restored version
    const restoredVersion = await this.createVersion({
      documentId: data.documentId,
      title: version.title + " (Restored)",
      content: version.content,
      changes: `Restored from version ${version.versionNumber}`,
      changeType: "minor",
      createdBy: data.restoredBy,
      status: "draft"
    });

    // Log audit trail
    await AuditService.logDocumentActivity({
      action: "update",
      documentId: data.documentId,
      userId: data.restoredBy,
      oldValues: { currentVersion: "previous" },
      newValues: { restoredFromVersion: version.versionNumber },
      metadata: {
        action: "version_restore",
        sourceVersionId: data.versionId,
        sourceVersionNumber: version.versionNumber
      }
    });

    return restoredVersion;
  }

  /**
   * Compare two versions
   */
  static async compareVersions(version1Id: string, version2Id: string): Promise<{
    version1: DocumentVersion;
    version2: DocumentVersion;
    differences: Array<{
      type: "addition" | "deletion" | "modification";
      line: number;
      content: string;
    }>;
  }> {
    const [version1, version2] = await Promise.all([
      this.getVersion(version1Id),
      this.getVersion(version2Id)
    ]);

    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }

    // Simple diff implementation (in real app, use a proper diff library)
    const lines1 = version1.content.split('\n');
    const lines2 = version2.content.split('\n');
    const differences = [];

    const maxLines = Math.max(lines1.length, lines2.length);
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i];
      const line2 = lines2[i];

      if (line1 !== line2) {
        if (!line1) {
          differences.push({
            type: "addition" as const,
            line: i + 1,
            content: line2
          });
        } else if (!line2) {
          differences.push({
            type: "deletion" as const,
            line: i + 1,
            content: line1
          });
        } else {
          differences.push({
            type: "modification" as const,
            line: i + 1,
            content: `"${line1}" → "${line2}"`
          });
        }
      }
    }

    return {
      version1,
      version2,
      differences
    };
  }

  /**
   * Archive old versions
   */
  static async archiveOldVersions(documentId: string, keepLatest: number = 5): Promise<number> {
    const versions = await this.getVersions(documentId);
    const sortedVersions = versions.sort((a, b) => b.versionNumber - a.versionNumber);
    
    if (sortedVersions.length <= keepLatest) {
      return 0;
    }

    const versionsToArchive = sortedVersions.slice(keepLatest);
    let archivedCount = 0;

    for (const version of versionsToArchive) {
      if (version.status !== "archived") {
        // In real implementation, update database
        version.status = "archived";
        archivedCount++;
      }
    }

    return archivedCount;
  }

  /**
   * Get version statistics
   */
  static async getVersionStatistics(documentId: string): Promise<{
    totalVersions: number;
    publishedVersions: number;
    draftVersions: number;
    archivedVersions: number;
    averageTimeBetweenVersions: number; // in hours
    changeTypeDistribution: Record<string, number>;
  }> {
    const versions = await this.getVersions(documentId);
    
    const stats = {
      totalVersions: versions.length,
      publishedVersions: versions.filter(v => v.status === "published").length,
      draftVersions: versions.filter(v => v.status === "draft").length,
      archivedVersions: versions.filter(v => v.status === "archived").length,
      averageTimeBetweenVersions: 0,
      changeTypeDistribution: {
        major: versions.filter(v => v.changeType === "major").length,
        minor: versions.filter(v => v.changeType === "minor").length,
        patch: versions.filter(v => v.changeType === "patch").length,
      }
    };

    // Calculate average time between versions
    if (versions.length > 1) {
      const sortedVersions = versions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      let totalHours = 0;
      
      for (let i = 1; i < sortedVersions.length; i++) {
        const timeDiff = sortedVersions[i].createdAt.getTime() - sortedVersions[i-1].createdAt.getTime();
        totalHours += timeDiff / (1000 * 60 * 60); // Convert to hours
      }
      
      stats.averageTimeBetweenVersions = totalHours / (versions.length - 1);
    }

    return stats;
  }

  /**
   * Generate checksum for content integrity
   */
  private static async generateChecksum(content: string): Promise<string> {
    // Simple hash implementation (in real app, use crypto)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Helper method to get all versions (for demo purposes)
   */
  private static async getAllVersions(): Promise<DocumentVersion[]> {
    // Mock data for all versions across all documents
    return [
      {
        id: "ver-3",
        documentId: "doc-1",
        versionNumber: 3,
        title: "Information Security Policy v3.0",
        content: "# Information Security Policy v3.0\n\n## Overview...",
        changes: "Major update: Added cloud security controls, enhanced incident response",
        changeType: "major",
        createdBy: "user-1",
        createdAt: new Date("2024-08-14T16:00:00Z"),
        status: "published",
        fileSize: 45000,
        checksum: "a1b2c3d4e5f6..."
      }
    ];
  }
}
import { db } from "../db";
import { evidenceSnapshots, cloudFiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { objectStorageService } from "./objectStorageService";
import { AppError } from "../utils/errorHandling";

export class SnapshotService {
  /**
   * Create a new evidence snapshot (Audit bucket)
   */
  async createSnapshot(organizationId: string, name: string) {
    const [snapshot] = await db
      .insert(evidenceSnapshots)
      .values({
        organizationId,
        name,
        status: "open",
      })
      .returning();
    return snapshot;
  }

  /**
   * Lock a snapshot to prevent further changes and generate a manifest
   */
  async lockSnapshot(snapshotId: string, organizationId: string) {
    const [snapshot] = await db
      .select()
      .from(evidenceSnapshots)
      .where(and(eq(evidenceSnapshots.id, snapshotId), eq(evidenceSnapshots.organizationId, organizationId)));

    if (!snapshot) {
      throw new AppError("Snapshot not found", 404, "NOT_FOUND");
    }

    if (snapshot.status === "locked") {
      throw new AppError("Snapshot is already locked", 400, "BAD_REQUEST");
    }

    // Generate Manifest
    const manifest = await this.generateManifest(snapshotId, organizationId);
    
    // Save Manifest to Storage
    const manifestPath = `data/docs/${snapshotId}/MANIFEST.json`;
    await objectStorageService.uploadFileFromBytes(
        "MANIFEST.json",
        Buffer.from(JSON.stringify(manifest, null, 2)),
        `data/docs/${snapshotId}`
    );

    // Update Status
    const [updatedSnapshot] = await db
      .update(evidenceSnapshots)
      .set({
        status: "locked",
        lockedAt: new Date(),
      })
      .where(eq(evidenceSnapshots.id, snapshotId))
      .returning();

    return updatedSnapshot;
  }

  /**
   * Generate a manifest of all files in the snapshot
   */
  async generateManifest(snapshotId: string, organizationId: string) {
    const files = await db
      .select()
      .from(cloudFiles)
      .where(and(eq(cloudFiles.snapshotId, snapshotId), eq(cloudFiles.organizationId, organizationId)));

    return {
      snapshotId,
      organizationId,
      generatedAt: new Date().toISOString(),
      fileCount: files.length,
      files: files.map((f: any) => ({
        id: f.id,
        name: f.fileName,
        path: f.filePath,
        hash: f.fileHash,
        category: f.category,
        size: f.fileSize,
        createdAt: f.createdAt,
      })),
    };
  }

  /**
   * Get all snapshots for an organization
   */
  async getSnapshots(organizationId: string) {
    return db
      .select()
      .from(evidenceSnapshots)
      .where(eq(evidenceSnapshots.organizationId, organizationId))
      .orderBy(evidenceSnapshots.createdAt);
  }
}

export const snapshotService = new SnapshotService();

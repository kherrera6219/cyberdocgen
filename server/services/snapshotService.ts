import { db } from "../db";
import { evidenceSnapshots, cloudFiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { objectStorageService } from "./objectStorageService";
import { AppError } from "../utils/errorHandling";
import { logger } from "../utils/logger";
import {
  computeSha256,
  createIntegrityEnvelope,
  stableStringify,
  type IntegrityEnvelope,
  verifyIntegrityEnvelope,
} from "../utils/dataIntegrity";
import AdmZip from "adm-zip";
import path from "path";

interface SnapshotManifestFile {
  id: string;
  name: string;
  path: string;
  hash: string | null;
  category: string | null;
  classification: "public" | "internal" | "confidential" | "restricted";
  size: number | null;
  createdAt: Date | null;
}

interface SnapshotManifestData {
  snapshotId: string;
  organizationId: string;
  generatedAt: string;
  fileCount: number;
  files: SnapshotManifestFile[];
}

export interface SnapshotManifest extends SnapshotManifestData {
  integrity: IntegrityEnvelope;
}

export interface SnapshotVerificationResult {
  valid: boolean;
  hashValid: boolean;
  hmacValid: boolean;
  checkedFiles: number;
  fileHashMismatches: string[];
  manifestGeneratedAt?: string;
}

interface EvidencePackageResult {
  packagePath: string;
  packageFilename: string;
  includedFiles: number;
  verification: SnapshotVerificationResult;
}

export class SnapshotService {
  private getManifestStoragePath(snapshotId: string): string {
    return `data/docs/${snapshotId}/MANIFEST.json`;
  }

  private classifyFile(category: string | null): "public" | "internal" | "confidential" | "restricted" {
    const normalized = (category || "").toLowerCase();
    if (normalized.includes("security")) {
      return "restricted";
    }
    if (normalized.includes("evidence")) {
      return "confidential";
    }
    if (normalized.includes("product")) {
      return "internal";
    }
    return "internal";
  }

  private createManifestData(
    snapshotId: string,
    organizationId: string,
    files: Array<any>
  ): SnapshotManifestData {
    return {
      snapshotId,
      organizationId,
      generatedAt: new Date().toISOString(),
      fileCount: files.length,
      files: files.map((f: any) => ({
        id: f.id,
        name: f.fileName,
        path: f.filePath,
        hash: f.fileHash || null,
        category: f.category || null,
        classification: this.classifyFile(f.category || null),
        size: f.fileSize || null,
        createdAt: f.createdAt || null,
      })),
    };
  }

  private createSignedManifest(manifestData: SnapshotManifestData): SnapshotManifest {
    const canonicalPayload = stableStringify(manifestData);
    return {
      ...manifestData,
      integrity: createIntegrityEnvelope(canonicalPayload),
    };
  }

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
    const manifestPath = this.getManifestStoragePath(snapshotId);
    const upload = await objectStorageService.uploadFileFromBytes(
      "MANIFEST.json",
      Buffer.from(JSON.stringify(manifest, null, 2)),
      `data/docs/${snapshotId}`
    );
    if (!upload.success) {
      throw new AppError(upload.error || "Failed to persist snapshot manifest", 500, "STORAGE_ERROR");
    }
    logger.info("Snapshot manifest persisted", { snapshotId, manifestPath });

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

    const manifestData = this.createManifestData(snapshotId, organizationId, files);
    return this.createSignedManifest(manifestData);
  }

  async getManifest(snapshotId: string, organizationId: string): Promise<SnapshotManifest> {
    const [snapshot] = await db
      .select()
      .from(evidenceSnapshots)
      .where(and(eq(evidenceSnapshots.id, snapshotId), eq(evidenceSnapshots.organizationId, organizationId)))
      .limit(1);

    if (!snapshot) {
      throw new AppError("Snapshot not found", 404, "NOT_FOUND");
    }

    const download = await objectStorageService.downloadFileAsBytes(this.getManifestStoragePath(snapshotId));
    if (!download.success || !download.data) {
      throw new AppError(download.error || "Snapshot manifest not found", 404, "NOT_FOUND");
    }

    try {
      const parsed = JSON.parse(Buffer.from(download.data).toString("utf8")) as SnapshotManifest;
      return parsed;
    } catch (error) {
      logger.error("Failed to parse snapshot manifest", { snapshotId, error });
      throw new AppError("Snapshot manifest is invalid", 500, "INVALID_MANIFEST");
    }
  }

  async verifyManifest(snapshotId: string, organizationId: string): Promise<SnapshotVerificationResult> {
    const manifest = await this.getManifest(snapshotId, organizationId);
    const { integrity, ...manifestData } = manifest;

    if (!integrity) {
      return {
        valid: false,
        hashValid: false,
        hmacValid: false,
        checkedFiles: 0,
        fileHashMismatches: [],
        manifestGeneratedAt: manifest.generatedAt,
      };
    }

    const manifestVerification = verifyIntegrityEnvelope(stableStringify(manifestData), integrity);
    const fileHashMismatches: string[] = [];
    let checkedFiles = 0;

    for (const file of manifest.files || []) {
      if (!file.hash || !file.path) {
        continue;
      }

      const download = await objectStorageService.downloadFileAsBytes(file.path);
      if (!download.success || !download.data) {
        fileHashMismatches.push(`${file.name}:missing`);
        continue;
      }

      checkedFiles += 1;
      const actualHash = computeSha256(Buffer.from(download.data));
      if (actualHash !== file.hash) {
        fileHashMismatches.push(`${file.name}:hash_mismatch`);
      }
    }

    return {
      valid: manifestVerification.valid && fileHashMismatches.length === 0,
      hashValid: manifestVerification.hashValid,
      hmacValid: manifestVerification.hmacValid,
      checkedFiles,
      fileHashMismatches,
      manifestGeneratedAt: manifest.generatedAt,
    };
  }

  async packageSnapshotEvidence(
    snapshotId: string,
    organizationId: string,
    options?: { includeSourceFiles?: boolean }
  ): Promise<EvidencePackageResult> {
    const includeSourceFiles = options?.includeSourceFiles ?? false;
    const manifest = await this.getManifest(snapshotId, organizationId);
    const verification = await this.verifyManifest(snapshotId, organizationId);

    const zip = new AdmZip();
    zip.addFile("manifest.json", Buffer.from(JSON.stringify(manifest, null, 2), "utf8"));
    zip.addFile("verification.json", Buffer.from(JSON.stringify(verification, null, 2), "utf8"));

    let includedFiles = 0;
    if (includeSourceFiles) {
      for (const file of manifest.files) {
        if (!file.path) {
          continue;
        }
        const downloaded = await objectStorageService.downloadFileAsBytes(file.path);
        if (!downloaded.success || !downloaded.data) {
          continue;
        }
        const safeName = path.basename(file.name || file.path);
        zip.addFile(`files/${safeName}`, Buffer.from(downloaded.data));
        includedFiles += 1;
      }
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const packageFilename = `evidence-package-${snapshotId}-${timestamp}.zip`;
    const packageFolder = `data/docs/${snapshotId}/packages`;
    const upload = await objectStorageService.uploadFileFromBytes(packageFilename, zip.toBuffer(), packageFolder);
    if (!upload.success || !upload.path) {
      throw new AppError(upload.error || "Failed to persist evidence package", 500, "STORAGE_ERROR");
    }

    logger.info("Evidence package generated", {
      snapshotId,
      packagePath: upload.path,
      includeSourceFiles,
      includedFiles,
    });

    return {
      packagePath: upload.path,
      packageFilename,
      includedFiles,
      verification,
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

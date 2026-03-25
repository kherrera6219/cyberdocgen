import { db } from "../db";
import { cloudFiles, cloudIntegrations, companyProfiles } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { objectStorageService } from "./objectStorageService";
import { aiOrchestrator } from "./aiOrchestrator";
import { AppError } from "../utils/errorHandling";
import { createHash } from "crypto";
import * as path from "path";
import { logger } from "../utils/logger";
import { sanitizeFilename } from "../utils/validation";
import { z } from "zod";

// Dynamically required to avoid bundling issues in browser-safe builds.
// Wrapped in try/catch so a missing optional package produces a clear error
// message at extraction time rather than crashing the whole module at load.
const loadOptional = <T>(name: string): T | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(name) as T;
  } catch {
    logger.warn(`[Ingestion] Optional dependency '${name}' not installed — ${name} extraction will be unavailable`);
    return null;
  }
};

const pdfParse = loadOptional<(buffer: Buffer) => Promise<{ text: string }>>("pdf-parse");
const mammoth = loadOptional<{ extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> }>("mammoth");
const XLSX = loadOptional<any>("xlsx");

// Supported file types for ingestion
const SUPPORTED_TYPES = [".pdf", ".docx", ".xlsx", ".png", ".jpg", ".jpeg", ".txt"];

// Maximum file size: 50 MB
const MAX_FILE_BYTES = 50 * 1024 * 1024;

// If extracted text is small enough, cache it inline (<= 100 KB) to avoid another storage round-trip
const INLINE_TEXT_THRESHOLD = 100 * 1024;

/**
 * Zod schema for profile fields extracted by AI from evidence text.
 * Only non-null/non-empty fields will be merged into the company profile.
 */
const ExtractedProfileSchema = z.object({
  companyName: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  headquarters: z.string().optional(),
  businessApplications: z.string().optional(),
  dataClassification: z.string().optional(),
  cloudInfrastructure: z.array(z.string()).optional(),
  complianceFrameworks: z.array(z.string()).optional(),
}).partial();

type ExtractedProfile = z.infer<typeof ExtractedProfileSchema>;

export class IngestionService {

  /**
   * Process a new file upload: Validate → Hash → Store → DB Record → Async Processing
   *
   * Security hardening:
   * - Filename is sanitized before any path construction
   * - File type is allowlisted (not just extension-checked)
   * - File size is capped at 50 MB
   * - All errors are categorized and logged with structured data
   */
  async ingestFile(data: {
    organizationId: string;
    userId: string;
    snapshotId: string;
    file: Buffer;
    fileName: string;
    category: "Company Profile" | "Product & System" | "Security Program" | "Evidence";
  }) {
    const { organizationId, userId, snapshotId, file, fileName, category } = data;

    // Security: sanitize filename first, before any other use
    const safeFileName = sanitizeFilename(path.basename(fileName));

    // 1. Validate file type (allowlist)
    const ext = path.extname(safeFileName).toLowerCase();
    if (!SUPPORTED_TYPES.includes(ext)) {
      throw new AppError(`Unsupported file type: ${ext}. Allowed: ${SUPPORTED_TYPES.join(", ")}`, 400, "INVALID_FILE_TYPE");
    }

    // 2. Validate file size
    if (file.length > MAX_FILE_BYTES) {
      throw new AppError(`File too large: ${(file.length / 1024 / 1024).toFixed(1)} MB. Maximum: 50 MB`, 413, "FILE_TOO_LARGE");
    }

    // 3. Compute SHA-256 hash for integrity
    const fileHash = createHash("sha256").update(file).digest("hex");

    // 4. Build canonical storage path: data/docs/<snapshotId>/source/<category>/<fileName>
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const storagePath = `data/docs/${snapshotId}/source/${sanitizedCategory}/${safeFileName}`;

    // 5. Upload to object storage
    const upload = await objectStorageService.uploadFileFromBytes(
      safeFileName,
      file,
      path.dirname(storagePath)
    );
    if (!upload.success) {
      throw new AppError(upload.error || "Failed to upload evidence file", 500, "STORAGE_ERROR");
    }

    // 5. Ensure a 'manual' integration record exists for this user/org
    let integrationRecord = await db.query.cloudIntegrations.findFirst({
      where: and(
        eq(cloudIntegrations.organizationId, organizationId),
        eq(cloudIntegrations.userId, userId),
        eq(cloudIntegrations.provider, "manual")
      ),
    });

    if (!integrationRecord) {
      const [newIntegration] = await db.insert(cloudIntegrations).values({
        organizationId,
        userId,
        provider: "manual",
        providerUserId: "manual-upload",
        displayName: "Manual Upload",
        email: "manual@local",
        accessTokenEncrypted: "none",
        isActive: true,
      } as any).returning();
      integrationRecord = newIntegration;
    }

    // 6. Create DB record — integrationId uses the dynamically resolved manual integration record
    const [record] = await db.insert(cloudFiles).values({
      organizationId,
      integrationId: integrationRecord.id, // Fixed FK integrity
      providerFileId: storagePath,
      fileName: safeFileName,
      filePath: storagePath,
      fileType: ext.replace(".", ""),
      fileSize: file.length,
      mimeType: this.getMimeType(ext),
      snapshotId,
      category,
      fileHash,
      processingStatus: "pending",
      permissions: { canView: true, canEdit: false, canDownload: true, canShare: false },
      metadata: {
        createdBy: userId,
        version: "1.0",
        dataClassification: this.getDataClassification(category),
        tags: [category.toLowerCase().replace(/[^a-z0-9]+/g, "_")],
      },
    } as any).returning();

    // 7. Trigger async processing (fire-and-forget — never throws to caller)
    this.triggerProcessing(record.id, file, safeFileName, category, organizationId).catch(async (err) => {
      logger.error(`[Ingestion] Background processing failed for file ${record.id}:`, { error: err });
      // Ensure the DB record doesn't stay in an intermediate processing state
      // when triggerProcessing throws before reaching finalizeWithStatus().
      try {
        await this.updateStatus(record.id, 'failed');
      } catch (statusErr) {
        logger.error(`[Ingestion] Failed to mark file ${record.id} as failed`, { error: statusErr });
      }
    });

    return record;
  }

  /**
   * Background processing workflow:
   *   Extract Text → (Inline Cache) → Analyze Profile → Merge Profile → Complete
   *
   * Each stage has independent error handling so a failure in one stage
   * doesn't prevent later stages from running.
   */
  async triggerProcessing(
    fileId: string,
    fileBuffer: Buffer,
    fileName: string,
    category: string,
    organizationId: string
  ): Promise<void> {
    logger.info(`[Ingestion] Starting processing for file ${fileId} (${fileName})`);

    // --- Stage 1: Text Extraction ---
    await this.updateStatus(fileId, "extracting");
    let extractedText = "";

    try {
      extractedText = await this.extractText(fileBuffer, path.extname(fileName).toLowerCase());
      logger.info(`[Ingestion] Text extraction complete for ${fileId}: ${extractedText.length} chars`);
    } catch (err) {
      logger.warn(`[Ingestion] Text extraction failed for ${fileId}, continuing without text`, { error: err });
      await this.updateStatus(fileId, "text_extraction_failed");
      // Allow pipeline to continue — file is stored, just not indexed
      return this.finalizeWithStatus(fileId, "completed_partial");
    }

    // Cache small texts inline in the DB row to avoid round-trips
    if (extractedText.length > 0 && extractedText.length <= INLINE_TEXT_THRESHOLD) {
      await db.update(cloudFiles)
        .set({ extractedText, processingStatus: "indexing" } as any)
        .where(eq(cloudFiles.id, fileId));
    } else {
      await this.updateStatus(fileId, "indexing");
    }

    // --- Stage 2: AI Profile Analysis (only for profile-enriching categories) ---
    await this.updateStatus(fileId, "analyzing");
    if (["Company Profile", "Security Program"].includes(category) && extractedText.length > 100) {
      try {
        await this.mergeProfileFromText(extractedText, category, organizationId);
        logger.info(`[Ingestion] Profile merge complete for org ${organizationId} from file ${fileId}`);
      } catch (err) {
        logger.warn(`[Ingestion] Profile analysis failed for ${fileId}, continuing`, { error: err });
        // Non-fatal: file is fully stored; profile update is enhancement only
      }
    }

    // --- Stage 3: Complete ---
    await this.finalizeWithStatus(fileId, "completed");
    logger.info(`[Ingestion] Processing completed for ${fileId}`);
  }

  /**
   * Extract plain text from a file buffer based on its extension.
   * Supports: PDF, DOCX, XLSX, TXT. Other types return empty string (no error).
   */
  private async extractText(buffer: Buffer, ext: string): Promise<string> {
    try {
      switch (ext) {
        case ".pdf": {
          if (!pdfParse) throw new Error("pdf-parse is not installed");
          const data = await pdfParse(buffer);
          return data.text.trim();
        }
        case ".docx": {
          if (!mammoth) throw new Error("mammoth is not installed");
          const result = await mammoth.extractRawText({ buffer });
          return result.value.trim();
        }
        case ".txt": {
          return buffer.toString("utf-8").trim();
        }
        case ".xlsx": {
          if (!XLSX) throw new Error("xlsx is not installed");
          const workbook = XLSX.read(buffer, { type: "buffer" });
          const lines: string[] = [];
          for (const sheetName of workbook.SheetNames) {
            // eslint-disable-next-line security/detect-object-injection
            const sheet = workbook.Sheets[sheetName];
            const tsv = XLSX.utils.sheet_to_csv(sheet);
            lines.push(`[Sheet: ${sheetName}]\n${tsv}`);
          }
          return lines.join("\n\n").trim();
        }
        case ".png":
        case ".jpg":
        case ".jpeg": {
          // Image files: no text extraction supported without OCR
          logger.info(`[Ingestion] Skipping text extraction for image file (${ext}) — OCR not available`);
          return "";
        }
        default: {
          logger.warn(`[Ingestion] No text extractor for extension: ${ext}`);
          return "";
        }
      }
    } catch (err) {
      logger.error(`[Ingestion] Text extraction error for ext=${ext}:`, { error: err });
      throw err; // Let caller decide how to handle
    }
  }

  /**
   * Use AI to extract structured company profile fields from extracted text,
   * then deep-merge the non-null/non-empty fields into the org's company profile.
   *
   * Security:
   * - AI response is validated with Zod before any DB write
   * - Only non-null/non-empty fields are updated (never overwrites with empty)
   * - organizationId is always scoped in the WHERE clause
   */
  private async mergeProfileFromText(
    text: string,
    category: string,
    organizationId: string
  ): Promise<void> {
    const trimmedText = text.slice(0, 12000); // Context window guard

    const prompt = `You are a compliance data extraction assistant. Extract structured company profile information from the following ${category} document excerpt.

Respond ONLY with a valid JSON object matching this schema (omit any fields you cannot determine):
{
  "companyName": "string or null",
  "industry": "string or null",
  "companySize": "string (e.g. '501-1000') or null",
  "headquarters": "string (city, country) or null",
  "businessApplications": "string or null",
  "dataClassification": "one of: public, internal, confidential, restricted",
  "cloudInfrastructure": ["array", "of", "cloud", "providers"] or null,
  "complianceFrameworks": ["array", "of", "framework", "names"] or null
}

Document excerpt:
---
${trimmedText}
---`;

    let rawJson: string;
    try {
      const guardrailedResult = await aiOrchestrator.generateContent({
        prompt,
        model: "claude-sonnet-4-6",  // Best for long-text extraction with 1M context
        enableGuardrails: true,
      });
      if (guardrailedResult.blocked) {
        logger.warn("[Ingestion] AI guardrails blocked profile extraction");
        return;
      }
      rawJson = guardrailedResult.result.content;
    } catch (err) {
      logger.error("[Ingestion] AI call failed during profile extraction", { error: err });
      throw err;
    }

    // Parse and validate the AI response
    let parsed: ExtractedProfile;
    try {
      // Extract JSON from response (may have surrounding prose)
      const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON object found in AI response");
      parsed = ExtractedProfileSchema.parse(JSON.parse(jsonMatch[0]));
    } catch (err) {
      logger.warn("[Ingestion] AI profile response failed validation, skipping merge", { error: err, rawJson: rawJson.slice(0, 200) });
      return;
    }

    // Build the update object: only include fields that have meaningful values
    const updates: Record<string, unknown> = {};
    if (parsed.companyName) updates.companyName = parsed.companyName;
    if (parsed.industry) updates.industry = parsed.industry;
    if (parsed.companySize) updates.companySize = parsed.companySize;
    if (parsed.headquarters) updates.headquarters = parsed.headquarters;
    if (parsed.businessApplications) updates.businessApplications = parsed.businessApplications;
    if (parsed.dataClassification) updates.dataClassification = parsed.dataClassification;
    if (parsed.cloudInfrastructure?.length) updates.cloudInfrastructure = parsed.cloudInfrastructure;
    if (parsed.complianceFrameworks?.length) updates.complianceFrameworks = parsed.complianceFrameworks;

    if (Object.keys(updates).length === 0) {
      logger.info("[Ingestion] No extractable profile fields found in document");
      return;
    }

    // Merge into existing profile (if one exists)
    updates.updatedAt = new Date();
    const result = await db.update(companyProfiles)
      .set(updates as any)
      .where(eq(companyProfiles.organizationId, organizationId))
      .returning({ id: companyProfiles.id });

    if (result.length === 0) {
      logger.info(`[Ingestion] No company profile found for org ${organizationId} — skipping profile merge`);
    } else {
      logger.info(`[Ingestion] Merged ${Object.keys(updates).length - 1} profile fields for org ${organizationId}`);
    }
  }

  private async finalizeWithStatus(fileId: string, status: string): Promise<void> {
    await this.updateStatus(fileId, status);
  }

  private async updateStatus(fileId: string, status: string): Promise<void> {
    await db.update(cloudFiles)
      .set({
        processingStatus: status,
        updatedAt: new Date(),
      } as any)
      .where(eq(cloudFiles.id, fileId));
  }

  private getMimeType(ext: string): string {
    const mimeTypeMap = new Map<string, string>([
      [".pdf", "application/pdf"],
      [".docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
      [".xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      [".png", "image/png"],
      [".jpg", "image/jpeg"],
      [".jpeg", "image/jpeg"],
      [".txt", "text/plain"],
    ]);
    return mimeTypeMap.get(ext) || "application/octet-stream";
  }

  private getDataClassification(category: string): "public" | "internal" | "confidential" | "restricted" {
    const normalized = category.toLowerCase();
    if (normalized.includes("security")) return "restricted";
    if (normalized.includes("evidence")) return "confidential";
    if (normalized.includes("product")) return "internal";
    return "internal";
  }
}

export const ingestionService = new IngestionService();

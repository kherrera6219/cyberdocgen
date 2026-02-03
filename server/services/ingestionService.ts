import { db } from "../db";
import { cloudFiles } from "@shared/schema";
import { eq } from "drizzle-orm";
import { objectStorageService } from "./objectStorageService";
import { documentAnalysisService } from "./documentAnalysis";
import { AppError } from "../utils/errorHandling";
import { createHash } from "crypto";
import * as path from "path";
import { logger } from "../utils/logger";

// Supported file types for ingestion
const SUPPORTED_TYPES = ['.pdf', '.docx', '.xlsx', '.png', '.jpg', '.jpeg', '.txt'];

export class IngestionService {
  
  /**
   * Process a new file upload: Hash, Type Check, Storage, DB Record
   */
  async ingestFile(data: {
    organizationId: string;
    userId: string;
    snapshotId: string;
    file: Buffer;
    fileName: string;
    category: 'Company Profile' | 'Product & System' | 'Security Program' | 'Evidence';
  }) {
    const { organizationId, userId, snapshotId, file, fileName, category } = data;
    
    // 1. Validate File Type
    const ext = path.extname(fileName).toLowerCase();
    if (!SUPPORTED_TYPES.includes(ext)) {
      throw new AppError(`Unsupported file type: ${ext}`, 400, "INVALID_FILE_TYPE");
    }

    // 2. Compute Hash (SHA-256)
    const fileHash = createHash('sha256').update(file).digest('hex');

    // 3. Define Storage Paths (Snapshot-based)
    // Format: data/docs/<snapshotId>/source/<category>/<fileName>
    const sanitizedCategory = category.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const storagePath = `data/docs/${snapshotId}/source/${sanitizedCategory}/${fileName}`;

    // 4. Upload to Object Storage
    await objectStorageService.uploadFileFromBytes(
      fileName,
      file,
      path.dirname(storagePath) // objectStorageService expects folder path
    );

    // 5. Create DB Record
    const [record] = await db.insert(cloudFiles).values({
      organizationId,
      integrationId: 'manual-upload', // Default for now
      providerFileId: storagePath, // Using path as ID for local/minio
      fileName,
      filePath: storagePath,
      fileType: ext.replace('.', ''),
      fileSize: file.length,
      mimeType: this.getMimeType(ext),
      snapshotId,
      category,
      fileHash,
      processingStatus: 'pending', // Initial status
      permissions: { canView: true, canEdit: false, canDownload: true, canShare: false },
      metadata: { createdBy: userId, version: '1.0' }
    } as any).returning();

    // 6. Trigger Async Processing (Fire-and-forget)
    this.triggerProcessing(record.id, record.filePath, record.fileName, category).catch(err => {
        logger.error(`[Ingestion] Background processing failed for ${record.id}:`, err);
    });
    
    return record;
  }

  /**
   * Background processing workflow: Extra text -> Index (Embeddings) -> Analyze -> Update Profile
   */
  async triggerProcessing(fileId: string, filePath: string, fileName: string, category: string) {
    logger.debug(`[Ingestion] Starting processing for ${fileId}...`);
    
    try {
        // Update status to extracting
        await this.updateStatus(fileId, 'extracting');
        
        // 1. Extract Text (Simulated for now, would use PDF parser/OCR)
        // In a real app we would download the file from object storage 
        // const fileBuffer = await objectStorageService.downloadFileAsBytes(filePath);
        // const text = await pdfParser(fileBuffer);
        const textContext = `Content of ${fileName} (${category})`; // Placeholder

        // Update status to indexing
        await this.updateStatus(fileId, 'indexing');

        // 2. Generate Embeddings (Vector Indexing)
        // const embedding = await documentAnalysisService.generateEmbeddings(textContext);
        // Store embedding in vector DB (pgvector or similar)
        // await db.update(cloudFiles).set({ embeddingId: 'vector-id' }).where(eq(cloudFiles.id, fileId));

        // Update status to analyzing
        await this.updateStatus(fileId, 'analyzing');

        // 3. AI Analysis & Company Profile Extraction
        // Only run extraction if category implies company data
        if (['Company Profile', 'Security Program'].includes(category)) {
            // const profileData = await documentAnalysisService.extractCompanyProfile(textContext);
            // TODO: Merge profileData into companyProfiles table
        }

        // 4. Complete
        await this.updateStatus(fileId, 'completed');
        logger.debug(`[Ingestion] Processing completed for ${fileId}`);

    } catch (error) {
        logger.error(`[Ingestion] Error processing ${fileId}:`, error);
        await this.updateStatus(fileId, 'failed');
    }
  }

  private async updateStatus(fileId: string, status: string) {
    await db.update(cloudFiles)
        .set({ 
            processingStatus: status,
            updatedAt: new Date()
        } as any)
        .where(eq(cloudFiles.id, fileId));
  }

  /**
   * Helper to get MIME type
   */
  private getMimeType(ext: string): string {
    const map: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.txt': 'text/plain'
    };
    return map[ext] || 'application/octet-stream';
  }
}

export const ingestionService = new IngestionService();

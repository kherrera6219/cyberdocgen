import { db } from "../db";
import { 
  trustCenterNdas, 
  trustCenterDownloads, 
  cloudFiles, 
  documents,
  type TrustCenterNda,
  type TrustCenterDownload,
  type InsertTrustCenterNda
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { pdfSecurityService, type PDFSecurityConfig } from "./pdfSecurityService";
import { objectStorageService } from "./objectStorageService";
import { PDFDocument, StandardFonts } from "pdf-lib";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";
import { storage } from "../storage";

export class TrustCenterService {
  
  /**
   * List all security documents available in the trust center
   */
  async getTrustCenterDocuments(organizationId: string) {
    // Return all files in cloud_files that are categorized as 'Company Profile' or 'Security Program' 
    // AND all completed policies/documents from the documents table.
    const files = await db.select()
      .from(cloudFiles)
      .where(
        and(
          eq(cloudFiles.organizationId, organizationId),
          eq(cloudFiles.fileType, "pdf")
        )
      );

    const policies = await db.select()
      .from(documents)
      .where(
        and(
          eq(documents.companyProfileId, (
            await db.query.companyProfiles.findFirst({
              where: eq(cloudFiles.organizationId, organizationId)
            })
          )?.id || ""),
          eq(documents.status, "approved")
        )
      );

    return {
      files: files.map(f => ({
        id: f.id,
        name: f.fileName,
        type: "file",
        size: f.fileSize,
        category: f.category,
        updatedAt: f.updatedAt
      })),
      policies: policies.map(p => ({
        id: p.id,
        name: p.title,
        type: "policy",
        size: p.content.length,
        category: p.category,
        updatedAt: p.updatedAt
      }))
    };
  }

  /**
   * Ingest and cryptographically sign an NDA for a buyer
   */
  async signNda(data: {
    organizationId: string;
    fullName: string;
    email: string;
    companyName: string;
  }): Promise<TrustCenterNda> {
    const { organizationId, fullName, email, companyName } = data;
    
    // Generate a secure SHA-256 HMAC-like signature hash
    const signaturePayload = `${email}|${companyName}|${Date.now()}`;
    const signatureHash = crypto
      .createHmac("sha256", "CyberDocGenTrustCenterNDASecret")
      .update(signaturePayload)
      .digest("hex");

    const nda = await storage.createTrustCenterNda({
      organizationId,
      fullName,
      email,
      companyName,
      signatureHash,
      status: "active"
    });

    logger.info(`[TrustCenterService] NDA signed successfully for ${email} (${companyName})`);
    return nda;
  }

  /**
   * Verify whether a buyer has an active, signed NDA
   */
  async checkNdaStatus(organizationId: string, email: string): Promise<TrustCenterNda | undefined> {
    return await storage.getTrustCenterNdaByEmail(organizationId, email);
  }

  /**
   * Retrieves a file, applies a custom watermarking stamp and password lock, 
   * and logs the download transaction for continuous GRC audit trails.
   */
  async secureAndDownloadFile(params: {
    organizationId: string;
    ndaId: string;
    targetId: string;
    targetType: "file" | "policy";
    ipAddress?: string;
  }): Promise<{ filePath: string; fileName: string }> {
    const { organizationId, ndaId, targetId, targetType, ipAddress } = params;

    const nda = await storage.getTrustCenterNda(ndaId);
    if (!nda || nda.organizationId !== organizationId || nda.status !== "active") {
      throw new Error("Active NDA is required to download secure documents");
    }

    let fileBuffer: Buffer;
    let fileName: string;
    let fileIdForConfig = targetId;

    if (targetType === "file") {
      const fileRecord = await db.query.cloudFiles.findFirst({
        where: and(
          eq(cloudFiles.id, targetId),
          eq(cloudFiles.organizationId, organizationId)
        )
      });
      if (!fileRecord) {
        throw new Error("File not found in database catalog");
      }
      
      fileName = fileRecord.fileName;

      // Attempt to load the buffer
      const storageRes = await objectStorageService.downloadFileAsBytes(fileRecord.filePath);
      if (storageRes.success && storageRes.data) {
        fileBuffer = Buffer.isBuffer(storageRes.data) ? storageRes.data : Buffer.from(storageRes.data);
      } else {
        const localPath = path.resolve(process.cwd(), fileRecord.filePath);
        if (fs.existsSync(localPath)) {
          fileBuffer = await fs.promises.readFile(localPath);
        } else {
          // Check standard uploads folders
          const uploadsPath = path.resolve(process.cwd(), "uploads", path.basename(fileRecord.filePath));
          if (fs.existsSync(uploadsPath)) {
            fileBuffer = await fs.promises.readFile(uploadsPath);
          } else {
            throw new Error(`Source PDF file not found locally or in cloud storage at ${fileRecord.filePath}`);
          }
        }
      }
    } else {
      const policyRecord = await db.query.documents.findFirst({
        where: eq(documents.id, targetId)
      });
      if (!policyRecord) {
        throw new Error("Policy document not found");
      }

      fileName = `${policyRecord.title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}.pdf`;

      // Dynamically generate a clean PDF from the policy document
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      
      const { width, height } = page.getSize();
      
      // Draw Title
      page.drawText(policyRecord.title, {
        x: 50,
        y: height - 50,
        size: 20,
        font: boldFont
      });

      page.drawText(`Framework: ${policyRecord.framework} | Category: ${policyRecord.category}`, {
        x: 50,
        y: height - 75,
        size: 10,
        font
      });

      // Split policy body into simple readable lines
      const textLines = policyRecord.content.split("\n").flatMap(line => {
        // Simple word wrap
        const words = line.split(" ");
        const linesArr: string[] = [];
        let curLine = "";
        for (const w of words) {
          if (font.widthOfTextAtSize(curLine + " " + w, 10) > width - 100) {
            linesArr.push(curLine.trim());
            curLine = w;
          } else {
            curLine += " " + w;
          }
        }
        if (curLine) linesArr.push(curLine.trim());
        return linesArr;
      });

      let currentY = height - 120;
      for (const line of textLines) {
        if (currentY < 50) {
          page = pdfDoc.addPage();
          currentY = height - 50;
        }
        page.drawText(line, {
          x: 50,
          y: currentY,
          size: 10,
          font
        });
        currentY -= 15;
      }

      fileBuffer = Buffer.from(await pdfDoc.save());

      // Create a dummy/temp file record to satisfy pdfSecurityService if needed
      // Or we can query an existing placeholder file or pass targetId
      const existingFile = await db.query.cloudFiles.findFirst({
        where: eq(cloudFiles.organizationId, organizationId)
      });
      fileIdForConfig = existingFile?.id || targetId;
    }

    // Apply watermarking security rules dynamically
    const secureConfig: PDFSecurityConfig = {
      fileId: fileIdForConfig,
      organizationId,
      createdBy: nda.fullName,
      userPassword: "CyberDocGenSecurePassword2026", // Protect with standard user password
      encryptionLevel: "AES256",
      keyLength: 256,
      allowPrinting: true,
      allowCopying: false,
      allowModifying: false,
      watermark: {
        enabled: true,
        text: `RESTRICTED - FOR ${nda.companyName.toUpperCase()} ONLY - DOWNLOADED BY ${nda.fullName.toUpperCase()} (${nda.email})`,
        opacity: 0.25,
        position: "center"
      }
    };

    const secureResult = await pdfSecurityService.securePDF(fileBuffer, secureConfig);
    if (!secureResult.success || !secureResult.securedFileUrl) {
      throw new Error("Failed to apply watermarking and encryption safeguards to PDF");
    }

    // Log download transaction
    await storage.createTrustCenterDownload({
      ndaId: nda.id,
      fileId: fileIdForConfig,
      ipAddress: ipAddress || "unknown"
    });

    logger.info(`[TrustCenterService] Secured PDF downloaded successfully for NDA=${nda.id}`);
    return {
      filePath: secureResult.securedFileUrl,
      fileName
    };
  }
}

export const trustCenterService = new TrustCenterService();

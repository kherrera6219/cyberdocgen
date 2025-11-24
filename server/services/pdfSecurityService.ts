import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { pdfSecuritySettings, cloudFiles } from '@shared/schema';
import { encryptionService, DataClassification } from './encryption';
import { auditService, AuditAction, RiskLevel } from './auditService';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export interface PDFSecurityConfig {
  fileId: string;
  organizationId: string;
  createdBy: string;
  
  // Password protection
  userPassword?: string;
  ownerPassword?: string;
  
  // Permissions
  allowPrinting?: boolean;
  allowCopying?: boolean;
  allowModifying?: boolean;
  allowAnnotations?: boolean;
  allowFormFilling?: boolean;
  allowAssembly?: boolean;
  allowDegradedPrinting?: boolean;
  
  // Encryption
  encryptionLevel?: 'RC4_40' | 'RC4_128' | 'AES128' | 'AES256';
  keyLength?: 40 | 128 | 256;
  
  // Watermark
  watermark?: {
    enabled: boolean;
    text: string;
    opacity: number;
    position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

export interface PDFProcessingResult {
  success: boolean;
  securedFileUrl?: string;
  originalFileSize: number;
  securedFileSize: number;
  securityFeatures: {
    passwordProtected: boolean;
    permissionsRestricted: boolean;
    watermarkApplied: boolean;
    encryptionLevel: string;
  };
}

export class PDFSecurityService {
  private readonly UPLOAD_DIR = './uploads/secured-pdfs';

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * Apply comprehensive security to PDF file
   */
  async securePDF(
    fileBuffer: Buffer,
    config: PDFSecurityConfig
  ): Promise<PDFProcessingResult> {
    // Placeholder implementation - requires pdf-lib package
    logger.info('PDF security processing requested but not yet implemented', {
      fileId: config.fileId,
      encryptionLevel: config.encryptionLevel,
    });

    return {
      success: false,
      originalFileSize: fileBuffer.length,
      securedFileSize: 0,
      securityFeatures: {
        passwordProtected: false,
        permissionsRestricted: false,
        watermarkApplied: false,
        encryptionLevel: 'none',
      },
    };
  }

  /**
   * Add watermark to PDF document
   */
  private async addWatermark(
    pdfDoc: PDFDocument,
    watermarkConfig: NonNullable<PDFSecurityConfig['watermark']>
  ): Promise<void> {
    try {
      const pages = pdfDoc.getPages();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      
      const watermarkColor = rgb(0.7, 0.7, 0.7); // Light gray
      const fontSize = 24;
      const opacity = watermarkConfig.opacity;

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermarkConfig.text, fontSize);
        const textHeight = font.heightAtSize(fontSize);

        let x: number, y: number;

        switch (watermarkConfig.position) {
          case 'top-left':
            x = 50;
            y = height - textHeight - 50;
            break;
          case 'top-right':
            x = width - textWidth - 50;
            y = height - textHeight - 50;
            break;
          case 'bottom-left':
            x = 50;
            y = textHeight + 50;
            break;
          case 'bottom-right':
            x = width - textWidth - 50;
            y = textHeight + 50;
            break;
          case 'center':
          default:
            x = (width - textWidth) / 2;
            y = (height - textHeight) / 2;
            break;
        }

        // Add watermark text
        page.drawText(watermarkConfig.text, {
          x,
          y,
          size: fontSize,
          font,
          color: watermarkColor,
          opacity,
        });

        // Add diagonal watermark across page for center position
        if (watermarkConfig.position === 'center') {
          page.drawText(watermarkConfig.text, {
            x: width / 2 - textWidth / 2,
            y: height / 2 - textHeight / 2,
            size: fontSize * 1.5,
            font,
            color: watermarkColor,
            opacity: opacity * 0.5,
            rotate: {
              angle: Math.PI / 6, // 30 degrees
            },
          });
        }
      }

      logger.info('Watermark applied to PDF', {
        pages: pages.length,
        text: watermarkConfig.text,
        position: watermarkConfig.position,
        opacity: watermarkConfig.opacity,
      });
    } catch (error: any) {
      logger.error('Failed to add watermark to PDF', {
        error: error.message,
        watermarkConfig,
      });
      throw error;
    }
  }

  /**
   * Build permissions object for PDF encryption
   */
  private buildPermissions(config: PDFSecurityConfig) {
    return {
      printing: config.allowPrinting ? 'highQuality' : 'disabled',
      copying: config.allowCopying !== false,
      modifying: config.allowModifying !== false,
      annotating: config.allowAnnotations !== false,
      fillingForms: config.allowFormFilling !== false,
      documentAssembly: config.allowAssembly !== false,
    };
  }

  /**
   * Get encryption algorithm based on level
   */
  private getEncryptionAlgorithm(level: string): string {
    switch (level) {
      case 'AES256':
        return 'aes-256';
      case 'AES128':
        return 'aes-128';
      case 'RC4_128':
        return 'rc4-128';
      case 'RC4_40':
      default:
        return 'rc4-40';
    }
  }

  /**
   * Check if permissions are restrictive
   */
  private hasRestrictedPermissions(config: PDFSecurityConfig): boolean {
    return !(
      config.allowPrinting !== false &&
      config.allowCopying !== false &&
      config.allowModifying !== false &&
      config.allowAnnotations !== false
    );
  }

  /**
   * Save PDF security settings to database
   */
  private async savePDFSecuritySettings(
    config: PDFSecurityConfig,
    securedFilePath: string
  ): Promise<void> {
    try {
      const userPasswordEncrypted = config.userPassword
        ? JSON.stringify(await encryptionService.encryptSensitiveField(config.userPassword, DataClassification.RESTRICTED))
        : null;

      const ownerPasswordEncrypted = config.ownerPassword
        ? JSON.stringify(await encryptionService.encryptSensitiveField(config.ownerPassword, DataClassification.RESTRICTED))
        : null;

      await db.insert(pdfSecuritySettings).values({
        fileId: config.fileId,
        organizationId: config.organizationId,
        createdBy: config.createdBy,
        hasUserPassword: !!config.userPassword,
        hasOwnerPassword: !!config.ownerPassword,
        userPasswordEncrypted,
        ownerPasswordEncrypted,
        allowPrinting: config.allowPrinting || false,
        allowCopying: config.allowCopying || false,
        allowModifying: config.allowModifying || false,
        allowAnnotations: config.allowAnnotations || false,
        allowFormFilling: config.allowFormFilling || false,
        allowAssembly: config.allowAssembly || false,
        allowDegradedPrinting: config.allowDegradedPrinting || false,
        encryptionLevel: config.encryptionLevel || 'AES256',
        keyLength: config.keyLength || 256,
        hasWatermark: !!config.watermark?.enabled,
        watermarkText: config.watermark?.text,
        watermarkOpacity: config.watermark?.opacity?.toString(),
        watermarkPosition: config.watermark?.position || 'center',
      }).onConflictDoUpdate({
        target: [pdfSecuritySettings.fileId],
        set: {
          hasUserPassword: !!config.userPassword,
          hasOwnerPassword: !!config.ownerPassword,
          userPasswordEncrypted,
          ownerPasswordEncrypted,
          allowPrinting: config.allowPrinting || false,
          allowCopying: config.allowCopying || false,
          allowModifying: config.allowModifying || false,
          allowAnnotations: config.allowAnnotations || false,
          allowFormFilling: config.allowFormFilling || false,
          allowAssembly: config.allowAssembly || false,
          allowDegradedPrinting: config.allowDegradedPrinting || false,
          encryptionLevel: config.encryptionLevel || 'AES256',
          keyLength: config.keyLength || 256,
          hasWatermark: !!config.watermark?.enabled,
          watermarkText: config.watermark?.text,
          watermarkOpacity: config.watermark?.opacity?.toString(),
          watermarkPosition: config.watermark?.position || 'center',
          updatedAt: new Date(),
        },
      });

      logger.info('PDF security settings saved', {
        fileId: config.fileId,
        securedFilePath,
      });
    } catch (error: any) {
      logger.error('Failed to save PDF security settings', {
        fileId: config.fileId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get PDF security settings
   */
  async getPDFSecuritySettings(fileId: string) {
    return db.query.pdfSecuritySettings.findFirst({
      where: eq(pdfSecuritySettings.fileId, fileId),
    });
  }

  /**
   * Remove PDF security settings
   */
  async removePDFSecurity(fileId: string, userId: string): Promise<boolean> {
    try {
      const settings = await this.getPDFSecuritySettings(fileId);
      if (!settings) {
        return false;
      }

      await db.delete(pdfSecuritySettings)
        .where(eq(pdfSecuritySettings.fileId, fileId));

      // Audit log
      await auditService.logAuditEvent({
        userId,
        action: AuditAction.DELETE,
        resourceType: 'pdf_security_removed',
        resourceId: fileId,
        ipAddress: '127.0.0.1',
        riskLevel: RiskLevel.MEDIUM,
        additionalContext: {
          previousEncryption: settings.encryptionLevel,
          hadWatermark: settings.hasWatermark,
        },
      });

      logger.info('PDF security settings removed', { fileId, userId });
      return true;
    } catch (error: any) {
      logger.error('Failed to remove PDF security settings', {
        fileId,
        userId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
      logger.info('Created secured PDF upload directory', { path: this.UPLOAD_DIR });
    }
  }
}

export const pdfSecurityService = new PDFSecurityService();
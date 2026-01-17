import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pdfSecurityService } from '../../server/services/pdfSecurityService';
import { db } from '../../server/db';
import { auditService } from '../../server/services/auditService';
import { encryptionService } from '../../server/services/encryption';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

// Mocks
vi.mock('../../server/db', () => ({
    db: {
        query: {
            cloudFiles: { findFirst: vi.fn() },
            pdfSecuritySettings: { findFirst: vi.fn() }
        },
        update: vi.fn(),
        insert: vi.fn(),
        delete: vi.fn()
    }
}));

vi.mock('../../server/services/auditService', () => ({
    auditService: {
        logAuditEvent: vi.fn()
    },
    AuditAction: {
        CREATE: 'CREATE',
        READ: 'READ',
        UPDATE: 'UPDATE',
        DELETE: 'DELETE'
    },
    RiskLevel: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    }
}));

vi.mock('../../server/services/encryption', () => ({
    encryptionService: {
        encryptSensitiveField: vi.fn(val => Promise.resolve({ encrypted: val }))
    },
    DataClassification: { RESTRICTED: 'restricted' } // Add the enum-like object
}));

vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(() => true),
        mkdirSync: vi.fn(),
        promises: {
            writeFile: vi.fn()
        }
    }
}));

// Mock pdf-lib
const { mockPDFDoc } = vi.hoisted(() => ({
    mockPDFDoc: {
        setSubject: vi.fn(),
        setKeywords: vi.fn(),
        save: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
        getPages: vi.fn(() => []), // Return empty array to avoid page logic for simple tests
        embedFont: vi.fn(),
        drawText: vi.fn(),
        getSize: vi.fn(() => ({ width: 500, height: 800 })),
    }
}));

vi.mock('pdf-lib', async () => {
    const actual = await vi.importActual('pdf-lib');
    return {
        ...actual,
        PDFDocument: {
            load: vi.fn().mockResolvedValue(mockPDFDoc)
        }
    };
});


describe('PDFSecurityService', () => {
    const mockFileId = 'file-123';
    const mockConfig = {
        fileId: mockFileId,
        organizationId: 'org-1',
        createdBy: 'user-1',
        userPassword: 'password123',
        encryptionLevel: 'AES256' as const,
        watermark: {
            enabled: true,
            text: 'CONFIDENTIAL',
            opacity: 0.5,
            position: 'center' as const
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Setup chaining mocks for db
        const mockWhere = vi.fn().mockResolvedValue([]);
        const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
        (db.update as any).mockReturnValue({ set: mockSet });
        
        const mockOnConflict = vi.fn();
        const mockValues = vi.fn().mockReturnValue({ onConflictDoUpdate: mockOnConflict });
        (db.insert as any).mockReturnValue({ values: mockValues });
        
        (db.delete as any).mockReturnValue({ where: mockWhere });
    });

    describe('securePDF', () => {
        it('secures a PDF successfully', async () => {
            (db.query.cloudFiles.findFirst as any).mockResolvedValue({ id: mockFileId });
            
            const result = await pdfSecurityService.securePDF(Buffer.from('pdf content'), mockConfig);
            
            expect(result.success).toBe(true);
            expect(PDFDocument.load).toHaveBeenCalled();
            expect(mockPDFDoc.save).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalled();
            expect(auditService.logAuditEvent).toHaveBeenCalled();
        });

        it('throws if file metadata not found', async () => {
             (db.query.cloudFiles.findFirst as any).mockResolvedValue(null);
             
             await expect(pdfSecurityService.securePDF(Buffer.from('pdf'), mockConfig))
                .rejects.toThrow('metadata not found');
        });
    });
    
    describe('removePDFSecurity', () => {
        it('removes security settings', async () => {
            (db.query.pdfSecuritySettings.findFirst as any).mockResolvedValue({ fileId: mockFileId });
            
            const result = await pdfSecurityService.removePDFSecurity(mockFileId, 'user-1');
            
            expect(result).toBe(true);
            expect(db.delete).toHaveBeenCalled();
            expect(auditService.logAuditEvent).toHaveBeenCalled();
        });

        it('returns false if settings do not exist', async () => {
            (db.query.pdfSecuritySettings.findFirst as any).mockResolvedValue(null);
             
             const result = await pdfSecurityService.removePDFSecurity(mockFileId, 'user-1');
             
             expect(result).toBe(false);
             expect(db.delete).not.toHaveBeenCalled();
        });
    });
});

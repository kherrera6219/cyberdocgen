import { describe, it, expect, vi, beforeEach } from 'vitest';
import { documentWorkflowService } from '../../server/services/documentWorkflowService';
import { storage } from '../../server/storage';
import { auditService } from '../../server/services/auditService';

vi.mock('../../server/storage', () => ({
  storage: {
    getDocument: vi.fn(),
    updateDocument: vi.fn(),
    createDocumentApproval: vi.fn().mockResolvedValue({ id: 'app-1' }),
    getDocumentApprovals: vi.fn(),
    updateDocumentApproval: vi.fn(),
    createNotification: vi.fn(),
  }
}));

vi.mock('../../server/services/auditService', () => ({
  auditService: {
    logAuditEvent: vi.fn(),
  },
  AuditAction: { UPDATE: 'UPDATE' },
  RiskLevel: { MEDIUM: 'medium' }
}));

vi.mock('../../server/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  }
}));

describe('DocumentWorkflowService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeTransition', () => {
    it('should transition from draft to review', async () => {
      // @ts-ignore
      storage.getDocument.mockResolvedValue({ id: 'd1', status: 'draft', title: 'Test Doc' });
      // @ts-ignore
      storage.updateDocument.mockResolvedValue({});

      const result = await documentWorkflowService.executeTransition('d1', 'submit_for_review', 'u1');

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('review');
      expect(storage.updateDocument).toHaveBeenCalledWith('d1', { status: 'review' });
      expect(auditService.logAuditEvent).toHaveBeenCalled();
      expect(storage.createNotification).toHaveBeenCalled();
    });

    it('should require approval to transition from review to approved', async () => {
      // @ts-ignore
      storage.getDocument.mockResolvedValue({ id: 'd1', status: 'review', title: 'Test Doc' });
      
      // Mock no approval found
      // @ts-ignore
      storage.getDocumentApprovals.mockResolvedValue([]);

      const result = await documentWorkflowService.executeTransition('d1', 'approve', 'u1');

      // Should fail because approval is required and we mocked checkApprovalStatus to return false (via getDocumentApprovals)
      expect(result.success).toBe(false);
      expect(result.message).toContain('Approval required');
    });

    it('should fail with invalid transition', async () => {
      // @ts-ignore
      storage.getDocument.mockResolvedValue({ id: 'd1', status: 'draft', title: 'Test Doc' });

      // Draft cannot go to published directly
      const result = await documentWorkflowService.executeTransition('d1', 'publish', 'u1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Invalid transition');
    });
  });

  describe('createApprovalRequest', () => {
    it('should create approval request for document in review', async () => {
      // @ts-ignore
      storage.getDocument.mockResolvedValue({ id: 'd1', status: 'review', title: 'Test Doc' });

      const request = {
        documentId: 'd1',
        requestedBy: 'u1',
        approverIds: ['u2'],
        comments: 'Please approve'
      };

      // @ts-ignore
      const result = await documentWorkflowService.createApprovalRequest(request);

      expect(result.success).toBe(true);
      expect(storage.createDocumentApproval).toHaveBeenCalled();
      expect(storage.createNotification).toHaveBeenCalled(); // Notify approver
    });
  });
});

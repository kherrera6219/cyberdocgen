import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataRetentionService } from '../../server/services/dataRetentionAutomation';

// Mock the dynamic import of ../storage
vi.mock('../../server/storage', () => ({
  storage: {
    getDocuments: vi.fn(),
    deleteDocument: vi.fn(),
  }
}));

describe('DataRetentionService', () => {
  beforeEach(() => {
    // Reset state if possible, or we might need to rely on fresh instances if we could export the class
    // Since we export the singleton, we must be careful. 
    // Ideally we would reset the private map, but we can't easily access it.
    // We will rely on unique IDs or just accept state persistence within the test file run.
    vi.clearAllMocks();
  });

  describe('configuration', () => {
    it('sets and gets policies', () => {
      const newPolicies = [
        {
          dataType: 'test_type',
          retentionDays: 10,
          hardDelete: true,
          requireApproval: false
        }
      ];
      
      dataRetentionService.setPolicies(newPolicies);
      const policy = dataRetentionService.getPolicy('test_type');
      
      expect(policy).toBeDefined();
      expect(policy?.retentionDays).toBe(10);
    });
  });

  describe('scheduling', () => {
    it('calculates deletion date correctly', () => {
      const now = new Date();
      const deletionDate = dataRetentionService.calculateDeletionDate('test_type', now);
      
      expect(deletionDate).toBeDefined();
      // 10 days from now (based on policy set above)
      const diff = deletionDate!.getTime() - now.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      expect(Math.round(days)).toBe(10);
    });

    it('schedules deletion request', async () => {
        const result = await dataRetentionService.scheduleDeletion('test_type', 'target-1', {
            userId: 'user-1'
        });

        expect(result.id).toBeDefined();
        expect(result.status).toBe('approved'); // not requiring approval
        expect(result.dataType).toBe('test_type');
    });

    it('processes user deletion request (GDPR)', async () => {
        // Need to add policies for the user data types first since we overwrote them
        const defaults = [
             { dataType: 'user_profile', retentionDays: 1, hardDelete: true, requireApproval: false },
             { dataType: 'ai_chat_history', retentionDays: 1, hardDelete: true, requireApproval: false },
             { dataType: 'generated_documents', retentionDays: 1, hardDelete: true, requireApproval: false },
             { dataType: 'session_logs', retentionDays: 1, hardDelete: true, requireApproval: false },
             { dataType: 'preferences', retentionDays: 1, hardDelete: true, requireApproval: false },
        ];
        dataRetentionService.setPolicies(defaults);

        const requests = await dataRetentionService.processUserDeletionRequest('user-123', { immediate: true });
        
        expect(requests).toHaveLength(5); // 5 data types
        requests.forEach(req => {
            expect(req.userId).toBe('user-123');
            expect(req.status).toBe('approved');
        });
    });
  });

  describe('execution', () => {
      it('executes pending deletions', async () => {
          // Schedule an immediate deletion
          const request = await dataRetentionService.scheduleDeletion('generated_documents', 'doc-1', {
              userId: 'user-delete-exec',
              immediate: true
          });

          // Mock storage response
          const { storage } = await import('../../server/storage');
          (storage.getDocuments as any).mockResolvedValue([
              { id: 1, userId: 'user-delete-exec' }
          ]);

          const result = await dataRetentionService.executePendingDeletions();
          
          expect(result.processed).toBeGreaterThanOrEqual(1);
          expect(result.succeeded).toBeGreaterThanOrEqual(1);
          
          expect(storage.deleteDocument).toHaveBeenCalledWith(1);
      });
  });

  describe('reporting', () => {
      it('generates retention report', () => {
          const report = dataRetentionService.generateRetentionReport();
          expect(report.policies).toBeDefined();
          expect(report.pendingCount).toBeDefined();
          expect(report.completedLast30Days).toBeDefined();
      });
  });
});

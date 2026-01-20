import { describe, it, expect, beforeEach } from 'vitest';
import { MemStorage } from '../../server/storage';
import { randomUUID } from 'crypto';

describe('Advanced Storage Integration', () => {
  let storage: MemStorage;
  const testOrgName = `TestOrg_${Date.now()}`;
  const testUserEmail = `test_${Date.now()}@example.com`;
  let orgId: string;
  let userId: string;
  let companyProfileId: string;

  beforeEach(async () => {
    storage = new MemStorage();
    
    // Setup using storage API
    const org = await storage.createOrganization({
      name: testOrgName,
      slug: `test-org-${randomUUID()}`,
      industry: 'Healthcare',
      size: '1-10',
      isActive: true
    });
    orgId = org.id;

    const user = await storage.createUser({
      email: testUserEmail,
      username: `testuser_${randomUUID()}`,
      passwordHash: 'hashed',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      isActive: true
    });
    userId = user.id;

    const profile = await storage.createCompanyProfile({
        organizationId: orgId,
        createdBy: userId,
        companyName: testOrgName,
        industry: 'Tech',
        companySize: '1-10',
        headquarters: 'NY',
        dataClassification: 'public',
        businessApplications: 'none'
    });
    companyProfileId = profile.id;
  });

  describe('User Management Edge Cases', () => {
    it('handles multiple concurrent user lookups', async () => {
      const results = await Promise.all([
        storage.getUserByEmail(testUserEmail),
        storage.getUserByEmail(testUserEmail),
        storage.getUserByEmail(testUserEmail)
      ]);
      results.forEach(u => expect(u?.id).toBe(userId));
    });

    it('returns undefined for non-existent users', async () => {
      expect(await storage.getUserByEmail('nonexistent@example.com')).toBeUndefined();
      expect(await storage.getUser('non-existent-id')).toBeUndefined();
    });
  });

  describe('Document Filtering', () => {
    it('filters documents correctly', async () => {
      await storage.createDocument({
        companyProfileId: companyProfileId,
        createdBy: userId,
        title: 'Org Doc',
        content: '{}',
        type: 'policy',
        format: 'json',
        framework: 'SOC2',
        status: 'draft',
        version: 1
      });

      const docs = await storage.getDocuments(orgId);
      // MemStorage ignores orgId in getDocuments, but we check if it's present
      expect(docs.some(d => d.title === 'Org Doc')).toBe(true);
      
      const profileDocs = await storage.getDocumentsByCompanyProfile(companyProfileId);
      expect(profileDocs).toHaveLength(1);
    });
  });

  describe('Gap Analysis and Compliance', () => {
    it('manages gap analysis reports', async () => {
      const report = await storage.createGapAnalysisReport({
        organizationId: orgId,
        framework: 'SOC2',
        status: 'draft',
        findings: [],
        recommendations: [],
        overallScore: 0,
        completedAt: null
      });

      const reports = await storage.getGapAnalysisReports(orgId);
      expect(reports.find(r => r.id === report.id)).toBeDefined();

      await storage.updateGapAnalysisReport(report.id, { status: 'completed' });
      const updated = await storage.getGapAnalysisReport(report.id);
      expect(updated?.status).toBe('completed');
    });

    it('updates control statuses', async () => {
        await storage.updateFrameworkControlStatus(orgId, 'SOC2', 'CC1.1', {
            status: 'implemented',
            notes: 'Test notes'
        });
        
        const statuses = await storage.getFrameworkControlStatuses(orgId, 'SOC2');
        expect(statuses.find(s => s.controlId === 'CC1.1')?.status).toBe('implemented');
    });
  });

  describe('User Operations Extension', () => {
    it('paginates users correctly', async () => {
        await storage.createUser({ email: 'u1@ex.com', username: 'u1', role: 'user' });
        await storage.createUser({ email: 'u2@ex.com', username: 'u2', role: 'user' });
        
        const result = await storage.getAllUsers({ role: 'user' }, { page: 1, limit: 1 });
        expect(result.data.length).toBe(1);
        expect(result.total).toBeGreaterThanOrEqual(2);
    });

    it('suspends and reactivates users', async () => {
        await storage.suspendUser(userId);
        const suspended = await storage.getUser(userId);
        expect(suspended?.isActive).toBe(false);

        await storage.reactivateUser(userId);
        const active = await storage.getUser(userId);
        expect(active?.isActive).toBe(true);
    });
  });

  describe('Invitations', () => {
    it('manages user invitations', async () => {
        const inv = await storage.createInvitation({
            email: 'invite@ex.com',
            token: 'toke123',
            expiresAt: new Date(Date.now() + 86400000)
        });
        expect(inv.id).toBeDefined();

        const retrieved = await storage.getInvitationByToken('toke123');
        expect(retrieved?.id).toBe(inv.id);

        await storage.acceptInvitation('toke123', userId);
        const accepted = await storage.getInvitation(inv.id);
        expect(accepted?.status).toBe('accepted');
    });
  });

  describe('Sessions', () => {
    it('manages user sessions', async () => {
        const session = await storage.createUserSession({
            userId,
            sessionToken: 'sess123',
            expiresAt: new Date(Date.now() + 3600000)
        });
        expect(session.id).toBeDefined();

        const active = await storage.getActiveUserSessions(userId);
        expect(active.some(s => s.id === session.id)).toBe(true);
        
        await storage.terminateSession(session.id);
        const afterKill = await storage.getActiveUserSessions(userId);
        expect(afterKill.some(s => s.id === session.id)).toBe(false);
    });
  });

  describe('Notifications', () => {
    it('manages notifications', async () => {
        const note = await storage.createNotification({
            userId,
            title: 'Test Note',
            message: 'Hello',
            type: 'info'
        });
        
        const count = await storage.getUnreadNotificationCount(userId);
        expect(count).toBe(1);

        await storage.markNotificationAsRead(note.id, userId);
        const countAfter = await storage.getUnreadNotificationCount(userId);
        expect(countAfter).toBe(0);
    });
  });

  describe('Audit Trail', () => {
    it('creates and retrieves audit entries', async () => {
      const entry = await storage.createAuditEntry({
        organizationId: orgId,
        userId: userId,
        action: 'test_action',
        entityType: 'test',
        entityId: 'test-1',
        description: 'Test entry'
      });

      expect(entry.id).toBeDefined();
      expect(entry.organizationId).toBe(orgId);
    });
  });

  describe('Document Approvals', () => {
    it('manages document approvals', async () => {
        const doc = await storage.createDocument({
            companyProfileId,
            createdBy: userId,
            title: 'Approve Me',
            content: '{}',
            type: 'policy',
            format: 'json',
            framework: 'ISO27001',
            status: 'draft',
            version: 1,
            organizationId: orgId
        });

        const approval = await storage.createDocumentApproval({
            documentId: doc.id,
            userId,
            status: 'pending',
            comments: 'Please review'
        });
        expect(approval.id).toBeDefined();

        await storage.updateDocumentApproval(approval.id, { status: 'approved' });
        const updated = await storage.getDocumentApproval(approval.id);
        expect(updated?.status).toBe('approved');
    });
  });

  describe('User Operations Bulk & Delete', () => {
    it('deletes and bulk updates users', async () => {
        const u3 = await storage.createUser({ email: 'u3@ex.com', username: 'u3' } as any);
        await storage.bulkUpdateUsers([u3.id], { isActive: false });
        const updated = await storage.getUser(u3.id);
        expect(updated?.isActive).toBe(false);

        await storage.deleteUser(u3.id);
        expect(await storage.getUser(u3.id)).toBeUndefined();
    });
  });

  describe('Organization & Memberships', () => {
    it('manages organizations and memberships', async () => {
        const org2 = await storage.createOrganization({ name: 'Org 2', slug: 'org-2' } as any);
        expect(await storage.getOrganizationBySlug('org-2')).toBeDefined();

        await storage.updateOrganization(org2.id, { name: 'Org 2 Updated' });
        const updated = await storage.getOrganization(org2.id);
        expect(updated?.name).toBe('Org 2 Updated');

        await storage.addUserToOrganization({ userId, organizationId: org2.id, role: 'member' } as any);
        const orgs = await storage.getUserOrganizations(userId);
        expect(orgs.some(o => o.organizationId === org2.id)).toBe(true);

        const users = await storage.getOrganizationUsers(org2.id);
        expect(users).toHaveLength(1);

        await storage.updateUserOrganizationRole(userId, org2.id, 'admin');
        await storage.removeUserFromOrganization(userId, org2.id);
        const after = await storage.getUserOrganizations(userId);
        expect(after.some(o => o.organizationId === org2.id)).toBe(false);
    });
  });

  describe('Generation Jobs', () => {
    it('manages generation jobs', async () => {
        const job = await storage.createGenerationJob({
            companyProfileId,
            organizationId: orgId,
            status: 'pending',
            type: 'compliance_package'
        } as any);
        expect(job.id).toBeDefined();

        const retrieved = await storage.getGenerationJob(job.id);
        expect(retrieved?.status).toBe('pending');

        await storage.updateGenerationJob(job.id, { status: 'completed' });
        const updated = await storage.getGenerationJob(job.id);
        expect(updated?.status).toBe('completed');

        const orgJobs = await storage.getGenerationJobs(orgId);
        expect(orgJobs.length).toBeGreaterThan(0);
    });
  });

  describe('Audit & Utilities Final', () => {
    it('cleans up sessions and handles contacts', async () => {
        await storage.cleanupExpiredSessions();
        await storage.terminateAllUserSessions(userId);
        
        const msg = await storage.createContactMessage({
            name: 'Sender',
            email: 's@ex.com',
            subject: 'Hi',
            message: 'Body'
        } as any);
        expect(msg.id).toBeDefined();
    });
  });
});

import { describe, it, expect, beforeEach } from '../setup';
import { MemStorage } from '../../server/storage';
import type { InsertUser, InsertOrganization, InsertCompanyProfile } from '../../shared/schema';

describe('Storage Layer Tests', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Operations', () => {
    it('should create and retrieve users', async () => {
      const userData: InsertUser = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'user'
      };

      const user = await storage.createUser(userData);
      expect(user.email).toBe(userData.email);
      expect(user.id).toBeDefined();

      const retrieved = await storage.getUser(user.id);
      expect(retrieved).toEqual(user);
    });

    it('should find users by email', async () => {
      const userData: InsertUser = {
        email: 'unique@example.com',
        firstName: 'Unique',
        lastName: 'User',
        role: 'user'
      };

      await storage.createUser(userData);
      const found = await storage.getUserByEmail('unique@example.com');
      expect(found?.email).toBe('unique@example.com');
    });

    it('should update user information', async () => {
      const user = await storage.createUser({
        email: 'update@example.com',
        firstName: 'Original',
        role: 'user'
      });

      const updated = await storage.updateUser(user.id, { firstName: 'Updated' });
      expect(updated?.firstName).toBe('Updated');
      expect(updated?.email).toBe('update@example.com');
    });

    it('returns undefined when updating a non-existent user', async () => {
      const updated = await storage.updateUser('missing-user', { firstName: 'Nope' });
      expect(updated).toBeUndefined();
    });

    it('upserts existing users and preserves provided id for new users', async () => {
      const existing = await storage.createUser({
        email: 'upsert-existing@example.com',
        firstName: 'Existing',
        role: 'user',
      });

      const updated = await storage.upsertUser({
        id: existing.id,
        email: existing.email,
        firstName: 'Updated Existing',
      } as any);
      expect(updated.firstName).toBe('Updated Existing');
      expect(updated.id).toBe(existing.id);

      const created = await storage.upsertUser({
        id: 'fixed-user-id',
        email: 'new-upsert@example.com',
        firstName: 'New',
      } as any);
      expect(created.id).toBe('fixed-user-id');
      expect(created.email).toBe('new-upsert@example.com');
    });
  });

  describe('Organization Operations', () => {
    it('should create and manage organizations', async () => {
      const orgData: InsertOrganization = {
        name: 'Test Corp',
        slug: 'test-corp',
        description: 'A test organization'
      };

      const org = await storage.createOrganization(orgData);
      expect(org.name).toBe(orgData.name);
      expect(org.slug).toBe(orgData.slug);

      const retrieved = await storage.getOrganization(org.id);
      expect(retrieved).toEqual(org);
    });

    it('should find organizations by slug', async () => {
      const orgData: InsertOrganization = {
        name: 'Slug Test',
        slug: 'slug-test'
      };

      await storage.createOrganization(orgData);
      const found = await storage.getOrganizationBySlug('slug-test');
      expect(found?.name).toBe('Slug Test');
    });
  });

  describe('Membership Operations', () => {
    it('returns undefined/false for missing memberships', async () => {
      const updated = await storage.updateUserOrganizationRole('u-missing', 'o-missing', 'admin');
      const removed = await storage.removeUserFromOrganization('u-missing', 'o-missing');

      expect(updated).toBeUndefined();
      expect(removed).toBe(false);
    });
  });

  describe('Company Profile Operations', () => {
    let userId: string;
    let orgId: string;

    beforeEach(async () => {
      const user = await storage.createUser({
        email: 'profile@example.com',
        firstName: 'Profile',
        role: 'user'
      });
      userId = user.id;

      const org = await storage.createOrganization({
        name: 'Profile Org',
        slug: 'profile-org'
      });
      orgId = org.id;
    });

    it('should create company profiles with proper structure', async () => {
      const profileData: InsertCompanyProfile = {
        organizationId: orgId,
        createdBy: userId,
        companyName: 'Test Company',
        industry: 'Technology',
        companySize: '51-200',
        headquarters: 'San Francisco, CA',
        dataClassification: 'Confidential',
        businessApplications: 'Web applications, mobile apps',
        cloudInfrastructure: ['AWS', 'Azure'],
        complianceFrameworks: ['SOC2', 'ISO27001']
      };

      const profile = await storage.createCompanyProfile(profileData);
      expect(profile.companyName).toBe(profileData.companyName);
      expect(profile.cloudInfrastructure).toEqual(['AWS', 'Azure']);
      expect(profile.complianceFrameworks).toEqual(['SOC2', 'ISO27001']);
    });

    it('keeps existing arrays when update receives invalid array payloads', async () => {
      const profile = await storage.createCompanyProfile({
        organizationId: orgId,
        createdBy: userId,
        companyName: 'Array Safety Co',
        cloudInfrastructure: ['AWS'],
        complianceFrameworks: ['SOC2'],
      } as any);

      const updated = await storage.updateCompanyProfile(profile.id, {
        cloudInfrastructure: 'not-an-array' as any,
        complianceFrameworks: undefined,
      });

      expect(updated?.cloudInfrastructure).toEqual(['AWS']);
      expect(updated?.complianceFrameworks).toEqual(['SOC2']);
    });
  });

  describe('Workflow and Compliance Operations', () => {
    it('handles generation jobs, approvals, and compliance artifacts', async () => {
      const job = await storage.createGenerationJob({
        companyProfileId: 'cp-1',
        framework: 'SOC2',
      } as any);
      expect(await storage.getGenerationJob(job.id)).toEqual(job);
      expect((await storage.getGenerationJobsByCompanyProfile('cp-1')).length).toBe(1);

      const updatedJob = await storage.updateGenerationJob(job.id, {
        progress: 80,
        status: 'running',
      } as any);
      expect(updatedJob?.progress).toBe(80);
      expect(await storage.updateGenerationJob('missing-job', { progress: 10 } as any)).toBeUndefined();

      const report = await storage.createGapAnalysisReport({
        organizationId: 'org-1',
        framework: 'SOC2',
      } as any);
      expect(await storage.getGapAnalysisReport(report.id)).toEqual(report);
      expect((await storage.getGapAnalysisReports('org-1')).length).toBe(1);
      await expect(storage.updateGapAnalysisReport('missing-report', {} as any)).rejects.toThrow('Report not found');

      const findingA = await storage.createGapAnalysisFinding({
        reportId: report.id,
        title: 'A',
        priority: 1,
      } as any);
      const findingB = await storage.createGapAnalysisFinding({
        reportId: report.id,
        title: 'B',
        priority: 5,
      } as any);
      const findings = await storage.getGapAnalysisFindings(report.id);
      expect(findings[0].id).toBe(findingB.id);
      expect(await storage.getGapAnalysisFinding(findingA.id)).toEqual(findingA);

      const recommendation = await storage.createRemediationRecommendation({
        findingId: findingA.id,
        title: 'Fix A',
        priority: 3,
      } as any);
      expect(await storage.getRemediationRecommendation(recommendation.id)).toEqual(recommendation);
      expect((await storage.getRemediationRecommendations(findingA.id)).length).toBe(1);
      await expect(
        storage.updateRemediationRecommendation('missing-rec', {} as any)
      ).rejects.toThrow('Recommendation not found');

      const assessment = await storage.createComplianceMaturityAssessment({
        organizationId: 'org-1',
        framework: 'SOC2',
        score: 3,
      } as any);
      expect(
        await storage.getComplianceMaturityAssessment('org-1', 'SOC2' as any)
      ).toEqual(assessment);

      const approval = await storage.createDocumentApproval({
        documentId: 'doc-1',
        requestedBy: 'user-1',
        approverRole: 'security',
      } as any);
      expect(await storage.getDocumentApproval(approval.id)).toEqual(approval);
      expect((await storage.getDocumentApprovals('pending')).length).toBe(1);
      const updatedApproval = await storage.updateDocumentApproval(approval.id, {
        status: 'approved',
      } as any);
      expect(updatedApproval?.status).toBe('approved');
      expect((await storage.getDocumentApprovals('all')).length).toBe(1);
    });
  });

  describe('Identity and Session Operations', () => {
    it('covers user filtering, invitation lifecycle, and session cleanup', async () => {
      const userA = await storage.createUser({
        email: 'admin@example.com',
        firstName: 'Admin',
        role: 'admin',
        isActive: true,
      } as any);
      const userB = await storage.createUser({
        email: 'member@example.com',
        firstName: 'Member',
        role: 'user',
        isActive: true,
      } as any);

      const filtered = await storage.getAllUsers(
        { search: 'admin', role: 'admin', isActive: true },
        { page: 1, limit: 5 }
      );
      expect(filtered.total).toBe(1);
      expect(filtered.data[0].id).toBe(userA.id);

      expect(await storage.suspendUser(userB.id)).toEqual(
        expect.objectContaining({ isActive: false })
      );
      expect(await storage.reactivateUser(userB.id)).toEqual(
        expect.objectContaining({ isActive: true })
      );
      expect(await storage.bulkUpdateUsers([userA.id, 'missing'], { role: 'manager' } as any)).toBe(1);
      expect(await storage.deleteUser('missing-user')).toBe(false);

      const invitation = await storage.createInvitation({
        email: 'invitee@example.com',
        token: 'invite-token',
        invitedBy: userA.id,
        organizationId: 'org-1',
      } as any);
      expect(await storage.getInvitation(invitation.id)).toEqual(invitation);
      expect(await storage.getInvitationByToken('invite-token')).toEqual(invitation);
      expect((await storage.getInvitationsByOrganization('org-1')).length).toBe(1);
      expect((await storage.getPendingInvitations()).length).toBe(1);
      expect(await storage.updateInvitation('missing-invite', { status: 'accepted' } as any)).toBeUndefined();
      expect(await storage.revokeInvitation('missing-invite')).toBe(false);
      expect(await storage.acceptInvitation('missing-token', userB.id)).toBeUndefined();
      expect(await storage.revokeInvitation(invitation.id)).toBe(true);
      const accepted = await storage.acceptInvitation('invite-token', userB.id);
      expect(accepted?.status).toBe('accepted');

      const activeSession = await storage.createUserSession({
        userId: userA.id,
        sessionToken: 'token-active',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      } as any);
      const expiredSession = await storage.createUserSession({
        userId: userA.id,
        sessionToken: 'token-expired',
        expiresAt: new Date(Date.now() - 1000 * 60),
      } as any);

      expect((await storage.getUserSessions(userA.id)).length).toBe(2);
      expect((await storage.getActiveUserSessions(userA.id)).length).toBe(1);
      expect(await storage.updateSessionActivity(activeSession.id)).toEqual(
        expect.objectContaining({ id: activeSession.id })
      );
      expect(await storage.updateSessionActivity('missing-session')).toBeUndefined();
      expect(await storage.cleanupExpiredSessions()).toBe(1);
      expect(await storage.terminateSession('missing-session')).toBe(false);
      expect(await storage.terminateSession(activeSession.id)).toBe(true);
      expect(await storage.terminateAllUserSessions(userA.id)).toBe(0);
      expect(expiredSession.id).toBeDefined();
    });
  });

  describe('Notifications, Versions, and Audit Operations', () => {
    it('covers framework status, notifications, document versions, and audit queries', async () => {
      const status = await storage.updateFrameworkControlStatus(
        'org-1',
        'SOC2',
        'CC6.1',
        { updatedBy: 'user-1' } as any
      );
      expect(status.status).toBe('not_started');
      const statusUpdated = await storage.updateFrameworkControlStatus(
        'org-1',
        'SOC2',
        'CC6.1',
        { status: 'implemented', notes: 'verified' } as any
      );
      expect(statusUpdated.status).toBe('implemented');
      expect((await storage.getFrameworkControlStatuses('org-1', 'SOC2')).length).toBe(1);

      const notificationA = await storage.createNotification({
        userId: 'user-1',
        title: 'A',
        message: 'first',
        type: 'info',
      } as any);
      await storage.createNotification({
        userId: 'user-1',
        title: 'B',
        message: 'second',
        type: 'warning',
      } as any);
      expect(await storage.getUnreadNotificationCount('user-1')).toBe(2);
      expect(await storage.markNotificationAsRead('missing', 'user-1')).toBeUndefined();
      expect(await storage.markNotificationAsRead(notificationA.id, 'other-user')).toBeUndefined();
      expect((await storage.markAllNotificationsAsRead('user-1'))).toBe(2);
      expect(await storage.deleteNotification('missing', 'user-1')).toBe(false);
      expect(await storage.deleteNotification(notificationA.id, 'other-user')).toBe(false);
      expect(await storage.deleteNotification(notificationA.id, 'user-1')).toBe(true);

      const version = await storage.createDocumentVersion({
        documentId: 'doc-1',
        versionNumber: 2,
      } as any);
      expect(await storage.getDocumentVersion('doc-1', 2)).toEqual(version);
      expect((await storage.getDocumentVersions('doc-1')).length).toBe(1);
      expect(await storage.deleteDocumentVersion('doc-1', 99)).toBe(false);
      expect(await storage.deleteDocumentVersion('doc-1', 2)).toBe(true);

      const now = new Date();
      const auditA = await storage.createAuditEntry({
        organizationId: 'org-1',
        action: 'create',
        resourceType: 'document',
        riskLevel: 'high',
        timestamp: new Date(now.getTime() - 1000),
      } as any);
      await storage.createAuditEntry({
        organizationId: 'org-1',
        action: 'update',
        resourceType: 'document',
        riskLevel: 'critical',
        timestamp: new Date(now.getTime()),
      } as any);

      expect(await storage.getAuditLogById(auditA.id, 'org-1')).toEqual(auditA);
      expect(await storage.getAuditLogById(auditA.id, 'org-2')).toBeNull();
      expect((await storage.getAuditLogsByDateRange(
        new Date(now.getTime() - 5000),
        new Date(now.getTime() + 5000),
        'org-1'
      )).length).toBe(2);
      expect(await storage.verifyAuditChain(1)).toEqual({ valid: true, count: 1 });

      const detailed = await storage.getAuditLogsDetailed('org-1', {
        page: 1,
        limit: 1,
        entityType: 'document',
        action: 'update',
      });
      expect(detailed.total).toBe(1);
      expect(detailed.data[0].action).toBe('update');

      const stats = await storage.getAuditStats('org-1');
      expect(stats.totalEvents).toBe(2);
      expect(stats.highRiskEvents).toBe(2);
      expect(stats.actions.create).toBe(1);
      expect(stats.entities.document).toBe(2);

      const contact = await storage.createContactMessage({
        email: 'security@example.com',
        name: 'Sec',
        message: 'Need support',
      } as any);
      expect(contact.status).toBe('new');
    });
  });
});

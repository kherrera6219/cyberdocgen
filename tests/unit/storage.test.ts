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
  });
});
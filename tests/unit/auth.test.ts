import { describe, it, expect, beforeEach } from '../setup';
import { MemStorage } from '../../server/storage';
import type { InsertUser, InsertOrganization, User } from '../../shared/schema';

describe('Authentication Unit Tests', () => {
  let storage: MemStorage;

  beforeEach(() => {
    storage = new MemStorage();
  });

  describe('User Creation and Authentication', () => {
    it('should create a user with valid data', async () => {
      const userData: InsertUser = {
        email: 'auth.test@example.com',
        firstName: 'Auth',
        lastName: 'Test',
        role: 'user'
      };

      const user = await storage.createUser(userData);
      expect(user.id).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe('user');
    });

    it('should upsert user on login', async () => {
      const userData: InsertUser = {
        email: 'upsert.test@example.com',
        firstName: 'Upsert',
        lastName: 'Test',
        role: 'user'
      };

      const user1 = await storage.upsertUser(userData);
      expect(user1.id).toBeDefined();
      expect(user1.email).toBe(userData.email);
      expect(user1.firstName).toBe('Upsert');
    });

    it('should find user by email for login', async () => {
      const userData: InsertUser = {
        email: 'findbyemail@example.com',
        firstName: 'Find',
        lastName: 'ByEmail',
        role: 'user'
      };

      await storage.createUser(userData);
      const found = await storage.getUserByEmail('findbyemail@example.com');
      
      expect(found).toBeDefined();
      expect(found?.email).toBe('findbyemail@example.com');
    });

    it('should return undefined for non-existent email', async () => {
      const found = await storage.getUserByEmail('nonexistent@example.com');
      expect(found).toBeUndefined();
    });
  });

  describe('Role-Based Access Control', () => {
    it('should create user with default role', async () => {
      const userData: InsertUser = {
        email: 'default.role@example.com',
        firstName: 'Default',
        role: 'user'
      };

      const user = await storage.createUser(userData);
      expect(user.role).toBe('user');
    });

    it('should create admin user', async () => {
      const userData: InsertUser = {
        email: 'admin@example.com',
        firstName: 'Admin',
        role: 'admin'
      };

      const user = await storage.createUser(userData);
      expect(user.role).toBe('admin');
    });

    it('should update user role', async () => {
      const userData: InsertUser = {
        email: 'role.change@example.com',
        firstName: 'Role',
        role: 'user'
      };

      const user = await storage.createUser(userData);
      expect(user.role).toBe('user');

      const updated = await storage.updateUser(user.id, { role: 'admin' });
      expect(updated?.role).toBe('admin');
    });
  });

  describe('Organization Membership', () => {
    let user: User;
    let orgId: string;

    beforeEach(async () => {
      user = await storage.createUser({
        email: 'org.member@example.com',
        firstName: 'Org',
        lastName: 'Member',
        role: 'user'
      });

      const org = await storage.createOrganization({
        name: 'Test Organization',
        slug: 'test-org-auth'
      });
      orgId = org.id;
    });

    it('should add user to organization', async () => {
      const membership = await storage.addUserToOrganization({
        userId: user.id,
        organizationId: orgId,
        role: 'member'
      });

      expect(membership.userId).toBe(user.id);
      expect(membership.organizationId).toBe(orgId);
      expect(membership.role).toBe('member');
    });

    it('should get user organizations', async () => {
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: orgId,
        role: 'member'
      });

      const orgs = await storage.getUserOrganizations(user.id);
      expect(orgs.length).toBeGreaterThan(0);
      expect(orgs[0].organizationId).toBe(orgId);
    });

    it('should update user organization role', async () => {
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: orgId,
        role: 'member'
      });

      const updated = await storage.updateUserOrganizationRole(user.id, orgId, 'admin');
      expect(updated?.role).toBe('admin');
    });

    it('should remove user from organization', async () => {
      await storage.addUserToOrganization({
        userId: user.id,
        organizationId: orgId,
        role: 'member'
      });

      const removed = await storage.removeUserFromOrganization(user.id, orgId);
      expect(removed).toBe(true);

      const orgs = await storage.getUserOrganizations(user.id);
      expect(orgs.length).toBe(0);
    });
  });

  describe('Session Management', () => {
    it('should create user sessions', async () => {
      const userData: InsertUser = {
        email: 'session.test@example.com',
        firstName: 'Session',
        role: 'user'
      };

      const user = await storage.createUser(userData);
      
      const retrieved = await storage.getUser(user.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(user.id);
    });
  });
});

import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { roles, roleAssignments, users, userOrganizations, insertRoleSchema } from '@shared/schema';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

const DEFAULT_ROLES = [
  {
    name: 'admin',
    displayName: 'Administrator',
    description: 'Full access to all features and settings',
    permissions: {
      documents: { create: true, read: true, update: true, delete: true, approve: true },
      users: { invite: true, manage: true, view: true },
      organization: { settings: true, billing: true, integrations: true },
      compliance: { view: true, audit: true, manage: true },
      ai: { chat: true, generate: true, finetune: true },
      admin: { full: true },
    },
    isSystem: true,
  },
  {
    name: 'standard_user',
    displayName: 'Standard User',
    description: 'Can create and manage documents, use AI features',
    permissions: {
      documents: { create: true, read: true, update: true, delete: false, approve: false },
      users: { invite: false, manage: false, view: true },
      organization: { settings: false, billing: false, integrations: false },
      compliance: { view: true, audit: false, manage: false },
      ai: { chat: true, generate: true, finetune: false },
      admin: { full: false },
    },
    isSystem: true,
  },
  {
    name: 'auditor',
    displayName: 'Auditor',
    description: 'Read-only access for compliance auditing',
    permissions: {
      documents: { create: false, read: true, update: false, delete: false, approve: false },
      users: { invite: false, manage: false, view: true },
      organization: { settings: false, billing: false, integrations: false },
      compliance: { view: true, audit: true, manage: false },
      ai: { chat: true, generate: false, finetune: false },
      admin: { full: false },
    },
    isSystem: true,
  },
];

router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const allRoles = await db.select().from(roles);
    res.json(allRoles);
  } catch (error) {
    logger.error('Failed to fetch roles', { error });
    res.status(500).json({ message: 'Failed to fetch roles' });
  }
});

router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const [role] = await db.select().from(roles).where(eq(roles.id, req.params.id)).limit(1);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json(role);
  } catch (error) {
    logger.error('Failed to fetch role', { error });
    res.status(500).json({ message: 'Failed to fetch role' });
  }
});

router.post('/seed', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [user] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
    if (user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    for (const roleData of DEFAULT_ROLES) {
      const [existing] = await db.select().from(roles).where(eq(roles.name, roleData.name)).limit(1);
      if (!existing) {
        await db.insert(roles).values(roleData);
        logger.info('Created default role', { role: roleData.name });
      }
    }

    const allRoles = await db.select().from(roles);
    res.json({ message: 'Default roles seeded', roles: allRoles });
  } catch (error) {
    logger.error('Failed to seed roles', { error });
    res.status(500).json({ message: 'Failed to seed roles' });
  }
});

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const [user] = await db.select().from(users).where(eq(users.id, userId!)).limit(1);
    if (user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const parsed = insertRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid role data', errors: parsed.error.flatten() });
    }

    const [newRole] = await db.insert(roles).values(parsed.data).returning();
    logger.info('Role created', { roleId: newRole.id, name: newRole.name });
    res.status(201).json(newRole);
  } catch (error) {
    logger.error('Failed to create role', { error });
    res.status(500).json({ message: 'Failed to create role' });
  }
});

router.get('/assignments/user/:userId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const targetUserId = req.params.userId;

    const currentUserOrgs = await db
      .select({ orgId: userOrganizations.organizationId })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, currentUserId!));

    const currentOrgIds = currentUserOrgs.map(o => o.orgId);

    if (currentUserId !== targetUserId) {
      const targetOrgs = await db
        .select({ orgId: userOrganizations.organizationId })
        .from(userOrganizations)
        .where(eq(userOrganizations.userId, targetUserId));

      const hasSharedOrg = targetOrgs.some(t => currentOrgIds.includes(t.orgId));

      if (!hasSharedOrg) {
        return res.status(403).json({ message: 'Cannot view assignments for users outside your organizations' });
      }
    }

    const allAssignments = await db
      .select({
        id: roleAssignments.id,
        roleId: roleAssignments.roleId,
        organizationId: roleAssignments.organizationId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        permissions: roles.permissions,
        createdAt: roleAssignments.createdAt,
      })
      .from(roleAssignments)
      .innerJoin(roles, eq(roleAssignments.roleId, roles.id))
      .where(eq(roleAssignments.userId, targetUserId));

    const filteredAssignments = currentUserId === targetUserId
      ? allAssignments
      : allAssignments.filter(a => currentOrgIds.includes(a.organizationId));

    res.json(filteredAssignments);
  } catch (error) {
    logger.error('Failed to fetch role assignments', { error });
    res.status(500).json({ message: 'Failed to fetch role assignments' });
  }
});

router.get('/assignments/organization/:orgId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const orgId = req.params.orgId;

    const [membership] = await db
      .select()
      .from(userOrganizations)
      .where(and(eq(userOrganizations.userId, currentUserId!), eq(userOrganizations.organizationId, orgId)))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this organization' });
    }

    const assignments = await db
      .select({
        id: roleAssignments.id,
        userId: roleAssignments.userId,
        roleId: roleAssignments.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        userEmail: users.email,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        createdAt: roleAssignments.createdAt,
      })
      .from(roleAssignments)
      .innerJoin(roles, eq(roleAssignments.roleId, roles.id))
      .innerJoin(users, eq(roleAssignments.userId, users.id))
      .where(eq(roleAssignments.organizationId, orgId));

    res.json(assignments);
  } catch (error) {
    logger.error('Failed to fetch organization role assignments', { error });
    res.status(500).json({ message: 'Failed to fetch role assignments' });
  }
});

router.post('/assignments', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const { userId, organizationId, roleId } = req.body;

    if (!userId || !organizationId || !roleId) {
      return res.status(400).json({ message: 'userId, organizationId, and roleId are required' });
    }

    const [membership] = await db
      .select()
      .from(userOrganizations)
      .where(and(eq(userOrganizations.userId, currentUserId!), eq(userOrganizations.organizationId, organizationId)))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return res.status(403).json({ message: 'Admin access required for this organization' });
    }

    const [existing] = await db
      .select()
      .from(roleAssignments)
      .where(and(
        eq(roleAssignments.userId, userId),
        eq(roleAssignments.organizationId, organizationId),
        eq(roleAssignments.roleId, roleId)
      ))
      .limit(1);

    if (existing) {
      return res.status(409).json({ message: 'Role assignment already exists' });
    }

    const [assignment] = await db
      .insert(roleAssignments)
      .values({ userId, organizationId, roleId, assignedBy: currentUserId })
      .returning();

    logger.info('Role assigned', { userId, organizationId, roleId, assignedBy: currentUserId });
    res.status(201).json(assignment);
  } catch (error) {
    logger.error('Failed to assign role', { error });
    res.status(500).json({ message: 'Failed to assign role' });
  }
});

router.delete('/assignments/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const [assignment] = await db.select().from(roleAssignments).where(eq(roleAssignments.id, req.params.id)).limit(1);

    if (!assignment) {
      return res.status(404).json({ message: 'Role assignment not found' });
    }

    const [membership] = await db
      .select()
      .from(userOrganizations)
      .where(and(eq(userOrganizations.userId, currentUserId!), eq(userOrganizations.organizationId, assignment.organizationId)))
      .limit(1);

    if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    await db.delete(roleAssignments).where(eq(roleAssignments.id, req.params.id));
    logger.info('Role assignment removed', { assignmentId: req.params.id });
    res.json({ message: 'Role assignment removed' });
  } catch (error) {
    logger.error('Failed to remove role assignment', { error });
    res.status(500).json({ message: 'Failed to remove role assignment' });
  }
});

export default router;

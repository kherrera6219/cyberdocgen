import { Router, Response, NextFunction } from 'express';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { roles, roleAssignments, users, userOrganizations, insertRoleSchema } from '@shared/schema';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { 
  secureHandler, 
  validateInput,
  ConflictError,
  NotFoundError,
  ForbiddenError
} from '../utils/errorHandling';
import { type MultiTenantRequest } from '../middleware/multiTenant';

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

// Validation schemas
const assignRoleSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  roleId: z.string().uuid('Invalid role ID'),
});

/**
 * Get all roles
 */
router.get('/', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const allRoles = await db.select().from(roles);
  res.json({ success: true, data: allRoles });
}));

/**
 * Get single role by ID
 */
router.get('/:id', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const [role] = await db.select().from(roles).where(eq(roles.id, req.params.id)).limit(1);
  if (!role) {
    throw new NotFoundError("Role not found");
  }
  res.json({ success: true, data: role });
}));

/**
 * Seed default roles (admin only)
 */
router.post('/seed', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  for (const roleData of DEFAULT_ROLES) {
    const [existing] = await db.select().from(roles).where(eq(roles.name, roleData.name)).limit(1);
    if (!existing) {
      await db.insert(roles).values(roleData);
      logger.info('Created default role', { role: roleData.name });
    }
  }

  const allRoles = await db.select().from(roles);
  res.json({ success: true, message: 'Default roles seeded', data: allRoles });
}, { audit: { action: 'create', entityType: 'roles' } }));

/**
 * Create new role (admin only)
 */
router.post('/', isAuthenticated, validateInput(insertRoleSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (user?.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }

  const [newRole] = await db.insert(roles).values(req.body).returning();
  logger.info('Role created', { roleId: newRole.id, name: newRole.name });
  res.status(201).json({ success: true, data: newRole });
}, { audit: { action: 'create', entityType: 'role' } }));

/**
 * Get role assignments for a user
 */
router.get('/assignments/user/:userId', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const currentUserId = getRequiredUserId(req);
  const targetUserId = req.params.userId;

  const currentUserOrgs = await db
    .select({ orgId: userOrganizations.organizationId })
    .from(userOrganizations)
    .where(eq(userOrganizations.userId, currentUserId));

  const currentOrgIds = currentUserOrgs.map(o => o.orgId);

  if (currentUserId !== targetUserId) {
    const targetOrgs = await db
      .select({ orgId: userOrganizations.organizationId })
      .from(userOrganizations)
      .where(eq(userOrganizations.userId, targetUserId));

    const hasSharedOrg = targetOrgs.some(t => currentOrgIds.includes(t.orgId));
    if (!hasSharedOrg) {
      throw new ForbiddenError('Cannot view assignments for users outside your organizations');
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

  res.json({ success: true, data: filteredAssignments });
}));

/**
 * Get role assignments for an organization
 */
router.get('/assignments/organization/:orgId', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const currentUserId = getRequiredUserId(req);
  const orgId = req.params.orgId;

  const [membership] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, currentUserId), eq(userOrganizations.organizationId, orgId)))
    .limit(1);

  if (!membership) {
    throw new ForbiddenError('Not a member of this organization');
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

  res.json({ success: true, data: assignments });
}));

/**
 * Assign role to user
 */
router.post('/assignments', isAuthenticated, validateInput(assignRoleSchema), secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const currentUserId = getRequiredUserId(req);
  const { userId, organizationId, roleId } = req.body;

  const [membership] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, currentUserId), eq(userOrganizations.organizationId, organizationId)))
    .limit(1);

  if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
    throw new ForbiddenError('Admin access required for this organization');
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
    throw new ConflictError('Role assignment already exists');
  }

  const [assignment] = await db
    .insert(roleAssignments)
    .values({ userId, organizationId, roleId, assignedBy: currentUserId })
    .returning();

  logger.info('Role assigned', { userId, organizationId, roleId, assignedBy: currentUserId });
  res.status(201).json({ success: true, data: assignment });
}, { audit: { action: 'create', entityType: 'roleAssignment' } }));

/**
 * Remove role assignment
 */
router.delete('/assignments/:id', isAuthenticated, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const currentUserId = getRequiredUserId(req);
  const [assignment] = await db.select().from(roleAssignments).where(eq(roleAssignments.id, req.params.id)).limit(1);

  if (!assignment) {
    throw new NotFoundError('Role assignment not found');
  }

  const [membership] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, currentUserId), eq(userOrganizations.organizationId, assignment.organizationId)))
    .limit(1);

  if (!membership || (membership.role !== 'admin' && membership.role !== 'owner')) {
    throw new ForbiddenError('Admin access required');
  }

  await db.delete(roleAssignments).where(eq(roleAssignments.id, req.params.id));
  logger.info('Role assignment removed', { assignmentId: req.params.id });
  res.json({ success: true, message: 'Role assignment removed' });
}, { audit: { action: 'delete', entityType: 'roleAssignment', getEntityId: (req) => req.params.id } }));

export default router;

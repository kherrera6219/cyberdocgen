import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { projects, projectMemberships, users, userOrganizations, insertProjectSchema, insertProjectMembershipSchema } from '@shared/schema';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { 
  secureHandler, 
  validateInput,
  requireAuth,
  requireResource,
  requirePermission,
  NotFoundError,
  ForbiddenError,
  ConflictError
} from '../utils/errorHandling';

const router = Router();

// Validation schemas
const projectIdSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
});

const memberIdSchema = z.object({
  id: z.string().uuid('Invalid project ID'),
  memberId: z.string().uuid('Invalid member ID'),
});

const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  role: z.enum(['owner', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be owner, editor, or viewer' }),
  }),
});

const updateMemberSchema = z.object({
  role: z.enum(['owner', 'editor', 'viewer'], {
    errorMap: () => ({ message: 'Role must be owner, editor, or viewer' }),
  }),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.string().optional(),
  framework: z.string().optional(),
  targetCompletionDate: z.string().datetime().optional(),
});

/**
 * Get all projects for current user
 */
router.get('/', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      status: projects.status,
      framework: projects.framework,
      targetCompletionDate: projects.targetCompletionDate,
      organizationId: projects.organizationId,
      memberRole: projectMemberships.role,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .innerJoin(projectMemberships, eq(projects.id, projectMemberships.projectId))
    .where(eq(projectMemberships.userId, userId))
    .orderBy(desc(projects.updatedAt));

  res.json({ success: true, data: userProjects });
}, { audit: { action: 'read', entityType: 'projects' } }));

/**
 * Get projects by organization
 */
router.get('/organization/:orgId', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  const orgId = req.params.orgId;

  const [membership] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, orgId)))
    .limit(1);

  requirePermission(!!membership, 'Not a member of this organization');

  const orgProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.organizationId, orgId))
    .orderBy(desc(projects.updatedAt));

  res.json({ success: true, data: orgProjects });
}));

/**
 * Get single project by ID
 */
router.get('/:id', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  const projectId = req.params.id;

  const [membership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId)))
    .limit(1);

  requirePermission(!!membership, 'Not a member of this project');

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  requireResource(project, 'Project');

  res.json({ success: true, data: project });
}, { audit: { action: 'view', entityType: 'project', getEntityId: (req) => req.params.id } }));

/**
 * Create new project
 */
router.post('/', isAuthenticated, validateInput(insertProjectSchema.extend({
  organizationId: z.string().uuid(),
})), secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  const projectData = { ...req.body, createdBy: userId };

  // Verify org membership
  const [membership] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, projectData.organizationId)))
    .limit(1);

  requirePermission(!!membership, 'Not a member of this organization');

  const [newProject] = await db.insert(projects).values(projectData).returning();

  // Add creator as owner
  await db.insert(projectMemberships).values({
    projectId: newProject.id,
    userId,
    role: 'owner',
  });

  logger.info('Project created', { projectId: newProject.id, createdBy: userId });
  res.status(201).json({ success: true, data: newProject });
}, { audit: { action: 'create', entityType: 'project' } }));

/**
 * Update project
 */
router.patch('/:id', isAuthenticated, validateInput(updateProjectSchema), secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  const projectId = req.params.id;

  const [membership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId)))
    .limit(1);

  requirePermission(!!membership && membership.role !== 'viewer', 'Edit access required');

  const { name, description, status, framework, targetCompletionDate } = req.body;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (framework !== undefined) updates.framework = framework;
  if (targetCompletionDate !== undefined) updates.targetCompletionDate = new Date(targetCompletionDate);

  const [updated] = await db
    .update(projects)
    .set(updates)
    .where(eq(projects.id, projectId))
    .returning();

  requireResource(updated, 'Project');
  res.json({ success: true, data: updated });
}, { audit: { action: 'update', entityType: 'project', getEntityId: (req) => req.params.id } }));

/**
 * Delete project
 */
router.delete('/:id', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  const projectId = req.params.id;

  const [membership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId)))
    .limit(1);

  requirePermission(!!membership && membership.role === 'owner', 'Owner access required');

  await db.delete(projects).where(eq(projects.id, projectId));
  logger.info('Project deleted', { projectId, deletedBy: userId });
  res.json({ success: true, message: 'Project deleted' });
}, { audit: { action: 'delete', entityType: 'project', getEntityId: (req) => req.params.id } }));

/**
 * Get project members
 */
router.get('/:id/members', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
  const userId = requireAuth(req);
  const projectId = req.params.id;

  const [membership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId)))
    .limit(1);

  requirePermission(!!membership, 'Not a member of this project');

  const members = await db
    .select({
      id: projectMemberships.id,
      userId: projectMemberships.userId,
      role: projectMemberships.role,
      joinedAt: projectMemberships.joinedAt,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      profileImageUrl: users.profileImageUrl,
    })
    .from(projectMemberships)
    .innerJoin(users, eq(projectMemberships.userId, users.id))
    .where(eq(projectMemberships.projectId, projectId));

  res.json({ success: true, data: members });
}));

/**
 * Add project member
 */
router.post('/:id/members', isAuthenticated, validateInput(addMemberSchema), secureHandler(async (req: Request, res: Response) => {
  const currentUserId = requireAuth(req);
  const projectId = req.params.id;
  const { userId: targetUserId, role } = req.body;

  // Check current user is owner
  const [currentMembership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, currentUserId)))
    .limit(1);

  requirePermission(!!currentMembership && currentMembership.role === 'owner', 'Owner access required to add members');

  // Get project to check org
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  requireResource(project, 'Project');

  // Verify target user is in org
  const [targetOrgMembership] = await db
    .select()
    .from(userOrganizations)
    .where(and(eq(userOrganizations.userId, targetUserId), eq(userOrganizations.organizationId, project.organizationId)))
    .limit(1);

  requirePermission(!!targetOrgMembership, 'User must be a member of the organization');

  // Check for existing membership
  const [existing] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, targetUserId)))
    .limit(1);

  if (existing) {
    throw new ConflictError('User is already a member');
  }

  const [newMember] = await db
    .insert(projectMemberships)
    .values({ projectId, userId: targetUserId, role })
    .returning();

  logger.info('Project member added', { projectId, userId: targetUserId, role, addedBy: currentUserId });
  res.status(201).json({ success: true, data: newMember });
}, { audit: { action: 'create', entityType: 'projectMembership' } }));

/**
 * Update member role
 */
router.patch('/:id/members/:memberId', isAuthenticated, validateInput(updateMemberSchema), secureHandler(async (req: Request, res: Response) => {
  const currentUserId = requireAuth(req);
  const { id: projectId, memberId } = req.params;
  const { role } = req.body;

  const [currentMembership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, currentUserId)))
    .limit(1);

  requirePermission(!!currentMembership && currentMembership.role === 'owner', 'Owner access required');

  const [updated] = await db
    .update(projectMemberships)
    .set({ role })
    .where(eq(projectMemberships.id, memberId))
    .returning();

  requireResource(updated, 'Member');
  res.json({ success: true, data: updated });
}, { audit: { action: 'update', entityType: 'projectMembership' } }));

/**
 * Remove project member
 */
router.delete('/:id/members/:memberId', isAuthenticated, secureHandler(async (req: Request, res: Response) => {
  const currentUserId = requireAuth(req);
  const { id: projectId, memberId } = req.params;

  const [currentMembership] = await db
    .select()
    .from(projectMemberships)
    .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, currentUserId)))
    .limit(1);

  requirePermission(!!currentMembership && currentMembership.role === 'owner', 'Owner access required to remove members');

  const [targetMembership] = await db
    .select()
    .from(projectMemberships)
    .where(eq(projectMemberships.id, memberId))
    .limit(1);

  requireResource(targetMembership, 'Member');
  requirePermission(targetMembership.projectId === projectId, 'Member does not belong to this project');
  requirePermission(targetMembership.userId !== currentUserId, 'Cannot remove yourself from the project');

  await db.delete(projectMemberships).where(eq(projectMemberships.id, memberId));
  logger.info('Project member removed', { projectId, memberId, removedBy: currentUserId });
  res.json({ success: true, message: 'Member removed' });
}, { audit: { action: 'delete', entityType: 'projectMembership' } }));

export default router;

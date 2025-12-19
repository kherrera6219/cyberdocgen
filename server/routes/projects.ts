import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { projects, projectMemberships, users, userOrganizations, insertProjectSchema, insertProjectMembershipSchema } from '@shared/schema';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

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

    res.json(userProjects);
  } catch (error) {
    logger.error('Failed to fetch projects', { error });
    res.status(500).json({ message: 'Failed to fetch projects' });
  }
});

router.get('/organization/:orgId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const orgId = req.params.orgId;

    const [membership] = await db
      .select()
      .from(userOrganizations)
      .where(and(eq(userOrganizations.userId, userId!), eq(userOrganizations.organizationId, orgId)))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this organization' });
    }

    const orgProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.organizationId, orgId))
      .orderBy(desc(projects.updatedAt));

    res.json(orgProjects);
  } catch (error) {
    logger.error('Failed to fetch organization projects', { error });
    res.status(500).json({ message: 'Failed to fetch organization projects' });
  }
});

router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const projectId = req.params.id;

    const [membership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId!)))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    logger.error('Failed to fetch project', { error });
    res.status(500).json({ message: 'Failed to fetch project' });
  }
});

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const parsed = insertProjectSchema.safeParse({ ...req.body, createdBy: userId });
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid project data', errors: parsed.error.flatten() });
    }

    const [membership] = await db
      .select()
      .from(userOrganizations)
      .where(and(eq(userOrganizations.userId, userId), eq(userOrganizations.organizationId, parsed.data.organizationId)))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this organization' });
    }

    const [newProject] = await db.insert(projects).values(parsed.data).returning();

    await db.insert(projectMemberships).values({
      projectId: newProject.id,
      userId,
      role: 'owner',
    });

    logger.info('Project created', { projectId: newProject.id, createdBy: userId });
    res.status(201).json(newProject);
  } catch (error) {
    logger.error('Failed to create project', { error });
    res.status(500).json({ message: 'Failed to create project' });
  }
});

router.patch('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const projectId = req.params.id;

    const [membership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId!)))
      .limit(1);

    if (!membership || membership.role === 'viewer') {
      return res.status(403).json({ message: 'Edit access required' });
    }

    const { name, description, status, framework, targetCompletionDate } = req.body;
    const updates: Record<string, any> = { updatedAt: new Date() };

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

    res.json(updated);
  } catch (error) {
    logger.error('Failed to update project', { error });
    res.status(500).json({ message: 'Failed to update project' });
  }
});

router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const projectId = req.params.id;

    const [membership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId!)))
      .limit(1);

    if (!membership || membership.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access required' });
    }

    await db.delete(projects).where(eq(projects.id, projectId));
    logger.info('Project deleted', { projectId, deletedBy: userId });
    res.json({ message: 'Project deleted' });
  } catch (error) {
    logger.error('Failed to delete project', { error });
    res.status(500).json({ message: 'Failed to delete project' });
  }
});

router.get('/:id/members', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const projectId = req.params.id;

    const [membership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, userId!)))
      .limit(1);

    if (!membership) {
      return res.status(403).json({ message: 'Not a member of this project' });
    }

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

    res.json(members);
  } catch (error) {
    logger.error('Failed to fetch project members', { error });
    res.status(500).json({ message: 'Failed to fetch members' });
  }
});

router.post('/:id/members', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const projectId = req.params.id;
    const { userId: targetUserId, role } = req.body;

    if (!targetUserId || !role) {
      return res.status(400).json({ message: 'userId and role are required' });
    }

    if (!['owner', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be owner, editor, or viewer' });
    }

    const [currentMembership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, currentUserId!)))
      .limit(1);

    if (!currentMembership || currentMembership.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access required to add members' });
    }

    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const [targetOrgMembership] = await db
      .select()
      .from(userOrganizations)
      .where(and(eq(userOrganizations.userId, targetUserId), eq(userOrganizations.organizationId, project.organizationId)))
      .limit(1);

    if (!targetOrgMembership) {
      return res.status(403).json({ message: 'User must be a member of the organization' });
    }

    const [existing] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, targetUserId)))
      .limit(1);

    if (existing) {
      return res.status(409).json({ message: 'User is already a member' });
    }

    const [newMember] = await db
      .insert(projectMemberships)
      .values({ projectId, userId: targetUserId, role })
      .returning();

    logger.info('Project member added', { projectId, userId: targetUserId, role, addedBy: currentUserId });
    res.status(201).json(newMember);
  } catch (error) {
    logger.error('Failed to add project member', { error });
    res.status(500).json({ message: 'Failed to add member' });
  }
});

router.patch('/:id/members/:memberId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const { id: projectId, memberId } = req.params;
    const { role } = req.body;

    if (!role || !['owner', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required' });
    }

    const [currentMembership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, currentUserId!)))
      .limit(1);

    if (!currentMembership || currentMembership.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access required' });
    }

    const [updated] = await db
      .update(projectMemberships)
      .set({ role })
      .where(eq(projectMemberships.id, memberId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error('Failed to update member role', { error });
    res.status(500).json({ message: 'Failed to update member role' });
  }
});

router.delete('/:id/members/:memberId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const currentUserId = getUserId(req);
    const { id: projectId, memberId } = req.params;

    const [currentMembership] = await db
      .select()
      .from(projectMemberships)
      .where(and(eq(projectMemberships.projectId, projectId), eq(projectMemberships.userId, currentUserId!)))
      .limit(1);

    if (!currentMembership || currentMembership.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access required to remove members' });
    }

    const [targetMembership] = await db
      .select()
      .from(projectMemberships)
      .where(eq(projectMemberships.id, memberId))
      .limit(1);

    if (!targetMembership) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (targetMembership.projectId !== projectId) {
      return res.status(403).json({ message: 'Member does not belong to this project' });
    }

    if (targetMembership.userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot remove yourself from the project' });
    }

    await db.delete(projectMemberships).where(eq(projectMemberships.id, memberId));
    logger.info('Project member removed', { projectId, memberId, removedBy: currentUserId });
    res.json({ message: 'Member removed' });
  } catch (error) {
    logger.error('Failed to remove project member', { error });
    res.status(500).json({ message: 'Failed to remove member' });
  }
});

export default router;

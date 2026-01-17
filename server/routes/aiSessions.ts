import { Router, Response, NextFunction } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { aiSessions, aiMessages, insertAiSessionSchema, insertAiMessageSchema } from '@shared/schema';
import { isAuthenticated, getRequiredUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { secureHandler, NotFoundError, ValidationError } from '../utils/errorHandling';
import { type MultiTenantRequest, requireOrganization } from '../middleware/multiTenant';

const router = Router();

router.get('/', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;

  const sessions = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.userId, userId), eq(aiSessions.organizationId, organizationId)))
    .orderBy(desc(aiSessions.lastMessageAt));

  res.json({
    success: true,
    data: sessions
  });
}));

router.get('/:id', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(
      eq(aiSessions.id, sessionId), 
      eq(aiSessions.userId, userId),
      eq(aiSessions.organizationId, organizationId)
    ))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  res.json({
    success: true,
    data: session
  });
}));

router.post('/', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;

  const sessionData = {
    ...req.body,
    userId,
    organizationId,
    lastMessageAt: new Date(),
  };

  const parsed = insertAiSessionSchema.safeParse(sessionData);
  if (!parsed.success) {
    throw new ValidationError('Invalid session data', parsed.error.flatten());
  }

  const [newSession] = await db.insert(aiSessions).values(parsed.data).returning();
  logger.info('AI session created', { sessionId: newSession.id, userId, organizationId });
  
  res.status(201).json({
    success: true,
    data: newSession
  });
}));

router.patch('/:id', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(
      eq(aiSessions.id, sessionId), 
      eq(aiSessions.userId, userId),
      eq(aiSessions.organizationId, organizationId)
    ))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  const { title, isActive, context } = req.body;
  const updates: Record<string, unknown> = {};

  if (title !== undefined) updates.title = title;
  if (isActive !== undefined) updates.isActive = isActive;
  if (context !== undefined) updates.context = context;

  const [updated] = await db
    .update(aiSessions)
    .set(updates)
    .where(eq(aiSessions.id, sessionId))
    .returning();

  res.json({
    success: true,
    data: updated
  });
}));

router.delete('/:id', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(
      eq(aiSessions.id, sessionId), 
      eq(aiSessions.userId, userId),
      eq(aiSessions.organizationId, organizationId)
    ))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await db.delete(aiSessions).where(eq(aiSessions.id, sessionId));
  logger.info('AI session deleted', { sessionId, userId, organizationId });
  
  res.json({
    success: true,
    data: { message: 'Session deleted' }
  });
}));

router.get('/:id/messages', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(
      eq(aiSessions.id, sessionId), 
      eq(aiSessions.userId, userId),
      eq(aiSessions.organizationId, organizationId)
    ))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found or access denied');
  }

  const messages = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(aiMessages.createdAt);

  res.json({
    success: true,
    data: messages
  });
}));

router.post('/:id/messages', isAuthenticated, requireOrganization, secureHandler(async (req: MultiTenantRequest, res: Response, _next: NextFunction) => {
  const userId = getRequiredUserId(req);
  const organizationId = req.organizationId!;
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(
      eq(aiSessions.id, sessionId), 
      eq(aiSessions.userId, userId),
      eq(aiSessions.organizationId, organizationId)
    ))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found or access denied');
  }

  const messageData = { ...req.body, sessionId };
  const parsed = insertAiMessageSchema.safeParse(messageData);
  if (!parsed.success) {
    throw new ValidationError('Invalid message data', parsed.error.flatten());
  }

  const [newMessage] = await db.insert(aiMessages).values(parsed.data).returning();

  await db
    .update(aiSessions)
    .set({ lastMessageAt: new Date() })
    .where(eq(aiSessions.id, sessionId));

  res.status(201).json({
    success: true,
    data: newMessage
  });
}));

export default router;

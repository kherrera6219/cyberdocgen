import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { aiSessions, aiMessages, insertAiSessionSchema, insertAiMessageSchema } from '@shared/schema';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';
import { asyncHandler, UnauthorizedError, NotFoundError, ValidationError } from '../utils/routeHelpers';

const router = Router();

router.get('/', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const sessions = await db
    .select()
    .from(aiSessions)
    .where(eq(aiSessions.userId, userId))
    .orderBy(desc(aiSessions.lastMessageAt));

  res.json(sessions);
}));

router.get('/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  res.json(session);
}));

router.post('/', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const sessionData = {
    ...req.body,
    userId,
    lastMessageAt: new Date(),
  };

  const parsed = insertAiSessionSchema.safeParse(sessionData);
  if (!parsed.success) {
    throw new ValidationError('Invalid session data', parsed.error.flatten());
  }

  const [newSession] = await db.insert(aiSessions).values(parsed.data).returning();
  logger.info('AI session created', { sessionId: newSession.id, userId });
  res.status(201).json(newSession);
}));

router.patch('/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
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

  res.json(updated);
}));

router.delete('/:id', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  await db.delete(aiSessions).where(eq(aiSessions.id, sessionId));
  logger.info('AI session deleted', { sessionId, userId });
  res.json({ message: 'Session deleted' });
}));

router.get('/:id/messages', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
  }

  const messages = await db
    .select()
    .from(aiMessages)
    .where(eq(aiMessages.sessionId, sessionId))
    .orderBy(aiMessages.createdAt);

  res.json(messages);
}));

router.post('/:id/messages', isAuthenticated, asyncHandler(async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const sessionId = req.params.id;

  const [session] = await db
    .select()
    .from(aiSessions)
    .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
    .limit(1);

  if (!session) {
    throw new NotFoundError('Session not found');
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

  res.status(201).json(newMessage);
}));

export default router;

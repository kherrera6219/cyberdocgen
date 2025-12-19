import { Router, Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { aiSessions, aiMessages, insertAiSessionSchema, insertAiMessageSchema } from '@shared/schema';
import { isAuthenticated, getUserId } from '../replitAuth';
import { logger } from '../utils/logger';

const router = Router();

router.get('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const sessions = await db
      .select()
      .from(aiSessions)
      .where(eq(aiSessions.userId, userId))
      .orderBy(desc(aiSessions.lastMessageAt));

    res.json(sessions);
  } catch (error) {
    logger.error('Failed to fetch AI sessions', { error });
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

router.get('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sessionId = req.params.id;

    const [session] = await db
      .select()
      .from(aiSessions)
      .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    logger.error('Failed to fetch AI session', { error });
    res.status(500).json({ message: 'Failed to fetch session' });
  }
});

router.post('/', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const sessionData = {
      ...req.body,
      userId,
      lastMessageAt: new Date(),
    };

    const parsed = insertAiSessionSchema.safeParse(sessionData);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid session data', errors: parsed.error.flatten() });
    }

    const [newSession] = await db.insert(aiSessions).values(parsed.data).returning();
    logger.info('AI session created', { sessionId: newSession.id, userId });
    res.status(201).json(newSession);
  } catch (error) {
    logger.error('Failed to create AI session', { error });
    res.status(500).json({ message: 'Failed to create session' });
  }
});

router.patch('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sessionId = req.params.id;

    const [session] = await db
      .select()
      .from(aiSessions)
      .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const { title, isActive, context } = req.body;
    const updates: Record<string, any> = {};

    if (title !== undefined) updates.title = title;
    if (isActive !== undefined) updates.isActive = isActive;
    if (context !== undefined) updates.context = context;

    const [updated] = await db
      .update(aiSessions)
      .set(updates)
      .where(eq(aiSessions.id, sessionId))
      .returning();

    res.json(updated);
  } catch (error) {
    logger.error('Failed to update AI session', { error });
    res.status(500).json({ message: 'Failed to update session' });
  }
});

router.delete('/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sessionId = req.params.id;

    const [session] = await db
      .select()
      .from(aiSessions)
      .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    await db.delete(aiSessions).where(eq(aiSessions.id, sessionId));
    logger.info('AI session deleted', { sessionId, userId });
    res.json({ message: 'Session deleted' });
  } catch (error) {
    logger.error('Failed to delete AI session', { error });
    res.status(500).json({ message: 'Failed to delete session' });
  }
});

router.get('/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sessionId = req.params.id;

    const [session] = await db
      .select()
      .from(aiSessions)
      .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, sessionId))
      .orderBy(aiMessages.createdAt);

    res.json(messages);
  } catch (error) {
    logger.error('Failed to fetch AI messages', { error });
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
});

router.post('/:id/messages', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const sessionId = req.params.id;

    const [session] = await db
      .select()
      .from(aiSessions)
      .where(and(eq(aiSessions.id, sessionId), eq(aiSessions.userId, userId!)))
      .limit(1);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const messageData = { ...req.body, sessionId };
    const parsed = insertAiMessageSchema.safeParse(messageData);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Invalid message data', errors: parsed.error.flatten() });
    }

    const [newMessage] = await db.insert(aiMessages).values(parsed.data).returning();

    await db
      .update(aiSessions)
      .set({ lastMessageAt: new Date() })
      .where(eq(aiSessions.id, sessionId));

    res.status(201).json(newMessage);
  } catch (error) {
    logger.error('Failed to add AI message', { error });
    res.status(500).json({ message: 'Failed to add message' });
  }
});

export default router;

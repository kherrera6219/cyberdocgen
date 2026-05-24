import { db } from '../db';
import { agentMessageInbox, type AgentMessage, type InsertAgentMessage } from '@shared/schema';
import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class AgentQueueService {
  /**
   * Send a message to another agent (enqueue)
   */
  async enqueueMessage(
    senderAgent: string,
    recipientAgent: string,
    topic: string,
    payload: any,
    priority: number = 0
  ): Promise<AgentMessage> {
    try {
      const [msg] = await db.insert(agentMessageInbox).values({
        senderAgent,
        recipientAgent,
        topic,
        payload,
        priority,
        status: 'queued',
        attempts: 0,
      }).returning();

      logger.debug(`[AgentQueue] Enqueued message from ${senderAgent} -> ${recipientAgent} on topic "${topic}"`, {
        messageId: msg.id
      });

      return msg as AgentMessage;
    } catch (error) {
      logger.error('[AgentQueue] Failed to enqueue agent message', { error });
      throw new Error('Failed to enqueue message');
    }
  }

  /**
   * Atomically poll and retrieve queued messages for a recipient agent (marking them processing)
   */
  async dequeueMessages(recipientAgent: string, limit: number = 5): Promise<AgentMessage[]> {
    try {
      // Find candidate messages
      const candidates = await db.select()
        .from(agentMessageInbox)
        .where(
          and(
            eq(agentMessageInbox.recipientAgent, recipientAgent),
            eq(agentMessageInbox.status, 'queued')
          )
        )
        .orderBy(desc(agentMessageInbox.priority), asc(agentMessageInbox.queuedAt))
        .limit(limit);

      if (candidates.length === 0) {
        return [];
      }

      const candidateIds = candidates.map(c => c.id);

      // Atomically mark them as processing in PGlite
      const updatedMessages = await db.update(agentMessageInbox)
        .set({ 
          status: 'processing',
          attempts: sql`attempts + 1`
        })
        .where(inArray(agentMessageInbox.id, candidateIds))
        .returning();

      return updatedMessages as AgentMessage[];
    } catch (error) {
      logger.error('[AgentQueue] Failed to dequeue agent messages', { error, recipientAgent });
      return [];
    }
  }

  /**
   * Mark a message as successfully processed
   */
  async markProcessed(messageId: string): Promise<void> {
    try {
      await db.update(agentMessageInbox)
        .set({
          status: 'delivered',
          processedAt: new Date()
        })
        .where(eq(agentMessageInbox.id, messageId));
      
      logger.debug(`[AgentQueue] Marked message ${messageId} as delivered`);
    } catch (error) {
      logger.error('[AgentQueue] Failed to mark message processed', { error, messageId });
    }
  }

  /**
   * Mark a message as failed (handling retries)
   */
  async markFailed(messageId: string, errorMsg?: string): Promise<void> {
    try {
      const [msg] = await db.select()
        .from(agentMessageInbox)
        .where(eq(agentMessageInbox.id, messageId))
        .limit(1);

      if (!msg) return;

      const maxAttempts = 3;
      const attempts = msg.attempts ?? 0;
      const willRetry = attempts < maxAttempts;

      await db.update(agentMessageInbox)
        .set({
          status: willRetry ? 'queued' : 'failed',
          processedAt: willRetry ? null : new Date(),
          payload: {
            ...((msg.payload as Record<string, any>) || {}),
            lastError: errorMsg || 'Unknown error'
          }
        })
        .where(eq(agentMessageInbox.id, messageId));

      logger.warn(`[AgentQueue] Message ${messageId} failed. ${willRetry ? 'Scheduled for retry.' : 'Moved to failed queue.'}`, {
        attempts,
        error: errorMsg
      });
    } catch (error) {
      logger.error('[AgentQueue] Failed to process message failure status', { error, messageId });
    }
  }
}

export const agentQueueService = new AgentQueueService();

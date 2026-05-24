import { db } from '../db';
import { agentMemory, type AgentMemory, type NewAgentMemory } from '@shared/schema/vectors';
import { localEmbeddingsService } from './localEmbeddingsService';
import { sql, eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger';

export class AgentMemoryService {
  /**
   * Stores episodic multi-agent memory in local pgvector
   */
  async storeMemory(
    organizationId: string,
    memoryType: 'successful_action' | 'user_correction' | 'self_reflection',
    content: string,
    impactScore?: string
  ): Promise<AgentMemory> {
    try {
      const embedding = await localEmbeddingsService.generateEmbedding(content);

      const [newMemory] = await db.insert(agentMemory).values({
        organizationId,
        memoryType,
        content,
        embedding,
        impactScore: impactScore || 'medium',
      }).returning();

      logger.info('Episodic agent memory successfully vaulted', {
        id: newMemory.id,
        memoryType,
        contentLength: content.length,
      });

      return newMemory as AgentMemory;
    } catch (error) {
      logger.error('Failed to store agent memory in pgvector', { error });
      throw new Error('Failed to store episodic memory');
    }
  }

  /**
   * Performs semantic similarity search on agent memory using pgvector cosine distance
   */
  async retrieveMemories(
    organizationId: string,
    query: string,
    options: {
      memoryType?: 'successful_action' | 'user_correction' | 'self_reflection';
      limit?: number;
    } = {}
  ): Promise<Array<AgentMemory & { similarity: number }>> {
    const limit = options.limit || 5;
    const memoryType = options.memoryType;

    try {
      const queryEmbedding = await localEmbeddingsService.generateEmbedding(query);
      const embeddingStr = `[${queryEmbedding.join(',')}]`;

      let querySql;
      if (memoryType) {
        querySql = sql`
          SELECT id, organization_id as "organizationId", memory_type as "memoryType", content, impact_score as "impactScore", created_at as "createdAt",
                 (1 - (embedding <=> ${embeddingStr}::vector)) as similarity
          FROM agent_memory
          WHERE organization_id = ${organizationId} AND memory_type = ${memoryType}
          ORDER BY embedding <=> ${embeddingStr}::vector ASC
          LIMIT ${limit}
        `;
      } else {
        querySql = sql`
          SELECT id, organization_id as "organizationId", memory_type as "memoryType", content, impact_score as "impactScore", created_at as "createdAt",
                 (1 - (embedding <=> ${embeddingStr}::vector)) as similarity
          FROM agent_memory
          WHERE organization_id = ${organizationId}
          ORDER BY embedding <=> ${embeddingStr}::vector ASC
          LIMIT ${limit}
        `;
      }

      const results = await db.execute(querySql);
      
      return (results.rows as any[]).map(row => ({
        id: row.id,
        organizationId: row.organizationId,
        memoryType: row.memoryType,
        content: row.content,
        embedding: null,
        impactScore: row.impactScore,
        createdAt: new Date(row.createdAt),
        similarity: parseFloat(row.similarity ?? '0')
      }));

    } catch (error) {
      logger.error('Semantic search failed in agent memory pgvector query', { error });
      return [];
    }
  }
}

export const agentMemoryService = new AgentMemoryService();

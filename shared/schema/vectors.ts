/**
 * AI Vector Embeddings Schema
 *
 * Defines the vector tables for RAG (Retrieval-Augmented Generation).
 * Uses pgvector's `vector` type via the @electric-sql/pglite `vector` extension,
 * which runs fully embedded inside the app — no external vector DB server needed.
 *
 * Embedding dimensions:
 *   - OpenAI text-embedding-3-small: 1536
 *   - OpenAI text-embedding-3-large: 3072
 */

import { pgTable, text, integer, timestamp, index, vector } from "drizzle-orm/pg-core";
import crypto from "crypto";

// Vector embedding dimensions for OpenAI text-embedding-3-small
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Document chunk embeddings for RAG search.
 * Each row is a text chunk of a compliance document or evidence file
 * with its corresponding vector embedding for semantic similarity search.
 */
export const documentEmbeddings = pgTable(
  "document_embeddings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    // Source reference
    documentId: text("document_id"),
    evidenceId: text("evidence_id"),
    organizationId: text("organization_id"),
    // The chunk of text this embedding represents
    content: text("content").notNull(),
    // Metadata for filtering
    framework: text("framework"), // 'fedramp' | 'nist' | 'iso27001' | 'soc2'
    chunkIndex: integer("chunk_index").notNull().default(0),
    // The actual vector embedding (1536 dims for text-embedding-3-small)
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    // HNSW index for fast approximate nearest-neighbour vector search
    index("document_embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    index("document_embeddings_org_idx").on(table.organizationId),
    index("document_embeddings_framework_idx").on(table.framework),
  ]
);

/**
 * Compliance control embeddings for semantic control matching.
 * Used to find relevant controls when analyzing evidence.
 */
export const controlEmbeddings = pgTable(
  "control_embeddings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    controlId: text("control_id").notNull(),
    framework: text("framework").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("control_embeddings_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    index("control_embeddings_framework_idx").on(table.framework),
  ]
);

export type DocumentEmbedding = typeof documentEmbeddings.$inferSelect;
export type NewDocumentEmbedding = typeof documentEmbeddings.$inferInsert;
export type ControlEmbedding = typeof controlEmbeddings.$inferSelect;
export type NewControlEmbedding = typeof controlEmbeddings.$inferInsert;

// Agent Long-Term Episodic Memory (pgvector table)
export const agentMemory = pgTable(
  "agent_memory",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    organizationId: text("organization_id"),
    memoryType: text("memory_type").notNull(), // 'successful_action', 'user_correction', 'self_reflection'
    content: text("content").notNull(),
    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }), 
    impactScore: text("impact_score"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("agent_memory_vector_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
    index("agent_memory_org_idx").on(table.organizationId),
  ]
);

export type AgentMemory = typeof agentMemory.$inferSelect;
export type NewAgentMemory = typeof agentMemory.$inferInsert;

/**
 * Schema Migrations Table
 * Tracks database schema version history for safe upgrades
 */

import { pgTable, integer, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const schemaMigrations = pgTable('schema_migrations', {
  version: integer('version').primaryKey(),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
  description: text('description').notNull(),
});

export const databaseSnapshots = pgTable('database_snapshots', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  snapshotType: text('snapshot_type').notNull(), // 'auto', 'manual', 'before-migration', 'before-import'
  filePath: text('file_path'),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  retentionUntil: timestamp('retention_until'), // NULL = keep forever
  description: text('description'),
});

export const projectSettings = pgTable('project_settings', {
  projectId: text('project_id').primaryKey(),
  frameworks: text('frameworks').array().notNull().default(sql`ARRAY[]::text[]`),
  backupSchedule: text('backup_schedule').default('daily'),
  encryptionEnabled: boolean('encryption_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usageMetrics = pgTable('usage_metrics', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  eventType: text('event_type').notNull(), // 'document_generated', 'import_completed', 'llm_call'
  eventData: text('event_data'), // JSON string
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Types
export type SchemaMigration = typeof schemaMigrations.$inferSelect;
export type InsertSchemaMigration = typeof schemaMigrations.$inferInsert;

export type DatabaseSnapshot = typeof databaseSnapshots.$inferSelect;
export type InsertDatabaseSnapshot = typeof databaseSnapshots.$inferInsert;

export type ProjectSettings = typeof projectSettings.$inferSelect;
export type InsertProjectSettings = typeof projectSettings.$inferInsert;

export type UsageMetric = typeof usageMetrics.$inferSelect;
export type InsertUsageMetric = typeof usageMetrics.$inferInsert;

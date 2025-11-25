import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

const createMockDb = () => {
  const notConfigured = () => {
    throw new Error("Database not configured. Set DATABASE_URL to enable persistence.");
  };

  return {
    // Minimal execute implementation for health checks and lightweight probes
    async execute() {
      return { rows: [], rowCount: 0 } as const;
    },
    // Surface a helpful error for any data access attempts during tests
    query: new Proxy({}, { get: () => notConfigured }),
    select: () => ({ from: notConfigured }),
    insert: () => ({ values: notConfigured }),
    update: () => ({ set: notConfigured }),
    delete: () => ({ where: notConfigured }),
  };
};

const databaseUrl = process.env.DATABASE_URL;

export const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

const drizzleDb: NeonDatabase<typeof schema> | ReturnType<typeof createMockDb> =
  pool ? drizzle({ client: pool, schema }) : createMockDb();

export const db = drizzleDb;
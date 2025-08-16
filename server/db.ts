import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

export let pool: Pool | null = null;
let database: NeonDatabase<typeof schema>;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  database = drizzle({ client: pool as Pool, schema });
} else {
  // Provide a typed no-op database for environments without a connection
  database = {} as unknown as NeonDatabase<typeof schema>;
}

export const db = database;
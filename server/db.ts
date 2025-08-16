import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

export let pool: Pool | null = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
}

export const db = process.env.DATABASE_URL
  ? drizzle({ client: pool as Pool, schema })
  : {
      async execute() {
        throw new Error('DATABASE_URL not configured');
      },
    };
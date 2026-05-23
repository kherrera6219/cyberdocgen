import { defineConfig } from "drizzle-kit";
import path from "path";
import os from "os";

const localAppData = process.env.LOCALAPPDATA?.trim();
const pgDataDir = localAppData
  ? path.resolve(localAppData, 'CyberDocGen', 'pgdata')
  : path.resolve(os.homedir(), '.cyberdocgen', 'pgdata');

export default defineConfig({
  out: "./server/migrations/pglite",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: `file:${pgDataDir}`,
  },
});

import { defineConfig } from "drizzle-kit";


export default defineConfig({
  out: "./server/migrations/sqlite",
  schema: "./shared/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: "local-data/cyberdocgen.db",
  },
});

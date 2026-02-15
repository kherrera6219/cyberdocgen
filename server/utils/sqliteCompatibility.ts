import { randomUUID } from "crypto";

type SqliteFunctionRegistrar = {
  function(name: string, fn: (...args: any[]) => unknown): unknown;
};

/**
 * Register compatibility functions expected by PostgreSQL-oriented Drizzle schema defaults.
 * This keeps local SQLite mode functional when shared schema defaults emit SQL like now()/gen_random_uuid().
 */
export function registerSqliteCompatibilityFunctions(sqlite: SqliteFunctionRegistrar): void {
  sqlite.function("now", () => new Date().toISOString());
  sqlite.function("gen_random_uuid", () => randomUUID());
}

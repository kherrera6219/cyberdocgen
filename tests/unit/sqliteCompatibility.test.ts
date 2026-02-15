import { describe, it, expect, vi } from "vitest";
import { randomUUID } from "crypto";
import { registerSqliteCompatibilityFunctions } from "../../server/utils/sqliteCompatibility";

describe("registerSqliteCompatibilityFunctions", () => {
  it("registers now and gen_random_uuid functions", () => {
    const registered = new Map<string, (...args: any[]) => unknown>();
    const sqliteMock = {
      function: vi.fn((name: string, fn: (...args: any[]) => unknown) => {
        registered.set(name, fn);
      }),
    };

    registerSqliteCompatibilityFunctions(sqliteMock);

    expect(sqliteMock.function).toHaveBeenCalledTimes(2);
    expect(registered.has("now")).toBe(true);
    expect(registered.has("gen_random_uuid")).toBe(true);
  });

  it("returns usable values from compatibility functions", () => {
    const registered = new Map<string, (...args: any[]) => unknown>();
    const sqliteMock = {
      function: vi.fn((name: string, fn: (...args: any[]) => unknown) => {
        registered.set(name, fn);
      }),
    };

    registerSqliteCompatibilityFunctions(sqliteMock);

    const nowValue = registered.get("now")!();
    const uuidValue = registered.get("gen_random_uuid")!();

    expect(typeof nowValue).toBe("string");
    expect(Number.isNaN(Date.parse(nowValue as string))).toBe(false);
    expect(typeof uuidValue).toBe("string");
    expect((uuidValue as string)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );

    // Sanity-check format compatibility with Node's UUID implementation.
    expect((uuidValue as string).length).toBe(randomUUID().length);
  });
});

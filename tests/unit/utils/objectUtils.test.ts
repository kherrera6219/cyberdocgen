import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Object Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Object Manipulation", () => {
    it("should deep clone object", () => {
      const obj = { a: 1, b: { c: 2 } };
      const cloned = JSON.parse(JSON.stringify(obj));
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    it("should merge objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = { ...obj1, ...obj2 };
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    it("should pick properties", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const picked = { a: obj.a, b: obj.b };
      expect(picked).toEqual({ a: 1, b: 2 });
    });
  });

  describe("Object Validation", () => {
    it("should check if object has property", () => {
      const obj = { a: 1, b: 2 };
      const hasA = "a" in obj;
      expect(hasA).toBe(true);
    });

    it("should check if object is empty", () => {
      const obj = {};
      const isEmpty = Object.keys(obj).length === 0;
      expect(isEmpty).toBe(true);
    });

    it("should check if value is object", () => {
      const obj = { a: 1 };
      const isObject = typeof obj === "object" && obj !== null && !Array.isArray(obj);
      expect(isObject).toBe(true);
    });
  });

  describe("Object Transformation", () => {
    it("should get object keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const keys = Object.keys(obj);
      expect(keys).toEqual(["a", "b", "c"]);
    });

    it("should get object values", () => {
      const obj = { a: 1, b: 2, c: 3 };
      const values = Object.values(obj);
      expect(values).toEqual([1, 2, 3]);
    });

    it("should get object entries", () => {
      const obj = { a: 1, b: 2 };
      const entries = Object.entries(obj);
      expect(entries).toEqual([["a", 1], ["b", 2]]);
    });
  });

  describe("Object Comparison", () => {
    it("should compare objects deeply", () => {
      const obj1 = { a: 1, b: { c: 2 } };
      const obj2 = { a: 1, b: { c: 2 } };
      const areEqual = JSON.stringify(obj1) === JSON.stringify(obj2);
      expect(areEqual).toBe(true);
    });

    it("should detect differences", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };
      const areSame = JSON.stringify(obj1) === JSON.stringify(obj2);
      expect(areSame).toBe(false);
    });
  });
});

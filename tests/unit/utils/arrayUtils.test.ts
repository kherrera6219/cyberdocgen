import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Array Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Array Manipulation", () => {
    it("should remove duplicates", () => {
      const arr = [1, 2, 2, 3, 3, 4];
      const unique = [...new Set(arr)];
      expect(unique).toEqual([1, 2, 3, 4]);
    });

    it("should flatten array", () => {
      const arr = [[1, 2], [3, 4], [5]];
      const flat = arr.flat();
      expect(flat).toEqual([1, 2, 3, 4, 5]);
    });

    it("should chunk array", () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const size = 2;
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      expect(chunks.length).toBe(3);
    });
  });

  describe("Array Search", () => {
    it("should find element", () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const found = arr.find(item => item.id === 2);
      expect(found?.id).toBe(2);
    });

    it("should filter array", () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = arr.filter(n => n > 3);
      expect(filtered).toEqual([4, 5]);
    });

    it("should check if array includes element", () => {
      const arr = [1, 2, 3];
      const includes = arr.includes(2);
      expect(includes).toBe(true);
    });
  });

  describe("Array Sorting", () => {
    it("should sort numbers", () => {
      const arr = [3, 1, 4, 1, 5, 9];
      const sorted = [...arr].sort((a, b) => a - b);
      expect(sorted[0]).toBe(1);
    });

    it("should sort objects", () => {
      const arr = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const sorted = [...arr].sort((a, b) => a.value - b.value);
      expect(sorted[0].value).toBe(1);
    });
  });

  describe("Array Transformation", () => {
    it("should map array", () => {
      const arr = [1, 2, 3];
      const mapped = arr.map(n => n * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });

    it("should reduce array", () => {
      const arr = [1, 2, 3, 4];
      const sum = arr.reduce((acc, n) => acc + n, 0);
      expect(sum).toBe(10);
    });
  });

  describe("Array Validation", () => {
    it("should check if array is empty", () => {
      const arr: number[] = [];
      const isEmpty = arr.length === 0;
      expect(isEmpty).toBe(true);
    });

    it("should check if all elements match condition", () => {
      const arr = [2, 4, 6, 8];
      const allEven = arr.every(n => n % 2 === 0);
      expect(allEven).toBe(true);
    });

    it("should check if some elements match condition", () => {
      const arr = [1, 2, 3, 4];
      const hasEven = arr.some(n => n % 2 === 0);
      expect(hasEven).toBe(true);
    });
  });
});

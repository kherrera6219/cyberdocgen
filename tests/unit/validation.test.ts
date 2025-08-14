import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";
import {
  sanitizeString,
  sanitizeEmail,
  sanitizeFilename,
  validateSchema,
  paginationSchema,
  idParamSchema,
  searchSchema,
} from "../../server/utils/validation";

describe("Validation Utils", () => {
  describe("sanitizeString", () => {
    it("should remove script tags", () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitizeString(input);
      expect(result).toBe("Hello  World");
    });

    it("should remove iframe tags", () => {
      const input = 'Hello <iframe src="malicious.com"></iframe> World';
      const result = sanitizeString(input);
      expect(result).toBe("Hello  World");
    });

    it("should remove javascript: protocols", () => {
      const input = 'Hello javascript:alert("xss") World';
      const result = sanitizeString(input);
      expect(result).toBe("Hello alert(\"xss\") World");
    });

    it("should remove event handlers", () => {
      const input = 'Hello onclick="alert(1)" World';
      const result = sanitizeString(input);
      expect(result).toBe("Hello  World");
    });

    it("should trim whitespace", () => {
      const input = "  Hello World  ";
      const result = sanitizeString(input);
      expect(result).toBe("Hello World");
    });

    it("should limit string length", () => {
      const input = "A".repeat(2000);
      const result = sanitizeString(input, 100);
      expect(result).toHaveLength(100);
    });
  });

  describe("sanitizeEmail", () => {
    it("should convert to lowercase", () => {
      const input = "Test@Example.COM";
      const result = sanitizeEmail(input);
      expect(result).toBe("test@example.com");
    });

    it("should trim whitespace", () => {
      const input = "  test@example.com  ";
      const result = sanitizeEmail(input);
      expect(result).toBe("test@example.com");
    });
  });

  describe("sanitizeFilename", () => {
    it("should replace invalid characters with underscores", () => {
      const input = "my file<name>.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("my_file_name_.txt");
    });

    it("should collapse multiple underscores", () => {
      const input = "my___file.txt";
      const result = sanitizeFilename(input);
      expect(result).toBe("my_file.txt");
    });

    it("should limit filename length", () => {
      const input = "A".repeat(300) + ".txt";
      const result = sanitizeFilename(input);
      expect(result).toHaveLength(255);
    });
  });

  describe("paginationSchema", () => {
    it("should validate valid pagination params", () => {
      const input = { page: "1", limit: "20", sortOrder: "desc" };
      const result = paginationSchema.parse(input);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: "desc",
      });
    });

    it("should use defaults for missing params", () => {
      const input = {};
      const result = paginationSchema.parse(input);
      expect(result).toEqual({
        page: 1,
        limit: 20,
        sortOrder: "desc",
      });
    });

    it("should reject invalid page numbers", () => {
      const input = { page: "invalid" };
      expect(() => paginationSchema.parse(input)).toThrow();
    });
  });

  describe("idParamSchema", () => {
    it("should validate valid UUIDs", () => {
      const input = { id: "123e4567-e89b-12d3-a456-426614174000" };
      const result = idParamSchema.parse(input);
      expect(result.id).toBe("123e4567-e89b-12d3-a456-426614174000");
    });

    it("should reject invalid UUIDs", () => {
      const input = { id: "invalid-uuid" };
      expect(() => idParamSchema.parse(input)).toThrow();
    });
  });

  describe("searchSchema", () => {
    it("should validate valid search params", () => {
      const input = {
        q: "test",
        framework: "ISO27001",
        status: "approved",
      };
      const result = searchSchema.parse(input);
      expect(result).toEqual(input);
    });

    it("should reject invalid framework", () => {
      const input = { framework: "INVALID" };
      expect(() => searchSchema.parse(input)).toThrow();
    });

    it("should reject invalid status", () => {
      const input = { status: "INVALID" };
      expect(() => searchSchema.parse(input)).toThrow();
    });
  });

  describe("validateSchema middleware", () => {
    it("should pass validation with valid data", () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      const middleware = validateSchema(schema);
      const req = {
        body: { name: "John" },
        query: { age: "25" },
        validated: undefined,
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(req.validated).toEqual({ name: "John", age: "25" });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should fail validation with invalid data", () => {
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().min(0),
      });

      const middleware = validateSchema(schema);
      const req = {
        body: { name: "" },
        query: { age: "invalid" },
      };
      const res = {
        status: vi.fn(() => res),
        json: vi.fn(),
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: "Validation failed",
        errors: expect.any(Array),
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
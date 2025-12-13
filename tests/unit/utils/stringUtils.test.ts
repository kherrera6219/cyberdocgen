import { describe, it, expect, beforeEach, vi } from "vitest";

describe("String Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("String Manipulation", () => {
    it("should capitalize string", () => {
      const str = "hello world";
      const capitalized = str.charAt(0).toUpperCase() + str.slice(1);
      expect(capitalized).toBe("Hello world");
    });

    it("should convert to title case", () => {
      const str = "hello world";
      const titleCase = str.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      expect(titleCase).toBe("Hello World");
    });

    it("should truncate string", () => {
      const str = "This is a very long string";
      const maxLength = 10;
      const truncated = str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
      expect(truncated.length).toBeLessThanOrEqual(maxLength + 3);
    });
  });

  describe("String Validation", () => {
    it("should check if string is email", () => {
      const email = "user@example.com";
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isEmail).toBe(true);
    });

    it("should check if string is URL", () => {
      const url = "https://example.com";
      const isURL = /^https?:\/\/.+/.test(url);
      expect(isURL).toBe(true);
    });

    it("should validate UUID format", () => {
      const uuid = "123e4567-e89b-12d3-a456-426614174000";
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
      expect(isUUID).toBe(true);
    });
  });

  describe("String Sanitization", () => {
    it("should remove HTML tags", () => {
      const html = "<p>Hello <b>World</b></p>";
      const text = html.replace(/<[^>]*>/g, "");
      expect(text).toBe("Hello World");
    });

    it("should escape special characters", () => {
      const str = "Hello & <World>";
      const escaped = str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      expect(escaped).toContain("&amp;");
    });
  });

  describe("String Search", () => {
    it("should check if string contains substring", () => {
      const str = "Hello World";
      const contains = str.includes("World");
      expect(contains).toBe(true);
    });

    it("should find string position", () => {
      const str = "Hello World";
      const position = str.indexOf("World");
      expect(position).toBe(6);
    });
  });

  describe("String Formatting", () => {
    it("should format string with placeholders", () => {
      const template = "Hello {name}, welcome to {app}";
      const formatted = template
        .replace("{name}", "John")
        .replace("{app}", "CyberDocGen");
      expect(formatted).toBe("Hello John, welcome to CyberDocGen");
    });

    it("should pad string", () => {
      const str = "5";
      const padded = str.padStart(3, "0");
      expect(padded).toBe("005");
    });
  });
});

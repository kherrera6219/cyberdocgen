import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Date Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Date Formatting", () => {
    it("should format date to ISO string", () => {
      const date = new Date("2024-01-01");
      const formatted = date.toISOString();
      expect(formatted).toContain("2024-01-01");
    });

    it("should format date to locale string", () => {
      const date = new Date("2024-01-01");
      const formatted = date.toLocaleDateString("en-US");
      expect(formatted).toBeTruthy();
    });
  });

  describe("Date Arithmetic", () => {
    it("should add days to date", () => {
      const date = new Date("2024-01-01");
      const daysToAdd = 7;
      const newDate = new Date(date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      expect(newDate.getDate()).toBe(8);
    });

    it("should calculate days between dates", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-01-08");
      const days = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      expect(days).toBe(7);
    });
  });

  describe("Date Validation", () => {
    it("should validate date format", () => {
      const dateString = "2024-01-01";
      const isValid = !isNaN(Date.parse(dateString));
      expect(isValid).toBe(true);
    });

    it("should reject invalid dates", () => {
      const dateString = "invalid-date";
      const isValid = !isNaN(Date.parse(dateString));
      expect(isValid).toBe(false);
    });
  });

  describe("Date Comparison", () => {
    it("should compare dates", () => {
      const date1 = new Date("2024-01-01");
      const date2 = new Date("2024-01-02");
      const isAfter = date2 > date1;
      expect(isAfter).toBe(true);
    });

    it("should check if date is in past", () => {
      const pastDate = new Date("2020-01-01");
      const isPast = pastDate < new Date();
      expect(isPast).toBe(true);
    });
  });

  describe("Timezone Handling", () => {
    it("should convert to UTC", () => {
      const date = new Date();
      const utc = date.toUTCString();
      expect(utc).toContain("GMT");
    });

    it("should get timezone offset", () => {
      const date = new Date();
      const offset = date.getTimezoneOffset();
      expect(typeof offset).toBe("number");
    });
  });
});

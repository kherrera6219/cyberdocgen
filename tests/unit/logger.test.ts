import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { logger, LogLevel } from "../../server/utils/logger";

// Mock console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug,
};

describe("Logger", () => {
  beforeEach(() => {
    // Reset console mocks
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  });

  afterAll(() => {
    // Restore original console methods
    Object.assign(console, originalConsole);
  });

  describe("error logging", () => {
    it("should log error messages", () => {
      logger.error("Test error message");
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("Test error message")
      );
    });

    it("should include context in error logs", () => {
      const context = { userId: "123", action: "test" };
      logger.error("Test error", context);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining(JSON.stringify(context))
      );
    });

    it("should include request information when provided", () => {
      const req = {
        headers: { "x-request-id": "req-123" },
        user: { claims: { sub: "user-456" } },
        ip: "127.0.0.1",
      };
      logger.error("Test error", {}, req as any);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[req-123]")
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[User: user-456]")
      );
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[IP: 127.0.0.1]")
      );
    });
  });

  describe("warn logging", () => {
    it("should log warning messages", () => {
      logger.warn("Test warning message");
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]")
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("Test warning message")
      );
    });
  });

  describe("info logging", () => {
    it("should log info messages", () => {
      logger.info("Test info message");
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]")
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("Test info message")
      );
    });
  });

  describe("debug logging", () => {
    it("should log debug messages in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      logger.debug("Test debug message");
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("[DEBUG]")
      );
      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining("Test debug message")
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should not log debug messages in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      logger.debug("Test debug message");
      expect(console.debug).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("audit logging", () => {
    it("should format audit logs correctly", () => {
      logger.audit("CREATE", "document", "user-123", { documentId: "doc-456" });
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("AUDIT: CREATE on document")
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("documentId")
      );
    });
  });

  describe("security logging", () => {
    it("should log high severity security events as errors", () => {
      logger.security("Failed login attempt", "high", { attempts: 5 });
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("SECURITY: Failed login attempt")
      );
    });

    it("should log medium severity security events as warnings", () => {
      logger.security("Suspicious activity", "medium", { ip: "1.2.3.4" });
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("SECURITY: Suspicious activity")
      );
    });

    it("should log low severity security events as info", () => {
      logger.security("Password changed", "low");
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("SECURITY: Password changed")
      );
    });
  });

  describe("log formatting", () => {
    it("should include timestamp in logs", () => {
      logger.info("Test message");
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      );
    });

    it("should format log levels consistently", () => {
      logger.error("Error");
      logger.warn("Warning");
      logger.info("Info");

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("[WARN]")
      );
      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]")
      );
    });
  });
});
import { Request } from "express";
import crypto from 'crypto';

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

// PII patterns to redact from logs
const PII_PATTERNS = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  // SSN with delimiters only (avoid matching generic 9-digit IDs)
  { pattern: /\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  // Credit card numbers with optional separators
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded groups used for redaction-only
  { pattern: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g, replacement: '[CREDIT_CARD_REDACTED]' },
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded groups used for redaction-only
  { pattern: /\b(?:\+?1[-.]?)?\(?[0-9]{3}\)?[-.]?[0-9]{3}[-.]?[0-9]{4}\b/g, replacement: '[PHONE_REDACTED]' },
  // IPv4 addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_REDACTED]' },
  // IPv6 addresses (simplified pattern)
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded groups used for redaction-only
  { pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g, replacement: '[IP_REDACTED]' },
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded groups used for redaction-only
  { pattern: /\b(?:[0-9a-fA-F]{1,4}:){1,7}:\b/g, replacement: '[IP_REDACTED]' },
  // eslint-disable-next-line security/detect-unsafe-regex -- bounded groups used for redaction-only
  { pattern: /::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}\b/g, replacement: '[IP_REDACTED]' },
  // Credentials in various formats
  { pattern: /(?:password|passwd|pwd|secret|token|apikey|api_key|bearer|authorization)\s*[:=]\s*["']?[^"'\s]{4,}/gi, replacement: '[CREDENTIAL_REDACTED]' },
];

// Scrub PII from a string
function scrubPII(value: string): string {
  let result = value;
  for (const { pattern, replacement } of PII_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

// Recursively scrub PII from objects
function scrubPIIFromObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'string') {
    return scrubPII(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => scrubPIIFromObject(item));
  }
  if (typeof obj === 'object') {
    const scrubbedEntries: Array<[string, unknown]> = [];
    for (const [key, value] of Object.entries(obj)) {
      // Redact sensitive keys entirely
      if (/password|secret|token|apikey|api_key|authorization|bearer/i.test(key)) {
        scrubbedEntries.push([key, '[REDACTED]']);
      } else {
        scrubbedEntries.push([key, scrubPIIFromObject(value)]);
      }
    }
    return Object.fromEntries(scrubbedEntries);
  }
  return obj;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: unknown;
  requestId?: string;
  userId?: string;
  ip?: string;
}

// Mocking auditLogs and getColorCode as they were referenced in the changes but not provided in the original code.
// In a real scenario, these would be properly implemented within the Logger class.
interface AuditLogEntry {
  timestamp: string;
  level: LogLevel | 'error'; // Union type to match the 'error' string literal used in changes
  message: string;
  meta?: unknown;
  logId: string;
  service: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private auditLogs: AuditLogEntry[] = []; // Mock implementation

  // Mock getColorCode method as it's used in the changes
  private getColorCode(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      case LogLevel.WARN: return '\x1b[33m'; // Yellow
      case LogLevel.INFO: return '\x1b[32m'; // Green
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      default: return '';
    }
  }

  private formatLog(entry: LogEntry): string {
    const { timestamp, level, message, context, requestId, userId, ip } = entry;

    let logString = `${timestamp} [${level.toUpperCase()}]`;

    if (requestId) logString += ` [${requestId}]`;
    if (userId) logString += ` [User: ${userId}]`;
    if (ip) logString += ` [IP: ${ip}]`;

    logString += ` ${message}`;

    if (context && typeof context === 'object' && Object.keys(context as Record<string, unknown>).length > 0) {
      logString += ` | Context: ${JSON.stringify(context)}`;
    }

    return logString;
  }

  // This method was modified to fix the recursive call
  private log(level: LogLevel, message: string, meta?: unknown, req?: Request): void {
    const timestamp = new Date().toISOString();
    const logId = crypto.randomBytes(4).toString('hex');

    // Scrub PII from message and metadata
    const scrubbedMessage = scrubPII(message);
    const scrubbedMeta = meta ? scrubPIIFromObject(meta) : undefined;

    const entry: AuditLogEntry = {
      timestamp,
      level,
      message: scrubbedMessage,
      meta: scrubbedMeta,
      logId,
      service: 'complianceai'
    };

    // Build log message with metadata
    let logMessage = `${timestamp} [${level.toUpperCase()}] ${scrubbedMessage}`;

    // Add request info if provided (scrub IP addresses in production)
    if (req) {
      const requestId = req.headers?.['x-request-id'];
      const userId = (req as any).user?.claims?.sub;
      const ip = process.env.NODE_ENV === 'production' ? '[IP_REDACTED]' : req.ip;

      if (requestId) logMessage += ` [${requestId}]`;
      if (userId) logMessage += ` [User: ${userId}]`;
      if (ip) logMessage += ` [IP: ${ip}]`;
    }

    // Add metadata if provided
    if (scrubbedMeta && Object.keys(scrubbedMeta).length > 0) {
      logMessage += ` ${JSON.stringify(scrubbedMeta)}`;
    }

    // Console output based on log level
    const colorCode = this.getColorCode(level);
    const coloredMessage = `${colorCode}${logMessage}\x1b[0m`;

    // Only log debug messages in development
    if (level === LogLevel.DEBUG && process.env.NODE_ENV !== 'development') {
      return;
    }

    switch (level) {
      case LogLevel.ERROR:
        console.error(coloredMessage);
        break;
      case LogLevel.WARN:
        console.warn(coloredMessage);
        break;
      case LogLevel.INFO:
        console.info(coloredMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(coloredMessage);
        break;
      default:
        console.log(coloredMessage);
    }

    // Store in audit trail for compliance
    this.auditLogs.push(entry);

    // Keep only last 10000 entries in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  // This method was rewritten to prevent infinite recursion
  error(message: string, meta?: unknown, req?: Request): void {
    try {
      const timestamp = new Date().toISOString();
      const logId = crypto.randomBytes(4).toString('hex');

      // Scrub PII from message and metadata
      const scrubbedMessage = scrubPII(message);
      const scrubbedMeta = meta ? scrubPIIFromObject(meta) : undefined;

      const entry: AuditLogEntry = {
        timestamp,
        level: 'error' as LogLevel, // Explicitly casting to LogLevel
        message: scrubbedMessage,
        meta: scrubbedMeta,
        logId,
        service: 'complianceai'
      };

      // Build log message with metadata
      let logMessage = `${timestamp} [ERROR] ${scrubbedMessage}`;

      // Add request info if provided (scrub IP addresses in production)
      if (req) {
        const requestId = req.headers?.['x-request-id'];
        const userId = (req as any).user?.claims?.sub;
        const ip = process.env.NODE_ENV === 'production' ? '[IP_REDACTED]' : req.ip;

        if (requestId) logMessage += ` [${requestId}]`;
        if (userId) logMessage += ` [User: ${userId}]`;
        if (ip) logMessage += ` [IP: ${ip}]`;
      }

      // Add metadata if provided
      if (scrubbedMeta && Object.keys(scrubbedMeta).length > 0) {
        logMessage += ` ${JSON.stringify(scrubbedMeta)}`;
      }

      // Console output for errors
      const colorCode = '\x1b[31m'; // Red for errors
      console.error(`${colorCode}${logMessage}\x1b[0m`);

      // Store in audit trail
      this.auditLogs.push(entry);

      // Keep only last 10000 entries in memory
      if (this.auditLogs.length > 10000) {
        this.auditLogs = this.auditLogs.slice(-10000);
      }

      // In production, also write to error output
      if (process.env.NODE_ENV === 'production') {
        // In a real scenario, this might send to an external service
        console.error(`[PRODUCTION ERROR] ${logMessage}`);
      }
    } catch (e) {
      // Fallback to console.error to prevent recursion
      console.error(`Error logging failed: ${message}`);
    }
  }

  warn(message: string, context?: unknown, req?: Request): void {
    // The original call to this.log(LogLevel.WARN, message, context, req) has been replaced
    // with a direct call to the modified internal log method, passing context as meta.
    this.log(LogLevel.WARN, message, context, req);
  }

  info(message: string, context?: unknown, req?: Request): void {
    // The original call to this.log(LogLevel.INFO, message, context, req) has been replaced
    // with a direct call to the modified internal log method, passing context as meta.
    this.log(LogLevel.INFO, message, context, req);
  }

  debug(message: string, context?: unknown, req?: Request): void {
    // The original call to this.log(LogLevel.DEBUG, message, context, req) has been replaced
    // with a direct call to the modified internal log method, passing context as meta.
    this.log(LogLevel.DEBUG, message, context, req);
  }

  // Audit logging for compliance
  audit(action: string, resource: string, userId: string, details?: Record<string, any>, req?: Request): void {
    this.info(`AUDIT: ${action} on ${resource}`, {
      action,
      resource,
      userId,
      ...details,
    }, req);
  }

  // Security logging
  security(event: string, severity: "low" | "medium" | "high", details?: Record<string, any>, req?: Request): void {
    const level = severity === "high" ? LogLevel.ERROR : severity === "medium" ? LogLevel.WARN : LogLevel.INFO;
    // The original call to this.log(level, `SECURITY: ${event}`, { ... }, req) has been replaced
    // with a direct call to the modified internal log method.
    this.log(level, `SECURITY: ${event}`, {
      event,
      severity,
      ...details,
    }, req);
  }
}

export const logger = new Logger();

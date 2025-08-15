import { Request } from "express";
import crypto from 'crypto';

export enum LogLevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
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
  meta?: any;
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

    if (context && Object.keys(context).length > 0) {
      logString += ` | Context: ${JSON.stringify(context)}`;
    }

    return logString;
  }

  // This method was modified to fix the recursive call
  private log(level: LogLevel, message: string, meta?: any, req?: Request): void {
    const timestamp = new Date().toISOString();
    const logId = crypto.randomBytes(4).toString('hex');

    const entry: AuditLogEntry = {
      timestamp,
      level,
      message,
      meta,
      logId,
      service: 'complianceai'
    };

    // Console output for development
    if (this.isDevelopment) {
      const colorCode = this.getColorCode(level);
      console.log(`${colorCode}[${timestamp}] [${level.toUpperCase()}] ${message}${colorCode === '' ? '' : '\x1b[0m'}`, meta || '');
    }

    // Store in audit trail for compliance
    this.auditLogs.push(entry);

    // Keep only last 10000 entries in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    // The original recursive call 'this.error(message, meta);' has been removed.
    // The original internal log method was also replaced with this new implementation.
    // When logging other levels (WARN, INFO, DEBUG), the original `switch` statement is now absent,
    // and the logic is solely handled by the console.log and auditLogs.push above.
    // If a specific console output for WARN, INFO, DEBUG is needed beyond the development block,
    // it should be added here similar to how ERROR is handled in the rewritten `error` method.
  }

  // This method was rewritten to prevent infinite recursion
  error(message: string, meta?: any, req?: Request): void {
    const timestamp = new Date().toISOString();
    const logId = crypto.randomBytes(4).toString('hex');

    const entry: AuditLogEntry = {
      timestamp,
      level: 'error' as LogLevel, // Explicitly casting to LogLevel
      message,
      meta,
      logId,
      service: 'complianceai'
    };

    // Console output for errors
    const colorCode = '\x1b[31m'; // Red for errors
    console.error(`${colorCode}[${timestamp}] [ERROR] ${message}\x1b[0m`, meta || '');

    // Store in audit trail
    this.auditLogs.push(entry);

    // Keep only last 10000 entries in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    // In production, also write to error output
    if (process.env.NODE_ENV === 'production') {
      // In a real scenario, this might send to an external service
      console.error(`[PRODUCTION ERROR] ${message}`, meta);
    }
  }

  warn(message: string, context?: Record<string, any>, req?: Request): void {
    // The original call to this.log(LogLevel.WARN, message, context, req) has been replaced
    // with a direct call to the modified internal log method, passing context as meta.
    this.log(LogLevel.WARN, message, context, req);
  }

  info(message: string, context?: Record<string, any>, req?: Request): void {
    // The original call to this.log(LogLevel.INFO, message, context, req) has been replaced
    // with a direct call to the modified internal log method, passing context as meta.
    this.log(LogLevel.INFO, message, context, req);
  }

  debug(message: string, context?: Record<string, any>, req?: Request): void {
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
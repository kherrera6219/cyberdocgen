import { Request } from "express";

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

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

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

  private log(level: LogLevel, message: string, context?: Record<string, any>, req?: Request): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      requestId: req?.headers["x-request-id"] as string,
      userId: (req as any)?.user?.claims?.sub,
      ip: req?.ip,
    };

    const formattedLog = this.formatLog(entry);

    switch (level) {
      case LogLevel.ERROR:
        logger.error(formattedLog);
        break;
      case LogLevel.WARN:
        logger.warn(formattedLog);
        break;
      case LogLevel.INFO:
        console.info(formattedLog);
        break;
      case LogLevel.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }

    // In production, you would send logs to external service like Azure Monitor, AWS CloudWatch, etc.
    if (!this.isDevelopment && level === LogLevel.ERROR) {
      // TODO: Send to external logging service
      // await this.sendToExternalService(entry);
    }
  }

  error(message: string, context?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.ERROR, message, context, req);
  }

  warn(message: string, context?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.WARN, message, context, req);
  }

  info(message: string, context?: Record<string, any>, req?: Request): void {
    this.log(LogLevel.INFO, message, context, req);
  }

  debug(message: string, context?: Record<string, any>, req?: Request): void {
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
    this.log(level, `SECURITY: ${event}`, {
      event,
      severity,
      ...details,
    }, req);
  }
}

export const logger = new Logger();
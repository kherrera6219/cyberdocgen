import { Request } from 'express';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

class Logger {
  private isDev = process.env.NODE_ENV !== 'production';

  private format(level: LogLevel, message: string, context?: Record<string, any>, req?: Request): string {
    const timestamp = new Date().toISOString();
    let line = `[${timestamp}] [${level.toUpperCase()}]`;

    const requestId = req?.headers?.['x-request-id'];
    const userId = (req as any)?.user?.claims?.sub;
    const ip = req?.ip;

    if (requestId) line += ` [${requestId}]`;
    if (userId) line += ` [User: ${userId}]`;
    if (ip) line += ` [IP: ${ip}]`;

    line += ` ${message}`;

    if (context && Object.keys(context).length > 0) {
      line += ` | Context: ${JSON.stringify(context)}`;
    }

    return line;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, req?: Request): void {
    const line = this.format(level, message, context, req);
    switch (level) {
      case LogLevel.ERROR:
        console.error(line);
        break;
      case LogLevel.WARN:
        console.warn(line);
        break;
      case LogLevel.INFO:
        console.info(line);
        break;
      case LogLevel.DEBUG:
        if (this.isDev) {
          console.debug(line);
        }
        break;
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

  audit(action: string, resource: string, userId: string, details?: Record<string, any>, req?: Request): void {
    this.info(`AUDIT: ${action} on ${resource}`, { userId, ...details }, req);
  }

  security(event: string, severity: 'low' | 'medium' | 'high', details?: Record<string, any>, req?: Request): void {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, `SECURITY: ${event}`, { severity, ...details }, req);
  }
}

export const logger = new Logger();

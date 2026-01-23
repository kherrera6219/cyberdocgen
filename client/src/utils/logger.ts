/**
 * Client-side logger utility
 * Provides structured logging with environment-aware output
 */

/* eslint-env node, browser */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private isDevelopment = import.meta.env.MODE === 'development' || process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, message: string, data?: Record<string, unknown> | unknown) {
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        if (data) {
          console.error(prefix, message, data);
        } else {
          console.error(prefix, message);
        }
        break;
      case 'warn':
        if (data) {
          console.warn(prefix, message, data);
        } else {
          console.warn(prefix, message);
        }
        break;
      case 'info':
        if (data) {
          console.info(prefix, message, data);
        } else {
          console.info(prefix, message);
        }
        break;
      case 'debug':
        if (data) {
          console.debug(prefix, message, data);
        } else {
          console.debug(prefix, message);
        }
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown> | unknown) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown> | unknown) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown> | unknown) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown> | unknown) {
    this.log('error', message, data);
  }
}

export const logger = new ClientLogger();

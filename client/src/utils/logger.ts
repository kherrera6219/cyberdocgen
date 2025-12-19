/**
 * Client-side logger utility
 * Provides structured logging with environment-aware output
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class ClientLogger {
  private isDevelopment = import.meta.env.DEV || process.env.NODE_ENV !== 'production';

  private log(level: LogLevel, message: string, data?: any) {
    // In production, only log warnings and errors
    if (!this.isDevelopment && (level === 'debug' || level === 'info')) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        data ? console.error(prefix, message, data) : console.error(prefix, message);
        break;
      case 'warn':
        data ? console.warn(prefix, message, data) : console.warn(prefix, message);
        break;
      case 'info':
        data ? console.info(prefix, message, data) : console.info(prefix, message);
        break;
      case 'debug':
        data ? console.debug(prefix, message, data) : console.debug(prefix, message);
        break;
    }
  }

  debug(message: string, data?: any) {
    this.log('debug', message, data);
  }

  info(message: string, data?: any) {
    this.log('info', message, data);
  }

  warn(message: string, data?: any) {
    this.log('warn', message, data);
  }

  error(message: string, data?: any) {
    this.log('error', message, data);
  }
}

export const logger = new ClientLogger();

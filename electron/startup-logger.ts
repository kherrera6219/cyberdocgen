/**
 * Startup Logger for Electron Desktop App
 * 
 * Purpose: Capture ALL server startup logs and errors to disk for debugging
 * Location: %APPDATA%/CyberDocGen/logs/startup.log
 * 
 * This logger is critical because:
 * - Forked server process errors aren't visible in Electron console
 * - Production builds have no DevTools by default
 * - Need persistent logs for user bug reports
 */

import fs from 'fs';
import path from 'path';
import { app } from 'electron';

const LOG_DIR = path.join(app.getPath('userData'), 'logs');
const STARTUP_LOG = path.join(LOG_DIR, 'startup.log');
const MAX_LOG_FILES = 5;

/**
 * Ensure log directory exists
 */
function ensureLogDirectory(): void {
  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
  } catch (error) {
    console.error('[Startup Logger] Failed to create log directory:', error);
  }
}

/**
 * Rotate logs - keep only last N log files
 */
function rotateLogs(): void {
  try {
    if (!fs.existsSync(STARTUP_LOG)) {
      return;
    }

    // Get file size
    const stats = fs.statSync(STARTUP_LOG);
    const fileSizeMB = stats.size / (1024 * 1024);

    // Rotate if larger than 5MB
    if (fileSizeMB > 5) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const archiveName = path.join(LOG_DIR, `startup-${timestamp}.log`);
      
      fs.renameSync(STARTUP_LOG, archiveName);

      // Clean up old logs (keep only MAX_LOG_FILES)
      const logFiles = fs.readdirSync(LOG_DIR)
        .filter(f => f.startsWith('startup-') && f.endsWith('.log'))
        .map(f => ({
          name: f,
          path: path.join(LOG_DIR, f),
          time: fs.statSync(path.join(LOG_DIR, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      // Delete old logs beyond MAX_LOG_FILES
      logFiles.slice(MAX_LOG_FILES - 1).forEach(log => {
        try {
          fs.unlinkSync(log.path);
        } catch (err) {
          console.error('[Startup Logger] Failed to delete old log:', err);
        }
      });
    }
  } catch (error) {
    console.error('[Startup Logger] Failed to rotate logs:', error);
  }
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  let formatted = `[${timestamp}] [${level}] ${message}`;
  
  if (data !== undefined) {
    try {
      formatted += '\n' + JSON.stringify(data, null, 2);
    } catch (err) {
      formatted += '\n' + String(data);
    }
  }
  
  return formatted + '\n';
}

/**
 * Write log entry to file
 */
function writeLog(level: string, message: string, data?: any): void {
  try {
    ensureLogDirectory();
    rotateLogs();
    
    const formatted = formatMessage(level, message, data);
    fs.appendFileSync(STARTUP_LOG, formatted, 'utf8');
    
    // Also log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Startup] ${formatted.trim()}`);
    }
  } catch (error) {
    console.error('[Startup Logger] Failed to write log:', error);
  }
}

/**
 * Startup logger interface
 */
export const startupLogger = {
  info(message: string, data?: any): void {
    writeLog('INFO', message, data);
  },

  warn(message: string, data?: any): void {
    writeLog('WARN', message, data);
  },

  error(message: string, data?: any): void {
    writeLog('ERROR', message, data);
    console.error('[Startup Error]', message, data);
  },

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      writeLog('DEBUG', message, data);
    }
  },

  /**
   * Log server process stdout
   */
  serverOutput(data: Buffer | string): void {
    const message = data.toString().trim();
    if (message) {
      writeLog('SERVER', message);
    }
  },

  /**
   * Log server process stderr
   */
  serverError(data: Buffer | string): void {
    const message = data.toString().trim();
    if (message) {
      writeLog('SERVER_ERROR', message);
    }
  },

  /**
   * Get log file path for user reference
   */
  getLogPath(): string {
    return STARTUP_LOG;
  },

  /**
   * Clear current log (for testing)
   */
  clear(): void {
    try {
      if (fs.existsSync(STARTUP_LOG)) {
        fs.unlinkSync(STARTUP_LOG);
      }
    } catch (error) {
      console.error('[Startup Logger] Failed to clear log:', error);
    }
  },

  /**
   * Write session separator
   */
  startSession(): void {
    const separator = '\n' + '='.repeat(80) + '\n';
    const header = `NEW SESSION STARTED: ${new Date().toISOString()}`;
    try {
      ensureLogDirectory();
      fs.appendFileSync(STARTUP_LOG, separator + header + separator, 'utf8');
    } catch (error) {
      console.error('[Startup Logger] Failed to write session header:', error);
    }
  }
};

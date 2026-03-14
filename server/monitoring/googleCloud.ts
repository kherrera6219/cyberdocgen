import { logger, setExternalLogger } from '../utils/logger';
import { LoggingWinston } from '@google-cloud/logging-winston';
import { ErrorReporting } from '@google-cloud/error-reporting';
import winston from 'winston';

export function initializeGoogleCloudOperations(app?: any) {
  logger.info('[GoogleCloud] Initializing Google Cloud Operations...');

  try {
    // 1. Initialize Google Cloud Logging
    const loggingWinston = new LoggingWinston();

    const gcpLogger = winston.createLogger({
      level: 'info',
      transports: [
        new winston.transports.Console(),
        loggingWinston,
      ],
    });

    // Wire application logger to GCP Winston
    setExternalLogger(gcpLogger);

    // 2. Initialize Google Cloud Error Reporting
    const errors = new ErrorReporting();
    
    if (app) {
      // Plug into Express middleware
      app.use(errors.express);
    }
    
    // Catch-all handlers
    process.on('uncaughtException', (err) => {
      errors.report(err);
      gcpLogger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    });

    process.on('unhandledRejection', (reason) => {
      errors.report(reason as Error);
      gcpLogger.error('Unhandled Rejection', { reason });
    });

    gcpLogger.info('[GoogleCloud] Google Cloud Operations initialized with LoggingWinston & ErrorReporting.');
  } catch (err: any) {
    logger.warn('[GoogleCloud] Failed to initialize GCP Operations. Falling back to local logging.', { error: err.message });
  }
}

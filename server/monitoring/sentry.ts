/**
 * Sentry Error Monitoring - Backend Initialization
 *
 * Captures unhandled exceptions and provides error tracking for the server.
 * Configure SENTRY_DSN environment variable to enable.
 */
import * as Sentry from "@sentry/node";
import { logger } from "../utils/logger";

export function initializeSentry(): void {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.info("Sentry DSN not configured, error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "development",
    release: process.env.npm_package_version || "2.4.0",

    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint?.originalException;

      // Skip expected errors
      if (error instanceof Error) {
        // Skip 404s, auth failures, etc.
        if (
          error.message.includes("Not Found") ||
          error.message.includes("Unauthorized") ||
          error.message.includes("ECONNRESET")
        ) {
          return null;
        }
      }

      return event;
    },

    // Sanitize sensitive data
    beforeSendTransaction(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-api-key"];
      }
      return event;
    },
  });

  logger.info("Sentry error monitoring initialized", {
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version,
  });
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN) return;

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message for tracking
 */
export function captureMessage(
  message: string,
  level: "info" | "warning" | "error" = "info"
): void {
  if (!process.env.SENTRY_DSN) return;

  Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string, organizationId?: string): void {
  if (!process.env.SENTRY_DSN) return;

  Sentry.setUser({
    id: userId,
    email,
    organizationId,
  } as Sentry.User);
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (!process.env.SENTRY_DSN) return;

  Sentry.setUser(null);
}

/**
 * Express error handler middleware
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Express request handler middleware (must be first middleware)
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler();

export { Sentry };

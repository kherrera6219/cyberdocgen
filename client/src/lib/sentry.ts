/**
 * Sentry Error Monitoring - Frontend Initialization
 * 
 * Captures unhandled exceptions and provides error tracking for the React app.
 * Configure VITE_SENTRY_DSN environment variable to enable.
 */
import * as Sentry from '@sentry/react';

export function initializeSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.info('[Sentry] DSN not configured, error monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || '2.4.0',
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    
    // Session replay for debugging
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    
    // Filter out non-critical errors
    beforeSend(event, hint) {
      const error = hint?.originalException;
      
      if (error instanceof Error) {
        // Skip network errors, ResizeObserver, etc.
        if (error.message.includes('Network Error') ||
            error.message.includes('ResizeObserver loop') ||
            error.message.includes('Script error')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Sanitize URLs
    beforeBreadcrumb(breadcrumb) {
      // Remove auth tokens from URLs
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /token=[^&]+/g, 
          'token=[REDACTED]'
        );
      }
      return breadcrumb;
    },
  });

  console.info('[Sentry] Error monitoring initialized');
}

/**
 * Capture an exception manually
 */
export function captureException(error: Error, context?: Record<string, unknown>): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  
  Sentry.setUser({
    id: userId,
    email,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext(): void {
  if (!import.meta.env.VITE_SENTRY_DSN) return;
  
  Sentry.setUser(null);
}

/**
 * React Error Boundary wrapper with Sentry integration
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

export { Sentry };

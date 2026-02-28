/**
 * Sentry Client Configuration
 * Error tracking and performance monitoring for Nightlife.ID
 */

import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      
      // Environment
      environment: process.env.NODE_ENV,
      
      // Release tracking
      release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
      
      // Sample rate for transactions (performance monitoring)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Sample rate for error events
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Enable debugging in development
      debug: process.env.NODE_ENV === 'development',
      
      // Ignore certain errors
      ignoreErrors: [
        'NetworkError',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],
      
      // Attach additional data
      attachStacktrace: true,
      maxBreadcrumbs: 50,
      
      // Integration: Capture uncaught exceptions
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      
      // Before sending an event
      beforeSend(event, hint) {
        // Filter out certain errors
        const error = hint.originalException;
        if (error instanceof Error) {
          // Don't capture certain errors
          if (error.message.includes('Hydration')) {
            return null;
          }
        }
        return event;
      },
    });
  }
}

export { Sentry };

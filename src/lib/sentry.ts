/**
 * =====================================================
 * SENTRY ERROR TRACKING INTEGRATION
 * AfterHoursID - System Governance
 * =====================================================
 */

import * as Sentry from '@sentry/nextjs';

// Sentry configuration
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance monitoring
  tracesSampleRate: 1.0,
  
  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release tracking
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  
  // Ignore certain errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    /Loading chunk \d+ failed/,
  ],
  
  // Filter events
  beforeSend(event) {
    // Add custom filtering
    if (process.env.NODE_ENV === 'development') {
      return null; // Don't send in dev
    }
    return event;
  },
  
  // Attachments
  maxBreadcrumbs: 50,
  
  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

/**
 * Capture custom error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture custom message
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
  Sentry.captureMessage(message, level);
}

/**
 * Add user context
 */
export function setUser(user: { id: string; email?: string; name?: string } | null) {
  Sentry.setUser(user);
}

/**
 * Add breadcrumb
 */
export function addBreadcrumb(message: string, category: string = 'action') {
  Sentry.addBreadcrumb({
    message,
    category,
    level: 'info',
  });
}

/**
 * Create transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  return Sentry.startSpan({ name, op }, () => {});
}

/**
 * Set extra context
 */
export function setExtra(key: string, value: any) {
  Sentry.setExtra(key, value);
}

/**
 * Set tag
 */
export function setTag(key: string, value: string) {
  Sentry.setTag(key, value);
}

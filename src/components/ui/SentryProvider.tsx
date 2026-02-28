'use client';

import { useEffect, ReactNode } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * SentryProvider - Initializes Sentry on the client side
 * This component should be added to your app layout
 */
export default function SentryProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize Sentry on client side
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
        environment: process.env.NODE_ENV,
        release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        integrations: [
          Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });
    }
  }, []);

  return <>{children}</>;
}

/**
 * Hook for manually capturing errors to Sentry
 */
export function useSentry() {
  const captureException = (error: Error, context?: Record<string, unknown>) => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  };

  const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.captureMessage(message, level);
    }
  };

  const setUser = (user: { id: string; email?: string; username?: string } | null) => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.setUser(user);
    }
  };

  const addBreadcrumb = (breadcrumb: {
    category?: string;
    message?: string;
    level?: Sentry.SeverityLevel;
    data?: Record<string, unknown>;
  }) => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  };

  return {
    captureException,
    captureMessage,
    setUser,
    addBreadcrumb,
  };
}

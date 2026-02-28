import pino from 'pino';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
  base: {
    service: 'afterhours-id',
    version: process.env.APP_VERSION || '1.0.0',
  },
});

// Create module-specific logger
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// Audit logger for sensitive operations
export const auditLogger = logger.child({ type: 'audit' });

// Log security events
export const logSecurityEvent = (
  event: string,
  details: {
    userId?: string;
    ip?: string;
    userAgent?: string;
    action: string;
    resource?: string;
    result: 'success' | 'failure';
  }
) => {
  auditLogger.info({
    event,
    ...details,
    timestamp: new Date().toISOString(),
  });
};

// Log API performance
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
) => {
  logger.info({
    type: 'performance',
    operation,
    duration,
    ...metadata,
  });
};

// Error handler for Next.js
export const errorHandler = (err: Error, context?: Record<string, unknown>) => {
  logger.error({
    err,
    ...context,
    stack: err.stack,
  });

  // Send to error tracking service (e.g., Sentry)
  if (process.env.ERROR_TRACKING_URL) {
    fetch(process.env.ERROR_TRACKING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: err.message,
        stack: err.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }
};

// Health check logger
export const logHealthCheck = (status: 'healthy' | 'unhealthy', details: Record<string, unknown>) => {
  logger.info({
    type: 'health-check',
    status,
    ...details,
  });
};

export default logger;

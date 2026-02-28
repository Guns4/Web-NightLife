/**
 * =====================================================
 * CENTRALIZED LOGGING SYSTEM (Pino)
 * Production-grade logging for all services
 * =====================================================
 */

import pino from "pino";
import type { NextRequest } from "next/server";

// Log level configuration
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug");

// Create logger instance with performance optimization
export const logger = pino({
  level: LOG_LEVEL,
  
  // Use pino-pretty in development
  ...(process.env.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),

  // Formatter for production
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },

  // Timestamp with timezone
  timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,

  // Base metadata
  base: {
    service: "afterhours-api",
    version: process.env.npm_package_version || "1.0.0",
  },

  // Redact sensitive data
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.token",
      "*.secret",
      "*.apiKey",
      "body.password",
      "body.token",
    ],
    censor: "[REDACTED]",
  },
});

/**
 * Create a child logger with context
 */
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

/**
 * Request logger middleware
 * Attach to API routes for automatic request/response logging
 */
export function logRequest(req: NextRequest, context?: Record<string, any>) {
  const startTime = Date.now();
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  const log = logger.child({
    requestId,
    method: req.method,
    url: req.url,
    ...context,
  });

  log.info({
    type: "request",
    headers: Object.fromEntries(req.headers.entries()),
  });

  return {
    log,
    requestId,
    startTime,
    end: (status: number, error?: Error) => {
      const duration = Date.now() - startTime;
      
      if (error || status >= 500) {
        log.error({
          type: "response",
          status,
          duration,
          error: error?.message,
          stack: error?.stack,
        });
      } else if (status >= 400) {
        log.warn({
          type: "response",
          status,
          duration,
        });
      } else {
        log.info({
          type: "response",
          status,
          duration,
        });
      }
    },
  };
}

/**
 * Structured logging helpers
 */
export const log = {
  // Auth events
  auth: {
    login: (userId: string, email: string, success: boolean) => {
      logger.info({ userId, email, success, event: "auth_login" }, 
        success ? "User logged in" : "Login failed");
    },
    logout: (userId: string) => {
      logger.info({ userId, event: "auth_logout" }, "User logged out");
    },
    register: (userId: string, email: string, role: string) => {
      logger.info({ userId, email, role, event: "auth_register" }, "User registered");
    },
    tokenRefresh: (userId: string, success: boolean) => {
      logger.info({ userId, success, event: "token_refresh" }, 
        success ? "Token refreshed" : "Token refresh failed");
    },
  },

  // Venue events
  venue: {
    search: (query: string, results: number, duration: number) => {
      logger.info({ query, results, duration, event: "venue_search" }, 
        "Venue search completed");
    },
    view: (venueId: string, userId?: string) => {
      logger.info({ venueId, userId, event: "venue_view" }, "Venue viewed");
    },
    create: (venueId: string, ownerId: string) => {
      logger.info({ venueId, ownerId, event: "venue_create" }, "Venue created");
    },
  },

  // Booking events
  booking: {
    create: (bookingId: string, venueId: string, userId: string) => {
      logger.info({ bookingId, venueId, userId, event: "booking_create" }, 
        "Booking created");
    },
    cancel: (bookingId: string, userId: string) => {
      logger.info({ bookingId, userId, event: "booking_cancel" }, 
        "Booking cancelled");
    },
  },

  // Payment events
  payment: {
    create: (paymentId: string, amount: number, currency: string) => {
      logger.info({ paymentId, amount, currency, event: "payment_create" }, 
        "Payment initiated");
    },
    success: (paymentId: string) => {
      logger.info({ paymentId, event: "payment_success" }, "Payment successful");
    },
    failed: (paymentId: string, reason: string) => {
      logger.error({ paymentId, reason, event: "payment_failed" }, 
        "Payment failed");
    },
  },

  // Security events
  security: {
    rateLimit: (identifier: string, endpoint: string) => {
      logger.warn({ identifier, endpoint, event: "rate_limit_exceeded" }, 
        "Rate limit exceeded");
    },
    suspiciousActivity: (details: Record<string, any>) => {
      logger.warn({ ...details, event: "suspicious_activity" }, 
        "Suspicious activity detected");
    },
    unauthorizedAccess: (userId: string, resource: string) => {
      logger.warn({ userId, resource, event: "unauthorized_access" }, 
        "Unauthorized access attempt");
    },
  },

  // Performance events
  performance: {
    slowQuery: (query: string, duration: number, threshold: number = 1000) => {
      logger.warn({ query, duration, threshold, event: "slow_query" }, 
        `Slow query detected (${duration}ms)`);
    },
    cacheHit: (key: string) => {
      logger.debug({ key, event: "cache_hit" }, "Cache hit");
    },
    cacheMiss: (key: string) => {
      logger.debug({ key, event: "cache_miss" }, "Cache miss");
    },
  },
};

export default logger;

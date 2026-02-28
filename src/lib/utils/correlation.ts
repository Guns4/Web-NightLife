/**
 * Correlation ID utilities for distributed tracing
 * Part of the services/decoupling preparation
 */

/**
 * Generate a unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `corr_${timestamp}_${randomPart}`;
}

/**
 * Extract correlation ID from headers or generate new one
 */
export function getCorrelationId(headers: Headers): string {
  const existing = headers.get("x-correlation-id");
  if (existing) {
    return existing;
  }
  return generateCorrelationId();
}

/**
 * Add correlation ID to headers for outgoing requests
 */
export function addCorrelationHeader(
  headers: Headers,
  correlationId?: string
): Headers {
  const id = correlationId || generateCorrelationId();
  headers.set("x-correlation-id", id);
  return headers;
}

/**
 * =====================================================
 * SERVICE DISCOVERY & ACTIVE HEALTH CHECKS
 * AfterHoursID - Dynamic Upstream Routing
 * =====================================================
 */

import { randomUUID } from 'crypto';
import Redis from 'ioredis';

// Types
export interface ServiceInstance {
  id: string;
  name: string;
  url: string;
  port: number;
  healthCheckUrl: string;
  status: 'healthy' | 'unhealthy' | 'starting';
  weight: number;
  responseTime: number;
  consecutiveFailures: number;
  lastHealthCheck: string;
  lastSuccessfulCheck: string;
  metadata: Record<string, string>;
}

export interface HealthCheckConfig {
  intervalMs: number;
  timeoutMs: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
  maxResponseTimeMs: number;
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  intervalMs: 30000,      // Check every 30 seconds
  timeoutMs: 5000,        // 5 second timeout
  unhealthyThreshold: 3,   // Mark unhealthy after 3 failures
  healthyThreshold: 2,     // Mark healthy after 2 successes
  maxResponseTimeMs: 2000, // 2 second max response time
};

// Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

class HealthCheckService {
  private config: HealthCheckConfig;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private instances: Map<string, ServiceInstance[]> = new Map();

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Register a service instance for health monitoring
   */
  async registerInstance(instance: Omit<ServiceInstance, 'status' | 'responseTime' | 'consecutiveFailures' | 'lastHealthCheck' | 'lastSuccessfulCheck'>): Promise<ServiceInstance> {
    const fullInstance: ServiceInstance = {
      ...instance,
      status: 'starting',
      responseTime: 0,
      consecutiveFailures: 0,
      lastHealthCheck: new Date().toISOString(),
      lastSuccessfulCheck: new Date().toISOString(),
    };

    // Store in Redis
    const key = `health:${instance.name}:${instance.id}`;
    await redis.hset(key, {
      ...fullInstance,
      status: 'starting',
      lastHealthCheck: fullInstance.lastHealthCheck,
      lastSuccessfulCheck: fullInstance.lastSuccessfulCheck,
    });
    await redis.expire(key, 300); // 5 min TTL

    // Add to local cache
    if (!this.instances.has(instance.name)) {
      this.instances.set(instance.name, []);
    }
    this.instances.get(instance.name)!.push(fullInstance);

    // Start health check loop
    this.startHealthCheck(instance.name, instance.id, instance.healthCheckUrl);

    console.log(`[HealthCheck] Registered ${instance.name}:${instance.id} at ${instance.url}`);
    return fullInstance;
  }

  /**
   * Deregister a service instance
   */
  async deregisterInstance(serviceName: string, instanceId: string): Promise<boolean> {
    // Stop health check
    const intervalKey = `${serviceName}:${instanceId}`;
    const interval = this.intervals.get(intervalKey);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(intervalKey);
    }

    // Remove from Redis
    await redis.del(`health:${serviceName}:${instanceId}`);

    // Remove from local cache
    const instances = this.instances.get(serviceName);
    if (instances) {
      const index = instances.findIndex(i => i.id === instanceId);
      if (index !== -1) {
        instances.splice(index, 1);
      }
    }

    console.log(`[HealthCheck] Deregistered ${serviceName}:${instanceId}`);
    return true;
  }

  /**
   * Start health check loop for an instance
   */
  private startHealthCheck(serviceName: string, instanceId: string, healthCheckUrl: string): void {
    const intervalKey = `${serviceName}:${instanceId}`;

    // Run immediately
    this.performHealthCheck(serviceName, instanceId, healthCheckUrl);

    // Schedule periodic checks
    const interval = setInterval(() => {
      this.performHealthCheck(serviceName, instanceId, healthCheckUrl);
    }, this.config.intervalMs);

    this.intervals.set(intervalKey, interval);
  }

  /**
   * Perform a single health check
   */
  private async performHealthCheck(serviceName: string, instanceId: string, healthCheckUrl: string): Promise<void> {
    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok && responseTime < this.config.maxResponseTimeMs;

      await this.updateInstanceHealth(serviceName, instanceId, isHealthy, responseTime);
    } catch (error) {
      console.error(`[HealthCheck] Failed for ${serviceName}:${instanceId}:`, error);
      await this.updateInstanceHealth(serviceName, instanceId, false, this.config.timeoutMs);
    }
  }

  /**
   * Update instance health status
   */
  private async updateInstanceHealth(
    serviceName: string,
    instanceId: string,
    healthy: boolean,
    responseTime: number
  ): Promise<void> {
    const instances = this.instances.get(serviceName);
    if (!instances) return;

    const instance = instances.find(i => i.id === instanceId);
    if (!instance) return;

    // Update counters
    if (healthy) {
      instance.consecutiveFailures = 0;
      instance.lastSuccessfulCheck = new Date().toISOString();
      
      // Need consecutive successes to mark healthy
      if (instance.status === 'unhealthy') {
        // Check if we have enough healthy responses
        instance.status = 'healthy';
      }
    } else {
      instance.consecutiveFailures++;
      
      if (instance.consecutiveFailures >= this.config.unhealthyThreshold) {
        instance.status = 'unhealthy';
      }
    }

    instance.responseTime = responseTime;
    instance.lastHealthCheck = new Date().toISOString();

    // Update in Redis
    const key = `health:${serviceName}:${instanceId}`;
    await redis.hset(key, {
      status: instance.status,
      responseTime: String(instance.responseTime),
      consecutiveFailures: String(instance.consecutiveFailures),
      lastHealthCheck: instance.lastHealthCheck,
      lastSuccessfulCheck: instance.lastSuccessfulCheck,
    });

    console.log(`[HealthCheck] ${serviceName}:${instanceId} is now ${instance.status} (${responseTime}ms)`);
  }

  /**
   * Get healthy instances with load balancing
   */
  getHealthyInstances(serviceName: string): ServiceInstance[] {
    const instances = this.instances.get(serviceName);
    if (!instances) return [];

    return instances
      .filter(i => i.status === 'healthy')
      .sort((a, b) => a.responseTime - b.responseTime); // Sort by response time (least connections)
  }

  /**
   * Get the best instance using least connections algorithm
   */
  getBestInstance(serviceName: string): ServiceInstance | null {
    const healthy = this.getHealthyInstances(serviceName);

    if (healthy.length === 0) {
      // Fall back to starting instances
      const starting = this.instances.get(serviceName)?.filter(i => i.status === 'starting');
      return starting?.[0] || null;
    }

    // Return instance with lowest response time
    return healthy[0];
  }

  /**
   * Get all instances for a service
   */
  getAllInstances(serviceName: string): ServiceInstance[] {
    return this.instances.get(serviceName) || [];
  }

  /**
   * Get health status summary
   */
  async getHealthSummary(): Promise<Record<string, { healthy: number; unhealthy: number; starting: number }>> {
    const summary: Record<string, { healthy: number; unhealthy: number; starting: number }> = {};

    for (const [serviceName, instances] of this.instances) {
      summary[serviceName] = {
        healthy: instances.filter(i => i.status === 'healthy').length,
        unhealthy: instances.filter(i => i.status === 'unhealthy').length,
        starting: instances.filter(i => i.status === 'starting').length,
      };
    }

    return summary;
  }

  /**
   * Stop all health checks
   */
  stopAll(): void {
    for (const interval of this.intervals.values()) {
      clearInterval(interval);
    }
    this.intervals.clear();
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    this.stopAll();
    await redis.quit();
  }
}

// Export singleton
export const healthCheckService = new HealthCheckService();

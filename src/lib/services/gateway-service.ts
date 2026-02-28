/**
 * =====================================================
 * DYNAMIC GATEWAY & SERVICE DISCOVERY
 * AfterHoursID - Traffic Backbone
 * =====================================================
 */

import { randomBytes } from 'crypto';

// Types
export interface ServiceInstance {
  id: string;
  name: string;
  url: string;
  port: number;
  healthCheckUrl: string;
  status: 'healthy' | 'unhealthy' | 'starting';
  weight: number;
  lastHealthCheck: Date;
  metadata: Record<string, string>;
}

export interface ServiceRegistry {
  name: string;
  instances: Map<string, ServiceInstance>;
  strategy: 'round_robin' | 'weighted' | 'least_connections';
}

export interface RouteConfig {
  path: string;
  service: string;
  methods: string[];
  authRequired: boolean;
  rateLimit?: number;
}

// Service Registry (use etcd/consul in production)
const serviceRegistries = new Map<string, ServiceRegistry>();

// Event Bus (RabbitMQ-style)
type EventHandler = (event: Event) => Promise<void>;

interface Event {
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  correlationId: string;
}

const eventHandlers = new Map<string, EventHandler[]>();

// =====================================================
// SERVICE DISCOVERY
// =====================================================

/**
 * Register a service instance
 */
export function registerService(serviceName: string, instance: Omit<ServiceInstance, 'id' | 'status' | 'lastHealthCheck'>): ServiceInstance {
  const id = randomBytes(16).toString('hex');
  
  const fullInstance: ServiceInstance = {
    ...instance,
    id,
    status: 'starting',
    lastHealthCheck: new Date(),
  };
  
  if (!serviceRegistries.has(serviceName)) {
    serviceRegistries.set(serviceName, {
      name: serviceName,
      instances: new Map(),
      strategy: 'weighted',
    });
  }
  
  const registry = serviceRegistries.get(serviceName)!;
  registry.instances.set(id, fullInstance);
  
  console.log(`[Service Discovery] Registered ${serviceName} instance: ${id} at ${instance.url}`);
  
  return fullInstance;
}

/**
 * Deregister a service instance
 */
export function deregisterService(serviceName: string, instanceId: string): boolean {
  const registry = serviceRegistries.get(serviceName);
  if (!registry) return false;
  
  const deleted = registry.instances.delete(instanceId);
  if (deleted) {
    console.log(`[Service Discovery] Deregistered ${serviceName} instance: ${instanceId}`);
  }
  
  return deleted;
}

/**
 * Get healthy instances for a service
 */
export function getHealthyInstances(serviceName: string): ServiceInstance[] {
  const registry = serviceRegistries.get(serviceName);
  if (!registry) return [];
  
  const healthy: ServiceInstance[] = [];
  
  for (const instance of registry.instances.values()) {
    if (instance.status === 'healthy') {
      healthy.push(instance);
    }
  }
  
  return healthy;
}

/**
 * Get instance using load balancing strategy
 */
export function getInstance(serviceName: string): ServiceInstance | null {
  const instances = getHealthyInstances(serviceName);
  
  if (instances.length === 0) {
    return null;
  }
  
  const registry = serviceRegistries.get(serviceName);
  if (!registry) return instances[0];
  
  switch (registry.strategy) {
    case 'round_robin':
      // Simple round-robin
      return instances[Math.floor(Math.random() * instances.length)];
      
    case 'weighted':
      // Weighted random selection
      const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
      let random = Math.random() * totalWeight;
      for (const instance of instances) {
        random -= instance.weight;
        if (random <= 0) return instance;
      }
      return instances[0];
      
    default:
      return instances[0];
  }
}

/**
 * Update instance health status
 */
export function updateInstanceHealth(
  serviceName: string,
  instanceId: string,
  healthy: boolean
): boolean {
  const registry = serviceRegistries.get(serviceName);
  if (!registry) return false;
  
  const instance = registry.instances.get(instanceId);
  if (!instance) return false;
  
  instance.status = healthy ? 'healthy' : 'unhealthy';
  instance.lastHealthCheck = new Date();
  
  return true;
}

// =====================================================
// EVENT BUS (RABBITMQ-STYLE)
// =====================================================

/**
 * Subscribe to an event
 */
export function subscribe(eventType: string, handler: EventHandler): void {
  if (!eventHandlers.has(eventType)) {
    eventHandlers.set(eventType, []);
  }
  
  eventHandlers.get(eventType)!.push(handler);
  console.log(`[Event Bus] Subscribed to event: ${eventType}`);
}

/**
 * Publish an event
 */
export async function publish(eventType: string, payload: Record<string, unknown>): Promise<void> {
  const event: Event = {
    type: eventType,
    payload,
    timestamp: new Date(),
    correlationId: randomBytes(16).toString('hex'),
  };
  
  console.log(`[Event Bus] Publishing event: ${eventType}`, event.correlationId);
  
  // Handle direct handlers
  const handlers = eventHandlers.get(eventType) || [];
  
  // Handle wildcard handlers
  const wildcardHandlers = eventHandlers.get('*') || [];
  
  const allHandlers = [...handlers, ...wildcardHandlers];
  
  // Execute all handlers
  await Promise.allSettled(
    allHandlers.map(handler => handler(event).catch(err => 
      console.error(`[Event Bus] Handler error:`, err)
    ))
  );
}

/**
 * Setup event subscriptions
 */
export function setupEventSubscriptions(): void {
  // User created -> Welcome email + XP
  subscribe('user.created', async (event) => {
    console.log('[Event] Handling user.created:', event.correlationId);
    // Send welcome email
    // Award initial XP
  });
  
  // Promo published -> Notify partners
  subscribe('promo.published', async (event) => {
    console.log('[Event] Handling promo.published:', event.correlationId);
    // Trigger webhooks
  });
  
  // Reservation created -> Notify venue
  subscribe('reservation.created', async (event) => {
    console.log('[Event] Handling reservation.created:', event.correlationId);
    // Send confirmation
  });
  
  // Membership upgraded -> Grant benefits
  subscribe('membership.upgraded', async (event) => {
    console.log('[Event] Handling membership.upgraded:', event.correlationId);
    // Grant benefits
  });
}

// Initialize event subscriptions
setupEventSubscriptions();

// =====================================================
// DYNAMIC ROUTING
// =====================================================

/**
 * Route configuration
 */
const routes: RouteConfig[] = [
  { path: '/api/v1/venues', service: 'venue-service', methods: ['GET'], authRequired: false },
  { path: '/api/v1/promos', service: 'promo-service', methods: ['GET'], authRequired: false },
  { path: '/api/merchant', service: 'merchant-service', methods: ['GET', 'POST', 'PUT'], authRequired: true },
  { path: '/api/admin', service: 'admin-service', methods: ['GET', 'POST'], authRequired: true, rateLimit: 100 },
  { path: '/api/reviews', service: 'review-service', methods: ['GET', 'POST'], authRequired: false },
];

/**
 * Find route configuration
 */
export function findRoute(path: string, method: string): RouteConfig | null {
  for (const route of routes) {
    if (path.startsWith(route.path) && route.methods.includes(method)) {
      return route;
    }
  }
  return null;
}

/**
 * Route request to appropriate service
 */
export async function routeRequest(
  path: string,
  method: string,
  body?: unknown
): Promise<{ success: boolean; data?: unknown; error?: string }> {
  const route = findRoute(path, method);
  
  if (!route) {
    return { success: false, error: 'Route not found' };
  }
  
  const instance = getInstance(route.service);
  
  if (!instance) {
    return { success: false, error: `Service ${route.service} unavailable` };
  }
  
  const url = `${instance.url}${path}`;
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Service-Instance': instance.id,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

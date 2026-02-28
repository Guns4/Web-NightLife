/**
 * =====================================================
 * RABBITMQ PRODUCER WITH DLX & SAGA PATTERNS
 * AfterHoursID - Advanced Messaging
 * =====================================================
 */

import amqp, { Connection, Channel, ConsumeMessage } from 'amqplib';

// Types
export interface MessagePayload {
  id: string;
  type: string;
  correlationId: string;
  timestamp: string;
  payload: Record<string, unknown>;
  retryCount?: number;
  maxRetries?: number;
}

export interface DLQMessage extends MessagePayload {
  originalQueue: string;
  error?: string;
  failedAt: string;
}

export interface SagaTransaction {
  id: string;
  status: 'pending' | 'compensating' | 'completed' | 'failed';
  steps: SagaStep[];
  createdAt: string;
  updatedAt: string;
}

export interface SagaStep {
  name: string;
  status: 'pending' | 'completed' | 'failed' | 'compensated';
  compensateAction?: string;
}

// Exchange and Queue Configuration
const EXCHANGES = {
  primary: 'afterhours.primary',
  deadLetter: 'afterhours.dlx',
  events: 'afterhours.events',
};

const QUEUES = {
  // Critical queues with DLX
  payments: {
    name: 'payments.process',
    dlx: 'payments.failed',
  },
  bookings: {
    name: 'bookings.process',
    dlx: 'bookings.failed',
  },
  notifications: {
    name: 'notifications.send',
    dlx: 'notifications.failed',
  },
  // General queues
  general: 'general.queue',
  events: 'events.queue',
};

class RabbitMQProducer {
  private static instance: RabbitMQProducer;
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private isConnecting = false;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 5;
  private reconnectDelay = 5000;

  private constructor() {}

  public static getInstance(): RabbitMQProducer {
    if (!RabbitMQProducer.instance) {
      RabbitMQProducer.instance = new RabbitMQProducer();
    }
    return RabbitMQProducer.instance;
  }

  /**
   * Connect to RabbitMQ with auto-retry
   */
  public async connect(): Promise<void> {
    if (this.connection && this.channel) return;
    if (this.isConnecting) return;

    this.isConnecting = true;

    try {
      const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      this.connectionAttempts = 0;

      // Setup exchanges and queues
      await this.setupExchanges();
      await this.setupQueues();

      // Connection recovery
      this.connection.on('close', () => {
        console.error('[RabbitMQ] Connection closed, attempting reconnect...');
        this.handleReconnect();
      });

      this.connection.on('error', (err: Error) => {
        console.error('[RabbitMQ] Connection error:', err);
      });

      console.log('[RabbitMQ] Connected successfully');
    } catch (error) {
      console.error('[RabbitMQ] Connection failed:', error);
      this.handleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private async handleReconnect(): Promise<void> {
    if (this.connectionAttempts >= this.maxConnectionAttempts) {
      console.error('[RabbitMQ] Max reconnection attempts reached');
      return;
    }

    this.connectionAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.connectionAttempts - 1);

    console.log(`[RabbitMQ] Reconnecting in ${delay}ms (attempt ${this.connectionAttempts})`);

    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  /**
   * Setup exchanges
   */
  private async setupExchanges(): Promise<void> {
    if (!this.channel) return;

    // Primary exchange
    await this.channel.assertExchange(EXCHANGES.primary, 'direct', { durable: true });

    // Dead letter exchange
    await this.channel.assertExchange(EXCHANGES.deadLetter, 'fanout', { durable: true });

    // Events exchange (topic)
    await this.channel.assertExchange(EXCHANGES.events, 'topic', { durable: true });
  }

  /**
   * Setup queues with DLX
   */
  private async setupQueues(): Promise<void> {
    if (!this.channel) return;

    // Setup critical queues with DLX
    for (const [_key, config] of Object.entries(QUEUES)) {
      if (typeof config === 'object' && 'dlx' in config) {
        const queueConfig = config as { name: string; dlx: string };

        // Dead letter queue
        await this.channel.assertQueue(queueConfig.dlx, {
          durable: true,
          arguments: {
            'x-message-ttl': 7 * 24 * 60 * 60 * 1000, // 7 days retention
          },
        });

        await this.channel.bindQueue(queueConfig.dlx, EXCHANGES.deadLetter, '');

        // Main queue with DLX
        await this.channel.assertQueue(queueConfig.name, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': EXCHANGES.deadLetter,
            'x-dead-letter-routing-key': queueConfig.dlx,
          },
        });
      }
    }

    // General queue
    await this.channel.assertQueue(QUEUES.general as string, { durable: true });
    await this.channel.bindQueue(QUEUES.general as string, EXCHANGES.primary, 'general');

    // Events queue
    await this.channel.assertQueue(QUEUES.events as string, { durable: true });
    await this.channel.bindQueue(QUEUES.events as string, EXCHANGES.events, '#');
  }

  /**
   * Publish message with retry logic
   */
  public async publish(
    queue: string,
    message: MessagePayload,
    options?: { persistent?: boolean; priority?: number }
  ): Promise<boolean> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      console.error('[RabbitMQ] Cannot publish - no channel');
      return false;
    }

    try {
      const buffer = Buffer.from(JSON.stringify(message));

      this.channel.sendToQueue(queue, buffer, {
        persistent: options?.persistent ?? true,
        priority: options?.priority,
        headers: {
          'x-correlation-id': message.correlationId,
          'x-message-type': message.type,
          'x-retry-count': message.retryCount || 0,
        },
      });

      console.log(`[RabbitMQ] Published to ${queue}:`, message.id);
      return true;
    } catch (error) {
      console.error('[RabbitMQ] Publish failed:', error);
      return false;
    }
  }

  /**
   * Publish with auto-retry
   */
  public async publishWithRetry(
    queue: string,
    message: MessagePayload,
    maxRetries: number = 3
  ): Promise<boolean> {
    const messageWithRetry: MessagePayload = {
      ...message,
      maxRetries,
      retryCount: message.retryCount || 0,
    };

    const success = await this.publish(queue, messageWithRetry);

    if (!success && messageWithRetry.retryCount !== undefined && messageWithRetry.retryCount < maxRetries) {
      // Schedule retry
      const retryCount = messageWithRetry.retryCount;
      setTimeout(async () => {
        await this.publish(queue, {
          ...messageWithRetry,
          retryCount: retryCount + 1,
        });
      }, Math.pow(2, retryCount) * 1000);
    }

    return success;
  }

  /**
   * Subscribe to queue
   */
  public async subscribe(
    queue: string,
    handler: (message: MessagePayload) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error('[RabbitMQ] Cannot subscribe - no channel');
    }

    await this.channel.consume(queue, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const message: MessagePayload = JSON.parse(msg.content.toString());
        await handler(message);
        this.channel?.ack(msg);
      } catch (error) {
        console.error('[RabbitMQ] Message processing failed:', error);
        // Reject and send to DLQ
        this.channel?.nack(msg, false, false);
      }
    });
  }

  /**
   * Move message to dead letter queue
   */
  public async moveToDLQ(message: MessagePayload, error: string): Promise<void> {
    const dlqMessage: DLQMessage = {
      ...message,
      originalQueue: 'unknown',
      error,
      failedAt: new Date().toISOString(),
    };

    await this.publish('failed-tasks', dlqMessage);
  }

  /**
   * Close connection
   */
  public async close(): Promise<void> {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.connection = null;
    this.channel = null;
  }
}

// =====================================================
// SAGA PATTERN IMPLEMENTATION
// =====================================================

class SagaManager {
  private transactions = new Map<string, SagaTransaction>();
  private producer: RabbitMQProducer;

  constructor() {
    this.producer = RabbitMQProducer.getInstance();
  }

  /**
   * Start a new saga
   */
  async startSaga(sagaId: string, steps: SagaStep[]): Promise<void> {
    const transaction: SagaTransaction = {
      id: sagaId,
      status: 'pending',
      steps,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.transactions.set(sagaId, transaction);

    // Execute first step
    await this.executeStep(sagaId, 0);
  }

  /**
   * Execute a saga step
   */
  private async executeStep(sagaId: string, stepIndex: number): Promise<void> {
    const transaction = this.transactions.get(sagaId);
    if (!transaction || stepIndex >= transaction.steps.length) {
      await this.completeSaga(sagaId);
      return;
    }

    const step = transaction.steps[stepIndex];

    try {
      // Mark step as completed
      step.status = 'completed';
      transaction.updatedAt = new Date().toISOString();

      // Move to next step
      await this.executeStep(sagaId, stepIndex + 1);
    } catch (error) {
      await this.compensateSaga(sagaId, stepIndex, error as Error);
    }
  }

  /**
   * Compensate failed saga
   */
  private async compensateSaga(
    sagaId: string,
    failedStepIndex: number,
    error: Error
  ): Promise<void> {
    const transaction = this.transactions.get(sagaId);
    if (!transaction) return;

    transaction.status = 'compensating';
    transaction.updatedAt = new Date().toISOString();

    console.log(`[Saga] Compensating saga ${sagaId} from step ${failedStepIndex}`);

    // Execute compensating actions in reverse
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = transaction.steps[i];

      if (step.compensateAction) {
        try {
          // Publish compensation event
          await this.producer.publish('saga.compensate', {
            id: `compensate-${sagaId}-${i}`,
            type: 'saga.compensate',
            correlationId: sagaId,
            timestamp: new Date().toISOString(),
            payload: {
              sagaId,
              stepName: step.name,
              action: step.compensateAction,
              error: error.message,
            },
          });

          step.status = 'compensated';
        } catch (compError) {
          console.error(`[Saga] Compensation failed for step ${i}:`, compError);
        }
      }
    }

    transaction.status = 'failed';
    transaction.updatedAt = new Date().toISOString();

    // Publish saga failed event
    await this.producer.publish('saga.events', {
      id: `saga-failed-${sagaId}`,
      type: 'saga.failed',
      correlationId: sagaId,
      timestamp: new Date().toISOString(),
      payload: { sagaId, error: error.message },
    });
  }

  /**
   * Complete saga successfully
   */
  private async completeSaga(sagaId: string): Promise<void> {
    const transaction = this.transactions.get(sagaId);
    if (!transaction) return;

    transaction.status = 'completed';
    transaction.updatedAt = new Date().toISOString();

    // Publish saga completed event
    await this.producer.publish('saga.events', {
      id: `saga-completed-${sagaId}`,
      type: 'saga.completed',
      correlationId: sagaId,
      timestamp: new Date().toISOString(),
      payload: { sagaId },
    });
  }

  /**
   * Get saga status
   */
  getSagaStatus(sagaId: string): SagaTransaction | undefined {
    return this.transactions.get(sagaId);
  }
}

// Export singleton instances
export const rabbitMQ = RabbitMQProducer.getInstance();
export const sagaManager = new SagaManager();

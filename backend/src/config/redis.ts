/**
 * Redis Configuration for WhatsApp Document Sharing
 * Handles Redis connection and queue management
 * Requirements: 5.3
 */

import Redis from 'ioredis';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

export class RedisManager {
  private static instance: RedisManager;
  private redis: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  private constructor(config: RedisConfig) {
    const redisOptions = {
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: config.lazyConnect || true,
      ...config
    };

    // Main Redis connection
    this.redis = config.url 
      ? new Redis(config.url, redisOptions)
      : new Redis({
          host: config.host || 'localhost',
          port: config.port || 6379,
          password: config.password,
          db: config.db || 0,
          ...redisOptions
        });

    // Separate connections for pub/sub
    this.subscriber = this.redis.duplicate();
    this.publisher = this.redis.duplicate();

    this.setupEventHandlers();
  }

  public static getInstance(config?: RedisConfig): RedisManager {
    if (!RedisManager.instance) {
      if (!config) {
        // Default configuration from environment
        config = {
          url: process.env.REDIS_URL,
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0')
        };
      }
      RedisManager.instance = new RedisManager(config);
    }
    return RedisManager.instance;
  }

  private setupEventHandlers(): void {
    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });

    this.redis.on('reconnecting', () => {
      console.log('🔄 Redis reconnecting...');
    });

    this.redis.on('ready', () => {
      console.log('🚀 Redis ready for operations');
    });
  }

  /**
   * Get the main Redis client
   */
  public getClient(): Redis {
    return this.redis;
  }

  /**
   * Get the subscriber client for pub/sub
   */
  public getSubscriber(): Redis {
    return this.subscriber;
  }

  /**
   * Get the publisher client for pub/sub
   */
  public getPublisher(): Redis {
    return this.publisher;
  }

  /**
   * Test Redis connection
   */
  public async testConnection(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis connection test failed:', error);
      return false;
    }
  }

  /**
   * Add job to queue
   */
  public async enqueue(queueName: string, jobData: any, options?: {
    delay?: number;
    priority?: number;
    attempts?: number;
  }): Promise<string> {
    const jobId = `job:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      data: jobData,
      attempts: 0,
      maxAttempts: options?.attempts || 3,
      priority: options?.priority || 0,
      createdAt: new Date().toISOString(),
      scheduledAt: options?.delay 
        ? new Date(Date.now() + options.delay).toISOString()
        : new Date().toISOString()
    };

    // Add to queue with priority score
    const score = options?.delay 
      ? Date.now() + options.delay
      : Date.now() - (options?.priority || 0);

    await this.redis.zadd(queueName, score, JSON.stringify(job));
    
    console.log(`📤 Job ${jobId} added to queue ${queueName}`);
    return jobId;
  }

  /**
   * Get next job from queue
   */
  public async dequeue(queueName: string): Promise<any | null> {
    const now = Date.now();
    const jobs = await this.redis.zrangebyscore(queueName, 0, now, 'LIMIT', 0, 1);
    
    if (jobs.length === 0) {
      return null;
    }

    const jobData = jobs[0];
    await this.redis.zrem(queueName, jobData);
    
    try {
      return JSON.parse(jobData);
    } catch (error) {
      console.error('Failed to parse job data:', error);
      return null;
    }
  }

  /**
   * Get queue length
   */
  public async getQueueLength(queueName: string): Promise<number> {
    return await this.redis.zcard(queueName);
  }

  /**
   * Clear queue
   */
  public async clearQueue(queueName: string): Promise<void> {
    await this.redis.del(queueName);
  }

  /**
   * Set key-value with optional expiration
   */
  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds) {
      await this.redis.setex(key, ttlSeconds, value);
    } else {
      await this.redis.set(key, value);
    }
  }

  /**
   * Get value by key
   */
  public async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  /**
   * Delete key
   */
  public async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  /**
   * Close all Redis connections
   */
  public async disconnect(): Promise<void> {
    await Promise.all([
      this.redis.disconnect(),
      this.subscriber.disconnect(),
      this.publisher.disconnect()
    ]);
    console.log('🔌 Redis connections closed');
  }
}

// Export singleton instance getter
export const getRedisManager = (config?: RedisConfig) => RedisManager.getInstance(config);

// Export default instance
export default RedisManager;
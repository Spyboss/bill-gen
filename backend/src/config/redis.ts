import IORedis from 'ioredis';
import logger from '../utils/logger.js';

// Initialize Redis client
let redisClient: any = null;
let useRedisMock = false;

// Simple in-memory mock for Redis
class RedisMock {
  private store: Map<string, any> = new Map();
  
  async get(key: string) {
    return this.store.get(key);
  }
  
  async set(key: string, value: any) {
    this.store.set(key, value);
    return 'OK';
  }
  
  async setex(key: string, seconds: number, value: any) {
    this.store.set(key, value);
    setTimeout(() => this.store.delete(key), seconds * 1000);
    return 'OK';
  }
  
  async del(key: string) {
    this.store.delete(key);
    return 1;
  }
  
  on(event: string, callback: Function) {
    if (event === 'connect') {
      setTimeout(callback, 0);
    }
    return this;
  }
}

/**
 * Get a Redis client instance
 * @returns Redis client
 */
export const getRedisClient = (): any => {
  if (redisClient) return redisClient;
  
  try {
    // Check if we're in development mode and should use a mock
    if (process.env.NODE_ENV !== 'production') {
      logger.info('Using Redis mock for development environment');
      redisClient = new RedisMock();
      useRedisMock = true;
      return redisClient;
    }
    
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = new IORedis(redisUrl, {
      retryStrategy: (times) => {
        // Exponential backoff
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });
    
    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
    
    redisClient.on('error', (error) => {
      logger.error(`Redis connection error: ${error.message}`);
      
      // Fall back to mock in development
      if (process.env.NODE_ENV !== 'production' && !useRedisMock) {
        logger.warn('Redis connection failed, using mock implementation');
        redisClient = new RedisMock();
        useRedisMock = true;
      }
    });
    
    return redisClient;
  } catch (error) {
    logger.error(`Failed to initialize Redis: ${(error as Error).message}`);
    
    // Fall back to mock in non-production
    if (process.env.NODE_ENV !== 'production') {
      logger.warn('Using Redis mock due to initialization error');
      redisClient = new RedisMock();
      return redisClient;
    }
    
    throw error;
  }
};

/**
 * Close Redis connection
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient && !useRedisMock) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}; 
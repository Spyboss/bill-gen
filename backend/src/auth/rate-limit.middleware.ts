import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterRes, RateLimiterMemory } from 'rate-limiter-flexible';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Create a Redis-backed rate limiter
 */
const createRedisRateLimiter = (opts: {
  keyPrefix: string;
  points: number;
  duration: number;
  blockDuration?: number;
}) => {
  const redis = getRedisClient();
  
  // Fallback memory limiter in case Redis is down
  const insuranceLimiter = new RateLimiterMemory({
    points: opts.points,
    duration: opts.duration,
    blockDuration: opts.blockDuration
  });
  
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: opts.keyPrefix,
    points: opts.points,
    duration: opts.duration,
    blockDuration: opts.blockDuration,
    inMemoryBlockOnConsumed: opts.points,
    inMemoryBlockDuration: opts.blockDuration || 0,
    insuranceLimiter
  });
};

// General API rate limiter: 100 requests per minute in production, 300 in development
const apiLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:api',
  points: process.env.NODE_ENV === 'production' ? 100 : 300, // More lenient in dev
  duration: 60, // Per 60 seconds
});

// Login specific rate limiter: 5 attempts per minute in production, 15 in development
const loginLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:login',
  points: process.env.NODE_ENV === 'production' ? 5 : 15, // More lenient in dev
  duration: 60, // Per minute
  blockDuration: process.env.NODE_ENV === 'production' ? 300 : 60, // Less block time in dev
});

// Registration specific rate limiter: 3 per hour in production, 10 in development
const registrationLimiter = createRedisRateLimiter({
  keyPrefix: 'rl:register',
  points: process.env.NODE_ENV === 'production' ? 3 : 10, // More lenient in dev
  duration: process.env.NODE_ENV === 'production' ? 60 * 60 : 60 * 5, // Only 5 minutes in dev
  blockDuration: process.env.NODE_ENV === 'production' ? 60 * 60 : 60 * 2, // Only 2 minutes in dev
});

/**
 * Apply general API rate limiting
 */
export const apiRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip rate limiting for local development IPs
  const clientIp = req.ip || 'unknown';
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost') {
    return next();
  }
  
  try {
    await apiLimiter.consume(clientIp);
    next();
  } catch (error) {
    // Check if error is from rate limiter
    const limiterRes = error as RateLimiterRes;
    const retryAfter = Math.ceil(limiterRes.msBeforeNext / 1000) || 60;

    // Set retry-after header
    res.set('Retry-After', String(retryAfter));
    
    logger.warn(`Rate limit exceeded for ${req.ip} on ${req.method} ${req.path}`);
    
    res.status(429).json({
      message: 'Too many requests - please try again later',
      retryAfter
    });
  }
};

/**
 * Apply specific login rate limiting
 */
export const loginRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip rate limiting for local development IPs
  const clientIp = req.ip || 'unknown';
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost') {
    return next();
  }
  
  try {
    // Use IP address + normalized email as identifier
    const email = (req.body.email || '').toLowerCase().trim();
    const key = `${clientIp}:${email}`;
    
    await loginLimiter.consume(key);
    next();
  } catch (error) {
    // Check if error is from rate limiter
    const limiterRes = error as RateLimiterRes;
    const retryAfter = Math.ceil(limiterRes.msBeforeNext / 1000) || 300;

    // Set retry-after header
    res.set('Retry-After', String(retryAfter));
    
    logger.warn(`Login rate limit exceeded for ${req.ip}`);
    
    res.status(429).json({
      message: 'Too many login attempts - please try again later',
      retryAfter
    });
  }
};

/**
 * Apply specific registration rate limiting
 */
export const registrationRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Skip rate limiting for local development IPs
  const clientIp = req.ip || 'unknown';
  if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === 'localhost') {
    return next();
  }
  
  try {
    await registrationLimiter.consume(clientIp);
    next();
  } catch (error) {
    // Check if error is from rate limiter
    const limiterRes = error as RateLimiterRes;
    const retryAfter = Math.ceil(limiterRes.msBeforeNext / 1000) || 3600;

    // Set retry-after header
    res.set('Retry-After', String(retryAfter));
    
    logger.warn(`Registration rate limit exceeded for ${req.ip}`);
    
    res.status(429).json({
      message: 'Too many registration attempts - please try again later',
      retryAfter
    });
  }
}; 
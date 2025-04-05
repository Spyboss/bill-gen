import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// General API rate limiter: 100 requests per minute
const apiLimiter = new RateLimiterMemory({
  points: 100, // Number of points
  duration: 60, // Per 60 seconds
});

// Login specific rate limiter: 5 attempts per minute per IP
const loginLimiter = new RateLimiterMemory({
  points: 5, // 5 login attempts
  duration: 60, // Per minute
  blockDuration: 300, // Block for 5 minutes after reaching limit
});

// Registration specific rate limiter: 3 attempts per hour per IP
const registrationLimiter = new RateLimiterMemory({
  points: 3, // 3 registration attempts
  duration: 60 * 60, // Per hour
  blockDuration: 60 * 60, // Block for 1 hour after reaching limit
});

/**
 * Apply general API rate limiting
 */
export const apiRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use IP address as identifier
    const clientIp = req.ip || 'unknown';
    await apiLimiter.consume(clientIp);
    next();
  } catch (error) {
    res.status(429).json({
      message: 'Too many requests - please try again later'
    });
  }
};

/**
 * Apply specific login rate limiting
 */
export const loginRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use IP address + normalized email as identifier
    const clientIp = req.ip || 'unknown';
    const email = (req.body.email || '').toLowerCase().trim();
    const key = `${clientIp}:${email}`;
    
    await loginLimiter.consume(key);
    next();
  } catch (error) {
    res.status(429).json({
      message: 'Too many login attempts - please try again later',
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 300
    });
  }
};

/**
 * Apply specific registration rate limiting
 */
export const registrationRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Use IP address as identifier
    const clientIp = req.ip || 'unknown';
    
    await registrationLimiter.consume(clientIp);
    next();
  } catch (error) {
    res.status(429).json({
      message: 'Too many registration attempts - please try again later',
      retryAfter: error.msBeforeNext ? Math.ceil(error.msBeforeNext / 1000) : 3600
    });
  }
}; 
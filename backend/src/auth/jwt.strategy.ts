import { SignJWT, jwtVerify } from 'jose';
import * as crypto from 'crypto';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';
import securityMonitor from '../utils/security-monitor.js';

console.log('typeof crypto at top of jwt.strategy:', typeof crypto);

// 256-bit secret (32 chars) from env
const getSecret = () => {
  let secret = process.env.JWT_SECRET || '';
  
  // In development mode, if the secret is less than 32 characters,
  // pad it to 32 characters to meet the requirement
  if (process.env.NODE_ENV === 'development' && secret.length < 32) {
    // Pad the secret to 32 characters
    secret = secret.padEnd(32, 'x');
    logger.warn('JWT_SECRET was padded to 32 characters for development mode');
  } else if (secret.length < 32) {
    // In production, throw error if not secure
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  return new TextEncoder().encode(secret);
};

// Environment-specific token settings
const ACCESS_TOKEN_EXPIRY = process.env.NODE_ENV === 'production' ? '15m' : '60m';
const REFRESH_TOKEN_EXPIRY_SECONDS = process.env.NODE_ENV === 'production' ? 7 * 24 * 60 * 60 : 30 * 24 * 60 * 60; // 7 days in production, 30 days in development

/**
 * Create a short-lived JWT access token
 * @param userId User ID to include in the token
 * @returns Signed JWT token
 */
export const createToken = async (userId: string): Promise<string> => {
  console.log('typeof crypto in createToken:', typeof crypto);
  const tokenId = crypto.randomBytes(16).toString('hex'); // Unique token ID for revocation
  
  return await new SignJWT({ 
    sub: userId,
    jti: tokenId // JWT ID for revocation of specific tokens
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setNotBefore(Math.floor(Date.now() / 1000)) // Valid from now
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('bill-gen-api')
    .setAudience('bill-gen-client')
    .sign(getSecret());
};

/**
 * Create a refresh token for extended sessions
 * @param userId User ID to associate with the refresh token
 * @returns Secure random refresh token
 */
export const createRefreshToken = (userId: string): string => {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  
  // Store refresh token in Redis with expiration
  try {
    const redis = getRedisClient();
    redis.set(
      `refresh:${refreshToken}`, 
      userId,
      'EX',
      REFRESH_TOKEN_EXPIRY_SECONDS
    ).catch(error => {
      logger.error(`Failed to store refresh token: ${(error as Error).message}`);
    });
  } catch (error) {
    logger.error(`Redis error when storing refresh token: ${(error as Error).message}`);
  }
  
  return refreshToken;
};

/**
 * Verify a JWT token and check if it has been revoked
 * @param token JWT token to verify
 * @returns Payload if valid, throws error if invalid or revoked
 */
export const verifyToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: 'bill-gen-api',
      audience: 'bill-gen-client',
    });
    
    if (!payload.sub) {
      throw new Error('Invalid token: missing subject claim');
    }
    
    // Check if token has been revoked
    const isRevoked = await isTokenRevoked(payload.sub as string, payload.jti as string);
    if (isRevoked) {
      // Track revoked token usage attempt
      securityMonitor.trackApiAnomaly(
        payload.sub as string,
        'unknown', // IP not available in this context
        `JWT_VERIFICATION:REVOKED_TOKEN:${payload.jti}`
      ).catch(error => {
        logger.error(`Error tracking revoked token usage: ${(error as Error).message}`);
      });
      
      throw new Error('Token has been revoked');
    }
    
    return payload;
  } catch (error) {
    logger.error(`Token verification error: ${(error as Error).message}`);
    throw new Error('Invalid token');
  }
};

/**
 * Check if a user's token has been revoked
 * @param userId User ID to check
 * @param tokenId Optional specific token ID to check
 * @returns True if token is revoked, false otherwise
 */
export const isTokenRevoked = async (userId: string, tokenId?: string): Promise<boolean> => {
  try {
    const redis = getRedisClient();
    
    // Check for user-level revocation
    const userRevoked = await redis.get(`revoked:user:${userId}`);
    if (userRevoked) return true;
    
    // Check for specific token revocation if token ID provided
    if (tokenId) {
      const tokenRevoked = await redis.get(`revoked:token:${tokenId}`);
      if (tokenRevoked) return true;
    }
    
    return false;
  } catch (error) {
    logger.error(`Token revocation check error: ${(error as Error).message}`);
    return false; // Fail open - don't block authentication if Redis is down
  }
};

/**
 * Revoke all tokens for a user
 * @param userId User ID to revoke tokens for
 * @param expirySeconds How long to keep the revocation record (default: 24 hours)
 */
export const revokeTokens = async (userId: string, expirySeconds = 86400): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.set(`revoked:user:${userId}`, Date.now().toString(), 'EX', expirySeconds);
    logger.info(`Tokens revoked for user ${userId}`);
  } catch (error) {
    logger.error(`Token revocation error: ${(error as Error).message}`);
    throw new Error('Failed to revoke tokens');
  }
};

/**
 * Verify a refresh token and get the associated user ID
 * @param refreshToken Refresh token to verify
 * @returns User ID if valid, null if invalid
 */
export const verifyRefreshToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const redis = getRedisClient();
    const userId = await redis.get(`refresh:${refreshToken}`);
    
    // If no user ID found, token is invalid or expired
    if (!userId) {
      return null;
    }
    
    return userId;
  } catch (error) {
    logger.error(`Refresh token verification error: ${(error as Error).message}`);
    return null;
  }
};

/**
 * Revoke a specific refresh token
 * @param refreshToken Refresh token to revoke
 */
export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  try {
    const redis = getRedisClient();
    await redis.del(`refresh:${refreshToken}`);
  } catch (error) {
    logger.error(`Refresh token revocation error: ${(error as Error).message}`);
    throw new Error('Failed to revoke refresh token');
  }
}; 
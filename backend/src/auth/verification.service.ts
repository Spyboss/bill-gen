import * as crypto from 'node:crypto';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

const EMAIL_VERIFICATION_ENABLED = (process.env.EMAIL_VERIFICATION_ENABLED ?? 'false').toLowerCase() === 'true';
const VERIFICATION_TOKEN_TTL_MINUTES = Number(process.env.VERIFICATION_TOKEN_TTL_MINUTES ?? 30);

// Local salted SHA-256 helper using JWT_SECRET as salt, mirroring jwt.strategy.ts
const getJWTSecretString = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be provided and at least 32 chars');
  }
  return secret;
};

const saltedHash = (value: string): string => {
  const secret = getJWTSecretString();
  return crypto.createHash('sha256').update(secret + value).digest('hex');
};

export interface VerificationTokenPayload {
  token: string;
  email: string;
  userId: string;
}

const keyForToken = (email: string, token: string): string => {
  return `verify:${saltedHash(email + ':' + token)}`;
};

export const createVerificationToken = async (email: string, userId: string): Promise<VerificationTokenPayload | null> => {
  if (!EMAIL_VERIFICATION_ENABLED) {
    // Feature disabled: no-op to preserve existing behavior
    return null;
  }

  const token = crypto.randomBytes(32).toString('hex');
  const key = keyForToken(email, token);

  try {
    const redis = getRedisClient();
    const ttlSeconds = VERIFICATION_TOKEN_TTL_MINUTES * 60;
    await redis.setex(key, ttlSeconds, JSON.stringify({ email, userId }));
    return { token, email, userId };
  } catch (error) {
    logger.error(`Failed to store verification token: ${(error as Error).message}`);
    return null; // Fail open: do not block registration/login
  }
};

export const consumeVerificationToken = async (email: string, token: string): Promise<{ userId: string } | null> => {
  if (!EMAIL_VERIFICATION_ENABLED) {
    return null;
  }
  try {
    const redis = getRedisClient();
    const key = keyForToken(email, token);
    const raw = await redis.get(key);
    if (!raw) return null;
    await redis.del(key); // one-time use
    const parsed = JSON.parse(raw) as { email: string; userId: string };
    if (parsed.email !== email) return null;
    return { userId: parsed.userId };
  } catch (error) {
    logger.error(`Failed to consume verification token: ${(error as Error).message}`);
    return null;
  }
};

export const isVerificationEnabled = (): boolean => EMAIL_VERIFICATION_ENABLED;
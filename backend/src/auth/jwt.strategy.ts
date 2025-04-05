import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

// 256-bit secret (32 chars) from env
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Create a short-lived JWT access token
 * @param userId User ID to include in the token
 * @returns Signed JWT token
 */
export const createToken = async (userId: string): Promise<string> => {
  return await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m') // Short-lived tokens
    .sign(getSecret());
};

/**
 * Create a refresh token for extended sessions
 * @returns Secure random refresh token
 */
export const createRefreshToken = (): string => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Payload if valid, throws error if invalid
 */
export const verifyToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}; 
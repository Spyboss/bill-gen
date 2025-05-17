// Ensure crypto is available
if (typeof globalThis.crypto === 'undefined') {
  try {
    // Try to import the crypto polyfill
    import('../utils/crypto-polyfill.js').catch(error => {
      console.error('Failed to import crypto polyfill in auth.controller:', error);
    });
  } catch (error) {
    console.error('Error importing crypto polyfill in auth.controller:', error);
  }
}
import { Request, Response } from 'express';
import User, { IUser } from '../models/User.js';
import {
  createToken,
  verifyToken,
  createRefreshToken,
  revokeTokens,
  verifyRefreshToken,
  revokeRefreshToken
} from './jwt.strategy.js';
import { Types } from 'mongoose';
import logger from '../utils/logger.js';
import securityMonitor from '../utils/security-monitor.js';
import * as crypto from 'crypto';
console.log('typeof crypto at top of auth.controller:', typeof crypto);

// Define the extended Request type with user property
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// Cookie options for secure token storage
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, nic, address, phoneNumber } = req.body;
    const clientIp = req.ip || 'unknown';

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Track repeated registration attempts
      securityMonitor.trackApiAnomaly('unknown', clientIp, `REGISTER:DUPLICATE:${email}`);

      await securityDelay();
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Create new user with all provided fields
    const user = await User.create({
      email,
      password,
      name: name || undefined,
      nic: nic || undefined,
      address: address || undefined,
      phoneNumber: phoneNumber || undefined
    });

    // Generate tokens
    const accessToken = await createToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());

    // Save refresh token hash to user for additional verification
    user.refreshTokenHash = hashToken(refreshToken);
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    logger.info(`User registered: ${user._id} (${email})`);

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    logger.error(`Registration error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const clientIp = req.ip || 'unknown';

    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Track failed login attempt for security monitoring
      await securityMonitor.trackFailedLogin(email, clientIp);

      // Don't reveal if email exists
      await securityDelay();
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if account is locked
    if (user.accountLocked) {
      // Track failed login attempt for security monitoring
      await securityMonitor.trackFailedLogin(user._id.toString(), clientIp);

      logger.warn(`Login attempt on locked account: ${email} from IP ${clientIp}`);
      res.status(401).json({ message: 'Account is locked. Please reset your password or contact support.' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Track failed login attempt for security monitoring
      await securityMonitor.trackFailedLogin(user._id.toString(), clientIp);

      // Increment failed login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.accountLocked = true;
        logger.warn(`Account locked due to multiple failed attempts: ${email} from IP ${clientIp}`);
      }

      await user.save();

      await securityDelay();
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.accountLocked = false;
    user.lastLogin = new Date();

    // Generate tokens
    const accessToken = await createToken(user._id.toString());
    const refreshToken = createRefreshToken(user._id.toString());

    // Update user's refresh token hash and save
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);

    logger.info(`User login: ${user._id} (${email})`);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        nic: user.nic,
        address: user.address,
        phoneNumber: user.phoneNumber,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    const clientIp = req.ip || 'unknown';

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token is required' });
      return;
    }

    // Verify the refresh token from Redis
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      // Track invalid refresh token usage
      securityMonitor.trackApiAnomaly('unknown', clientIp, 'REFRESH:INVALID_TOKEN');

      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    // Find the user to validate token
    const user = await User.findById(userId).select('+refreshTokenHash');

    if (!user || !user.refreshTokenHash || user.refreshTokenHash !== hashToken(refreshToken)) {
      // Track suspicious refresh token activity
      securityMonitor.trackApiAnomaly(userId, clientIp, 'REFRESH:TOKEN_MISMATCH');

      // Revoke the token
      await revokeRefreshToken(refreshToken);

      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    // Generate new tokens
    const newAccessToken = await createToken(user._id.toString());
    const newRefreshToken = createRefreshToken(user._id.toString());

    // Revoke the old refresh token
    await revokeRefreshToken(refreshToken);

    // Update refresh token hash
    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    // Set new refresh token
    res.cookie('refreshToken', newRefreshToken, cookieOptions);

    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    logger.error(`Token refresh error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error refreshing token' });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    const clientIp = req.ip || 'unknown';

    if (refreshToken) {
      // Revoke the refresh token first
      await revokeRefreshToken(refreshToken);

      // Verify the token to get user ID
      const userId = await verifyRefreshToken(refreshToken);

      if (userId) {
        // Find and update user
        await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1 } });

        // Revoke all tokens for this user
        await revokeTokens(userId);
      }
    }

    // Also try to revoke tokens for the authenticated user
    if (req.user && req.user.id) {
      await revokeTokens(req.user.id);

      // Clear user's refresh token hash
      await User.findByIdAndUpdate(req.user.id, { $unset: { refreshTokenHash: 1 } });

      logger.info(`User logout: ${req.user.id}`);
    }

    // Clear the cookie regardless
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error(`Logout error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error during logout' });
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        nic: user.nic,
        address: user.address,
        phoneNumber: user.phoneNumber,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error(`Get current user error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error fetching user information' });
  }
};

/**
 * Add a small random delay to prevent timing attacks
 */
const securityDelay = async (): Promise<void> => {
  const delay = 200 + Math.floor(Math.random() * 200); // 200-400ms
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Create a hash of the refresh token to store in the database
 * This prevents an attacker who gains access to the database from being able to use the tokens
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256')
    .update(token + process.env.JWT_SECRET)
    .digest('hex');
};

/**
 * Creates an admin user (requires setup key for security)
 * This endpoint is typically only used during initial setup
 */
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, setupKey } = req.body;

    // Verify setup key (this should be a strong, unique key known only to administrators)
    // For development purposes, we're using a simple check
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY || 'admin-setup-secret-key';

    if (setupKey !== expectedSetupKey) {
      res.status(403).json({ message: 'Invalid setup key' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Create admin user
    const user = await User.create({
      email,
      password,
      name: name || 'Administrator',
      role: 'admin'
    });

    logger.info(`Admin user created: ${user._id} (${email})`);

    res.status(201).json({
      message: 'Admin user created successfully',
      userId: user._id
    });
  } catch (error) {
    logger.error(`Admin creation error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error creating admin user' });
  }
};
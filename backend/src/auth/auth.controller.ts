import * as crypto from 'node:crypto';

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

    const acceptLegacy = (process.env.LEGACY_REFRESH_ACCEPT ?? 'true').toLowerCase() !== 'false';
    const matchesNew = user && user.refreshTokenHash === hashToken(refreshToken);
    const matchesLegacy = user && acceptLegacy && user.refreshTokenHash === hashTokenLegacy(refreshToken);

    if (!user || !user.refreshTokenHash || (!matchesNew && !matchesLegacy)) {
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
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Get current user error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error fetching user information' });
  }
};

/**
 * Update user profile information
 * @param req Request with user ID and profile data
 * @param res Response
 */
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { name, nic, address, phoneNumber } = req.body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Update only provided fields
    if (name !== undefined) user.name = name;
    if (nic !== undefined) user.nic = nic;
    if (address !== undefined) user.address = address;
    if (phoneNumber !== undefined) user.phoneNumber = phoneNumber;

    await user.save();

    logger.info(`User profile updated: ${user._id} (${user.email})`);

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        nic: user.nic,
        address: user.address,
        phoneNumber: user.phoneNumber,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error(`Update profile error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

/**
 * Change user password
 * @param req Request with user ID and password data
 * @param res Response
 */
export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'Current password and new password are required' });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({ message: 'New password must be at least 8 characters long' });
      return;
    }

    const user = await User.findById(userId).select('+password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    // Revoke all existing tokens to force re-login
    await revokeTokens(userId);

    logger.info(`Password changed for user: ${user._id} (${user.email})`);

    res.status(200).json({
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    logger.error(`Change password error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error changing password' });
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
  const secret = process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(secret + token).digest('hex');
};

const hashTokenLegacy = (token: string): string => {
  const secret = process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(token + secret).digest('hex');
};

/**
 * Creates an admin user (requires setup key for security)
 * This endpoint is typically only used during initial setup
 */
export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, setupKey } = req.body;

    // Verify setup key (this should be a strong, unique key known only to administrators)
    const expectedSetupKey = process.env.ADMIN_SETUP_KEY;
    
    if (!expectedSetupKey) {
      res.status(500).json({ message: 'Admin setup is not properly configured. ADMIN_SETUP_KEY environment variable is required.' });
      return;
    }

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
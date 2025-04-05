import { Request, Response } from 'express';
import User, { IUser } from '../models/User.js';
import { createToken, verifyToken, createRefreshToken } from './jwt.strategy.js';
import { Types } from 'mongoose';

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
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = await User.create({ email, password });
    
    // Generate tokens
    const accessToken = await createToken(user._id.toString());
    const refreshToken = createRefreshToken();
    
    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user and include password for verification
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = await createToken(user._id.toString());
    const refreshToken = createRefreshToken();
    
    // Update user's refresh token and last login
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', refreshToken, cookieOptions);
    
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error during login' });
  }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token is required' });
      return;
    }

    // Find user with this refresh token
    const user = await User.findOne({ refreshToken }).select('+refreshToken');
    
    if (!user) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    // Generate new tokens
    const newAccessToken = await createToken(user._id.toString());
    const newRefreshToken = createRefreshToken();
    
    // Update refresh token
    user.refreshToken = newRefreshToken;
    await user.save();

    // Set new refresh token
    res.cookie('refreshToken', newRefreshToken, cookieOptions);
    
    res.status(200).json({
      accessToken: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Error refreshing token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
      // Find user with this refresh token and clear it
      await User.findOneAndUpdate(
        { refreshToken },
        { $unset: { refreshToken: 1 } }
      );
    }

    // Clear the cookie regardless
    res.clearCookie('refreshToken');
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
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
        role: user.role
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Error fetching user information' });
  }
}; 
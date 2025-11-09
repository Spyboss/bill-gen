import { Request, Response } from 'express';
import { Types } from 'mongoose';
import UserPreferences, { IUserPreferences } from '../models/UserPreferences.js';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

// Define the extended Request type with user property
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Get user preferences
 * @param req Request with user ID
 * @param res Response
 */
export const getUserPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Try to get from Redis cache first
    const redis = getRedisClient();
    const cacheKey = `user_preferences:${userId}`;
    
    try {
      const cachedPreferences = await redis.get(cacheKey);
      if (cachedPreferences) {
        res.status(200).json({
          preferences: JSON.parse(cachedPreferences)
        });
        return;
      }
    } catch (cacheError) {
      logger.warn(`Redis cache error: ${(cacheError as Error).message}`);
    }

    // Get from database
    let preferences = await UserPreferences.findOne({ userId });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await UserPreferences.create({ userId });
    }

    // Cache the preferences
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(preferences)); // Cache for 1 hour
    } catch (cacheError) {
      logger.warn(`Redis cache set error: ${(cacheError as Error).message}`);
    }

    res.status(200).json({
      preferences
    });
  } catch (error) {
    logger.error(`Get user preferences error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error fetching user preferences' });
  }
};

/**
 * Update user preferences
 * @param req Request with user ID and preferences data
 * @param res Response
 */
export const updateUserPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const updates = req.body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Validate the updates object
    const allowedFields = ['theme', 'language', 'timezone', 'notifications', 'dashboard', 'privacy'];
    const updateFields: Partial<IUserPreferences> = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        (updateFields as any)[field] = updates[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      res.status(400).json({ message: 'No valid fields to update' });
      return;
    }

    // Update or create preferences
    const preferences = await UserPreferences.findOneAndUpdate(
      { userId },
      { $set: updateFields },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    // Update cache
    const redis = getRedisClient();
    const cacheKey = `user_preferences:${userId}`;
    
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(preferences));
    } catch (cacheError) {
      logger.warn(`Redis cache update error: ${(cacheError as Error).message}`);
    }

    logger.info(`User preferences updated: ${userId}`);

    res.status(200).json({
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    logger.error(`Update user preferences error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error updating user preferences' });
  }
};

/**
 * Reset user preferences to defaults
 * @param req Request with user ID
 * @param res Response
 */
export const resetUserPreferences = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Delete existing preferences (will trigger default creation on next get)
    await UserPreferences.findOneAndDelete({ userId });

    // Clear cache
    const redis = getRedisClient();
    const cacheKey = `user_preferences:${userId}`;
    
    try {
      await redis.del(cacheKey);
    } catch (cacheError) {
      logger.warn(`Redis cache delete error: ${(cacheError as Error).message}`);
    }

    // Create new default preferences
    const preferences = await UserPreferences.create({ userId });

    // Cache the new preferences
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(preferences));
    } catch (cacheError) {
      logger.warn(`Redis cache set error: ${(cacheError as Error).message}`);
    }

    logger.info(`User preferences reset: ${userId}`);

    res.status(200).json({
      message: 'Preferences reset to defaults',
      preferences
    });
  } catch (error) {
    logger.error(`Reset user preferences error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error resetting user preferences' });
  }
};

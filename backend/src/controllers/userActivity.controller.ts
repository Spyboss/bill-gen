import { Request, Response } from 'express';
import { Types } from 'mongoose';
import UserActivity, { ActivityType, IUserActivity } from '../models/UserActivity.js';
import logger from '../utils/logger.js';

// Define the extended Request type with user property
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

/**
 * Get user activity history
 * @param req Request with user ID and query parameters
 * @param res Response
 */
export const getUserActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      startDate, 
      endDate 
    } = req.query;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Build query
    const query: any = { userId };

    if (type && Object.values(ActivityType).includes(type as ActivityType)) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate as string);
      }
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Get activities with pagination
    const [activities, total] = await Promise.all([
      UserActivity.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      UserActivity.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    logger.error(`Get user activity error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error fetching user activity' });
  }
};

/**
 * Log user activity
 * @param userId User ID
 * @param type Activity type
 * @param description Activity description
 * @param metadata Additional metadata
 * @param req Request object for IP and user agent
 */
export const logUserActivity = async (
  userId: string,
  type: ActivityType,
  description: string,
  metadata?: Partial<IUserActivity['metadata']>,
  req?: Request
): Promise<void> => {
  try {
    const activityData: Partial<IUserActivity> = {
      userId: new Types.ObjectId(userId),
      type,
      description,
      metadata: {
        ...metadata,
        ipAddress: req?.ip || metadata?.ipAddress,
        userAgent: req?.get('User-Agent') || metadata?.userAgent
      }
    };

    await UserActivity.create(activityData);
  } catch (error) {
    logger.error(`Log user activity error: ${(error as Error).message}`);
    // Don't throw error to avoid breaking the main operation
  }
};

/**
 * Get activity statistics
 * @param req Request with user ID
 * @param res Response
 */
export const getActivityStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { days = 30 } = req.query;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const daysNum = Math.min(365, Math.max(1, parseInt(days as string)));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    // Get activity counts by type
    const activityStats = await UserActivity.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get daily activity counts
    const dailyStats = await UserActivity.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Get total activity count
    const totalActivities = await UserActivity.countDocuments({
      userId,
      timestamp: { $gte: startDate }
    });

    res.status(200).json({
      stats: {
        totalActivities,
        period: `${daysNum} days`,
        byType: activityStats,
        daily: dailyStats
      }
    });
  } catch (error) {
    logger.error(`Get activity stats error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error fetching activity statistics' });
  }
};

/**
 * Clear old user activities (for privacy compliance)
 * @param req Request with user ID
 * @param res Response
 */
export const clearOldActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { days = 365 } = req.body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const daysNum = Math.max(30, parseInt(days)); // Minimum 30 days retention
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysNum);

    const result = await UserActivity.deleteMany({
      userId,
      timestamp: { $lt: cutoffDate }
    });

    logger.info(`Cleared ${result.deletedCount} old activities for user: ${userId}`);

    res.status(200).json({
      message: `Cleared ${result.deletedCount} activities older than ${daysNum} days`
    });
  } catch (error) {
    logger.error(`Clear old activities error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error clearing old activities' });
  }
};

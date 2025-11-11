import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { enforceVerification } from '../auth/verification-enforce.middleware.js';
import * as userPreferencesController from '../controllers/userPreferences.controller.js';
import * as userActivityController from '../controllers/userActivity.controller.js';
import {
  validatePreferencesUpdate,
  validateActivityQuery
} from '../middleware/userValidation.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
// Enforce verification on private user routes (flag-gated, admin/legacy bypass)
router.use(enforceVerification);

/**
 * User Preferences Routes
 */

/**
 * @route  GET /api/user/preferences
 * @desc   Get user preferences
 * @access Private
 */
router.get('/preferences', userPreferencesController.getUserPreferences);

/**
 * @route  PUT /api/user/preferences
 * @desc   Update user preferences
 * @access Private
 */
router.put('/preferences', validatePreferencesUpdate, userPreferencesController.updateUserPreferences);

/**
 * @route  DELETE /api/user/preferences
 * @desc   Reset user preferences to defaults
 * @access Private
 */
router.delete('/preferences', userPreferencesController.resetUserPreferences);

/**
 * User Activity Routes
 */

/**
 * @route  GET /api/user/activity
 * @desc   Get user activity history
 * @access Private
 * @query  page, limit, type, startDate, endDate
 */
router.get('/activity', userActivityController.getUserActivity);

/**
 * @route  GET /api/user/activity/stats
 * @desc   Get user activity statistics
 * @access Private
 * @query  days
 */
router.get('/activity/stats', userActivityController.getActivityStats);

/**
 * @route  DELETE /api/user/activity
 * @desc   Clear old user activities
 * @access Private
 * @body   days (minimum retention period)
 */
router.delete('/activity', validateActivityQuery, userActivityController.clearOldActivities);

export default router;

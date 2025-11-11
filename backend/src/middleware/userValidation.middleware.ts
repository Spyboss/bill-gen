import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Validation middleware for profile updates
 */
export const validateProfileUpdate = [
  body('name')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name must be between 1 and 100 characters')
    .trim(),
  
  body('nic')
    .optional()
    .isLength({ min: 9, max: 12 })
    .withMessage('NIC must be between 9 and 12 characters')
    .matches(/^[0-9]{9}[vVxX]?$|^[0-9]{12}$/)
    .withMessage('Invalid NIC format')
    .trim(),
  
  body('address')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Address must be between 1 and 500 characters')
    .trim(),
  
  body('phoneNumber')
    .optional()
    .matches(/^[+]?[0-9\s\-\(\)]{7,15}$/)
    .withMessage('Invalid phone number format')
    .trim(),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for password changes
 */
export const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for user preferences updates
 */
export const validatePreferencesUpdate = [
  body('theme')
    .optional()
    .isIn(['light', 'dark', 'system'])
    .withMessage('Theme must be light, dark, or system'),
  
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be between 2 and 5 characters')
    .matches(/^[a-z]{2}(-[A-Z]{2})?$/)
    .withMessage('Invalid language code format'),
  
  body('timezone')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Timezone must be between 1 and 50 characters'),
  
  body('notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications must be a boolean'),
  
  body('notifications.browser')
    .optional()
    .isBoolean()
    .withMessage('Browser notifications must be a boolean'),
  
  body('notifications.billReminders')
    .optional()
    .isBoolean()
    .withMessage('Bill reminders must be a boolean'),
  
  body('notifications.quotationUpdates')
    .optional()
    .isBoolean()
    .withMessage('Quotation updates must be a boolean'),
  
  body('notifications.systemUpdates')
    .optional()
    .isBoolean()
    .withMessage('System updates must be a boolean'),
  
  body('dashboard.defaultView')
    .optional()
    .isIn(['bills', 'quotations', 'inventory', 'dashboard'])
    .withMessage('Default view must be bills, quotations, inventory, or dashboard'),
  
  body('dashboard.itemsPerPage')
    .optional()
    .isInt({ min: 5, max: 100 })
    .withMessage('Items per page must be between 5 and 100'),
  
  body('dashboard.showWelcomeMessage')
    .optional()
    .isBoolean()
    .withMessage('Show welcome message must be a boolean'),
  
  body('privacy.profileVisibility')
    .optional()
    .isIn(['private', 'team', 'public'])
    .withMessage('Profile visibility must be private, team, or public'),
  
  body('privacy.activityTracking')
    .optional()
    .isBoolean()
    .withMessage('Activity tracking must be a boolean'),
  
  body('privacy.dataRetention')
    .optional()
    .isInt({ min: 30, max: 2555 })
    .withMessage('Data retention must be between 30 and 2555 days'),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    next();
  }
];

/**
 * Validation middleware for activity queries
 */
export const validateActivityQuery = [
  body('days')
    .optional()
    .isInt({ min: 30, max: 2555 })
    .withMessage('Days must be between 30 and 2555'),

  // Validation result handler
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        message: 'Validation failed',
        errors: errors.array()
      });
      return;
    }
    next();
  }
];

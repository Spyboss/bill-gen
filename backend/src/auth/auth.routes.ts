import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authenticate } from './auth.middleware.js';
import { validateRegistration, validateLogin } from './auth.validation.js';
import { loginRateLimit, registrationRateLimit } from './rate-limit.middleware.js';

const router = Router();

/**
 * @route  POST /api/auth/register
 * @desc   Register a new user
 * @access Public
 */
router.post('/register', registrationRateLimit, validateRegistration, authController.register);

/**
 * @route  POST /api/auth/login
 * @desc   Login user and return JWT and refresh token
 * @access Public
 */
router.post('/login', loginRateLimit, validateLogin, authController.login);

/**
 * @route  POST /api/auth/refresh
 * @desc   Refresh access token using refresh token
 * @access Public (with refresh token cookie)
 */
router.post('/refresh', authController.refreshAccessToken);

/**
 * @route  POST /api/auth/logout
 * @desc   Logout user and invalidate refresh token
 * @access Public (with refresh token cookie)
 */
router.post('/logout', authController.logout);

/**
 * @route  GET /api/auth/me
 * @desc   Get current user information
 * @access Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

export default router; 
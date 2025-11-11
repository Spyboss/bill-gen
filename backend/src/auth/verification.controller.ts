import { Request, Response } from 'express';
import { AuthRequest } from './auth.middleware.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';
import { createVerificationToken, consumeVerificationToken, isVerificationEnabled } from './verification.service.js';
import { sendMail } from '../services/mailer.service.js';

// Helper to build verification link for frontend
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL ?? 'https://tmr-tradinglanka.pages.dev';
const buildVerifyLink = (email: string, token: string): string => {
  const base = PUBLIC_BASE_URL.replace(/\/$/, '');
  return `${base}/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
};

export const requestVerification = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body || {};
  if (!email || typeof email !== 'string') {
    res.status(400).json({ message: 'Email is required' });
    return;
  }

  // Always respond generically to avoid email enumeration
  try {
    const user = await User.findOne({ email }).select('_id email role');

    if (!isVerificationEnabled()) {
      res.status(200).json({ message: 'Verification is currently disabled' });
      return;
    }

    if (!user) {
      // Generic ok: prevents user discovery
      res.status(200).json({ message: 'If the email exists, a verification was sent' });
      return;
    }

    const payload = await createVerificationToken(user.email, user._id.toString());
    if (!payload) {
      // Fail open: do not block user flows
      res.status(200).json({ message: 'If the email exists, a verification was sent' });
      return;
    }

    const link = buildVerifyLink(user.email, payload.token);
    const { success, error } = await sendMail({
      to: user.email,
      subject: 'Verify your email address',
      html: `<p>Hello,</p><p>Please verify your email address by clicking the link below:</p><p><a href="${link}">Verify Email</a></p><p>This link expires in ${process.env.VERIFICATION_TOKEN_TTL_MINUTES ?? 30} minutes.</p>`,
      text: `Verify your email: ${link}`
    });

    if (!success) {
      logger.error(`Verification email send failed for ${user.email}: ${error}`);
    }

    res.status(200).json({ message: 'If the email exists, a verification was sent' });
  } catch (error) {
    logger.error(`requestVerification error: ${(error as Error).message}`);
    res.status(200).json({ message: 'If the email exists, a verification was sent' });
  }
};

export const confirmVerification = async (req: Request, res: Response): Promise<void> => {
  const { email, token } = req.body || {};
  if (!email || !token || typeof email !== 'string' || typeof token !== 'string') {
    res.status(400).json({ message: 'Email and token are required' });
    return;
  }

  if (!isVerificationEnabled()) {
    res.status(200).json({ message: 'Verification is currently disabled' });
    return;
  }

  try {
    const consumed = await consumeVerificationToken(email, token);
    if (!consumed) {
      res.status(400).json({ message: 'Invalid or expired token' });
      return;
    }

    // Mark verified status using a non-invasive model separate from User
    const { default: EmailVerificationStatus } = await import('../models/EmailVerificationStatus.js');
    await EmailVerificationStatus.updateOne(
      { user: consumed.userId },
      { $set: { verified: true, verifiedAt: new Date() } },
      { upsert: true }
    );

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error(`confirmVerification error: ${(error as Error).message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getVerificationStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const enabled = isVerificationEnabled();
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const { default: EmailVerificationStatus } = await import('../models/EmailVerificationStatus.js');
    const doc = await EmailVerificationStatus.findOne({ user: userId }).lean();
    const verified = !!doc?.verified;
    res.status(200).json({ enabled, verified, verifiedAt: doc?.verifiedAt ?? null });
  } catch (error) {
    logger.error(`getVerificationStatus error: ${(error as Error).message}`);
    // Fail-open: do not block, default to unverified state but include enabled flag
    res.status(200).json({ enabled, verified: false, verifiedAt: null });
  }
};
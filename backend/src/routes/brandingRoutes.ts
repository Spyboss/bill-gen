import express, { Request, Response } from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../auth/auth.middleware.js';
import Branding from '../models/Branding.js';

const router = express.Router();

// Get branding config (authenticated users)
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    let branding = await Branding.findOne();

    if (!branding) {
      branding = await Branding.create({});
    }

    res.status(200).json(branding);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update branding config (admin only)
router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const update = {
      dealerName: req.body.dealerName,
      logoUrl: req.body.logoUrl,
      primaryColor: req.body.primaryColor,
      addressLine1: req.body.addressLine1,
      addressLine2: req.body.addressLine2,
      brandPartner: req.body.brandPartner,
      footerNote: req.body.footerNote,
    };

    let branding = await Branding.findOne();
    if (!branding) {
      branding = await Branding.create(update);
    } else {
      await Branding.updateOne({ _id: branding._id }, update, { upsert: true });
      branding = await Branding.findById(branding._id);
    }

    res.status(200).json(branding);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
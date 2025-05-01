import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Bill from '../models/Bill.js';
import { connectToDatabase } from '../config/database.js';
import { generatePDF } from '../services/pdfService.js';
import { authenticate, requireAdmin, requireOwnership, AuthRequest } from '../auth/auth.middleware.js';
import { createBill, updateBillStatus } from '../controllers/billController.js';

const router = express.Router();

// Get all bills with pagination and filtering - Protected route
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter: any = {};

    // Filter by owner if not admin
    const user = await req.app.locals.models?.User.findById(req.user?.id);
    const isAdmin = user?.role === 'admin';

    if (!isAdmin && req.user?.id) {
      // Regular users can only see their own bills
      filter.owner = req.user.id;
    }

    if (status) filter.status = status;

    // Add search query if provided
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { customerNIC: { $regex: search, $options: 'i' } },
        { billNumber: { $regex: search, $options: 'i' } },
        { bikeModel: { $regex: search, $options: 'i' } }
      ];
    }

    // Execute query with pagination
    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Bill.countDocuments(filter);

    res.status(200).json({
      bills,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });
  } catch (error) {
    console.error('Error fetching bills:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get bill by ID - Protected route with ownership check
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Check ownership or admin status
    const user = await req.app.locals.models?.User.findById(req.user?.id);
    const isAdmin = user?.role === 'admin';
    const isOwner = bill.owner && bill.owner.toString() === req.user?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to view this bill' });
    }

    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create new bill - Protected route
router.post('/', authenticate, createBill);

// Update bill - Protected route with ownership check
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // First check ownership
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Check ownership or admin status
    const user = await req.app.locals.models?.User.findById(req.user?.id);
    const isAdmin = user?.role === 'admin';
    const isOwner = bill.owner && bill.owner.toString() === req.user?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to update this bill' });
    }

    // Don't allow changing the owner
    if (req.body.owner && !isAdmin) {
      delete req.body.owner;
    }

    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedBill);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete bill - Protected route with ownership check
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // First check ownership
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Check ownership or admin status
    const user = await req.app.locals.models?.User.findById(req.user?.id);
    const isAdmin = user?.role === 'admin';
    const isOwner = bill.owner && bill.owner.toString() === req.user?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to delete this bill' });
    }

    await Bill.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Generate PDF for a bill - Protected route with ownership check
router.get('/:id/pdf', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id);

    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Check ownership or admin status
    const user = await req.app.locals.models?.User.findById(req.user?.id);
    const isAdmin = user?.role === 'admin';
    const isOwner = bill.owner && bill.owner.toString() === req.user?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to view this bill' });
    }

    const pdfBuffer = await generatePDF(bill);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TMR_Bill_${bill.billNumber || bill.bill_number || bill._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update bill status - Protected route with ownership check
router.patch('/:id/status', authenticate, updateBillStatus);

export default router;
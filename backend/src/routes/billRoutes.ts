import express, { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import Bill from '../models/Bill.js';
import { connectToDatabase } from '../config/database.js';
import { generatePDF } from '../services/pdfService.js';

const router = express.Router();

// Get all bills with pagination and filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Build filter query
    const filter: any = {};
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

// Get bill by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.status(200).json(bill);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Create new bill
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received bill data:', req.body);
    
    // Create and save the bill
    const newBill = new Bill(req.body);
    const savedBill = await newBill.save();
    
    console.log('Bill saved successfully:', savedBill);
    res.status(201).json(savedBill);
  } catch (error) {
    console.error('Error creating bill:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// Update bill
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updatedBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.status(200).json(updatedBill);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// Delete bill
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    res.status(200).json({ message: 'Bill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Generate PDF for a bill
router.get('/:id/pdf', async (req: Request, res: Response) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    const pdfBuffer = await generatePDF(bill);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=TMR_Bill_${bill.billNumber || bill.bill_number || bill._id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Update bill status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const updatedBill = await Bill.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedBill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.status(200).json(updatedBill);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router; 
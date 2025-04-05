import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import User, { UserRole } from '../models/User.js';
import Bill from '../models/Bill.js';
import archiver from 'archiver';
import { AuthRequest } from '../auth/auth.middleware.js';
import { Response } from 'express';

const router = Router();

/**
 * @route POST /api/gdpr/export
 * @desc Export all user data (GDPR compliance)
 * @access Private
 */
router.post('/export', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get user data
    const user = await User.findById(userId).lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove sensitive fields
    delete user.password;
    delete user.refreshToken;
    
    // Get user's bills
    const bills = await Bill.find({ owner: userId }).lean();
    
    // Create a data object to export
    const exportData = {
      user,
      bills,
      exportDate: new Date(),
      exportRequestIP: req.ip
    };
    
    // Set up the ZIP file for download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=user-data-export-${Date.now()}.zip`);
    
    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Add JSON data file to the archive
    archive.append(JSON.stringify(exportData, null, 2), { name: 'user-data.json' });
    
    // Add a readme file explaining the data
    const readme = `# User Data Export
Date of Export: ${new Date().toISOString()}

This export contains:
- Your account information
- Your bills and invoices

This data is provided to comply with data portability requirements.
For questions about your data, please contact support@billgen.com.
`;
    
    archive.append(readme, { name: 'README.md' });
    
    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ message: 'Error exporting user data' });
  }
});

/**
 * @route POST /api/gdpr/delete
 * @desc Delete all user data (GDPR compliance)
 * @access Private
 */
router.post('/delete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Get user data for verification purposes
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Require password confirmation for account deletion
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'Password confirmation is required' });
    }
    
    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Delete all bills created by the user
    await Bill.deleteMany({ owner: userId });
    
    // Mark user as deleted instead of actually deleting
    user.email = `deleted-${userId}@deleted.billgen.com`;
    user.role = UserRole.DELETED; // Set to deleted role
    user.refreshToken = undefined;
    
    // Store account deletion time
    user.deletedAt = new Date();
    await user.save();
    
    // Clear authentication cookies
    res.clearCookie('refreshToken');
    
    // Send response
    res.status(200).json({ message: 'Account and all associated data have been deleted' });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ message: 'Error deleting user data' });
  }
});

export default router; 
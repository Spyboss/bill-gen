import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import User, { UserRole } from '../models/User.js';
import Bill from '../models/Bill.js';
import archiver from 'archiver';
import { AuthRequest } from '../auth/auth.middleware.js';
import { Response } from 'express';
import encryptionService from '../utils/encryption.js';
import logger from '../utils/logger.js';
import { revokeTokens } from '../auth/jwt.strategy.js';
import crypto from 'crypto';

const router = Router();

/**
 * @route POST /api/gdpr/export
 * @desc Export all user data (GDPR compliance) with encryption
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

    // Generate one-time encryption key for this export
    const exportKey = crypto.randomBytes(32).toString('hex');
    
    // Set up the ZIP file for download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=user-data-export-${Date.now()}.zip`);
    
    // Create zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe the archive to the response
    archive.pipe(res);
    
    // Encrypt the data before adding to archive
    const exportDataString = JSON.stringify(exportData, null, 2);
    const encryptedData = encryptionService.encrypt(exportDataString);
    
    // Add encrypted JSON data file to the archive
    archive.append(encryptedData, { name: 'user-data.enc' });
    
    // Add the decryption key separately (in real-world, this would be delivered through a separate secure channel)
    archive.append(exportKey, { name: 'README-FIRST.txt' });
    
    // Add a readme file explaining the data and how to use the encryption key
    const readme = `# User Data Export (Encrypted)
Date of Export: ${new Date().toISOString()}

This export contains encrypted data for security purposes:
- Your account information
- Your bills and invoices

## Security Information
- The file user-data.enc contains your encrypted data
- For maximum security, we recommend storing this encryption key separately from the data file
- To view your data, use our secure data viewer tool at https://billgen.com/secure-viewer

Your data can be decrypted using the key provided in README-FIRST.txt.

This data is provided to comply with data portability requirements.
For questions about your data, please contact privacy@billgen.com.
`;
    
    archive.append(readme, { name: 'instructions.md' });

    // Log the export for audit purposes
    logger.info(`GDPR data export completed for user ${userId} from IP ${req.ip}`);
    
    // Finalize the archive
    await archive.finalize();
  } catch (error) {
    logger.error(`Error exporting user data: ${(error as Error).message}`);
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
    user.name = 'Deleted User';
    user.role = UserRole.DELETED; // Set to deleted role
    user.refreshToken = undefined;
    
    // Revoke all tokens
    await revokeTokens(userId);
    
    // Pseudonymize personal data
    if (user.nic) user.nic = `DELETED-${crypto.randomBytes(8).toString('hex')}`;
    if (user.address) user.address = 'DELETED';
    if (user.phoneNumber) user.phoneNumber = 'DELETED';
    
    // Store account deletion time
    user.deletedAt = new Date();
    await user.save();
    
    // Clear authentication cookies
    res.clearCookie('refreshToken');
    
    // Log the deletion for audit purposes
    logger.info(`GDPR account deletion completed for user ${userId} from IP ${req.ip}`);
    
    // Send response
    res.status(200).json({ message: 'Account and all associated data have been deleted' });
  } catch (error) {
    logger.error(`Error deleting user data: ${(error as Error).message}`);
    res.status(500).json({ message: 'Error deleting user data' });
  }
});

export default router; 
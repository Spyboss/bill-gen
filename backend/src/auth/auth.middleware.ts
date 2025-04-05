import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.strategy.js';
import User, { UserRole } from '../models/User.js';

// Extend the Request interface to include a user property
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: UserRole;
  };
}

/**
 * Authentication middleware that verifies JWT tokens
 * Extracts the token from the Authorization header and verifies it
 * Sets the user ID in the request object for use in protected routes
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const payload = await verifyToken(token);
    
    if (!payload || !payload.sub) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    
    // Set the user ID in the request object
    req.user = {
      id: payload.sub
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Authorization middleware that checks if the user has admin role
 * Must be used after the authenticate middleware
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    
    // Get the user from the database to check the role
    const user = await User.findById(req.user.id);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user.role !== UserRole.ADMIN) {
      res.status(403).json({ message: 'Admin privileges required' });
      return;
    }
    
    // Set the role in the request object
    req.user.role = user.role;
    
    next();
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).json({ message: 'Authorization failed' });
  }
};

/**
 * Bill ownership middleware that checks if the user owns the bill
 * or has admin privileges
 * Must be used after the authenticate middleware
 */
export const requireOwnership = (billUserIdField: string) => {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }
      
      // Get the bill ID from the request params
      const billId = req.params.id;
      if (!billId) {
        res.status(400).json({ message: 'Bill ID is required' });
        return;
      }
      
      // Get the bill from the database
      const Bill = req.app.locals.models?.Bill;
      
      if (!Bill) {
        res.status(500).json({ message: 'Bill model not available' });
        return;
      }
      
      const bill = await Bill.findById(billId);
      
      if (!bill) {
        res.status(404).json({ message: 'Bill not found' });
        return;
      }
      
      // Get the user to check their role
      const user = await User.findById(req.user.id);
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Check if the user is an admin or if they own the bill
      if (user.role === UserRole.ADMIN || 
          bill[billUserIdField] === req.user.id) {
        req.user.role = user.role;
        next();
      } else {
        res.status(403).json({ message: 'You do not own this bill' });
      }
    } catch (error) {
      console.error('Ownership verification error:', error);
      res.status(500).json({ message: 'Ownership verification failed' });
    }
  };
}; 
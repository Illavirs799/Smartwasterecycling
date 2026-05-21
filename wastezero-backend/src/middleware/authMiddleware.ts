import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const authProtect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token = req.header('x-auth-token');
  const authHeader = req.header('Authorization');
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Check if not token
  if (!token) {
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  // Verify token
  try {
    const secret = process.env['JWT_SECRET'] || 'wastezero_secret_token';
    const decoded = jwt.verify(token, secret);
    
    const userId = (decoded as any).user?.id || (decoded as any).user?._id;
    if (userId) {
      const userDoc = await User.findById(userId).lean();
      if (userDoc && (userDoc as any).isSuspended) {
        res.status(403).json({ message: 'Your account has been suspended. Please contact support.' });
        return;
      }
    }
    
    req.user = (decoded as any).user;
    
    next();
  } catch (err: any) {
    console.error('JWT Verification Error:', err.message);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

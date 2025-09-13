import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Access token required' } 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is not blocked
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, username: true, isBlocked: true }
    });

    if (!user || user.isBlocked) {
      return res.status(401).json({ 
        success: false, 
        error: { message: 'Invalid or expired token' } 
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      username: user.username
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      error: { message: 'Invalid or expired token' } 
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, username: true, isBlocked: true }
      });

      if (user && !user.isBlocked) {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username
        };
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

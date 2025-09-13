import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/authService';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Register
router.post('/register', async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await AuthService.register(validatedData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await AuthService.login(validatedData);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = refreshTokenSchema.parse(req.body);
    const tokens = await AuthService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      data: { tokens }
    });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const deviceId = req.headers['x-device-id'] as string;
    await AuthService.logout(req.user!.id, deviceId);
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get user sessions
router.get('/sessions', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await AuthService.getUserSessions(req.user!.id);
    
    res.json({
      success: true,
      data: { sessions }
    });
  } catch (error) {
    next(error);
  }
});

// Revoke session
router.delete('/sessions/:sessionId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { sessionId } = req.params;
    await AuthService.revokeSession(req.user!.id, sessionId);
    
    res.json({
      success: true,
      message: 'Session revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Verify token
router.get('/verify', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    res.json({
      success: true,
      data: { user: req.user }
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };

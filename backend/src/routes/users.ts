import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get current user profile
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.patch('/me', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const updateSchema = z.object({
      displayName: z.string().min(1).max(50).optional(),
      bio: z.string().max(500).optional(),
      avatar: z.string().url().optional()
    });

    const validatedData = updateSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Search users
router.get('/search', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user!.id } }, // Exclude current user
          { isBlocked: false },
          {
            OR: [
              { username: { contains: q, mode: 'insensitive' } },
              { displayName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        isOnline: true,
        lastSeen: true
      },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:userId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        isOnline: true,
        lastSeen: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Get user contacts
router.get('/me/contacts', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const contacts = await prisma.contact.findMany({
      where: { userId: req.user!.id },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            status: true,
            isOnline: true,
            lastSeen: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: { contacts }
    });
  } catch (error) {
    next(error);
  }
});

// Add contact
router.post('/me/contacts', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const addContactSchema = z.object({
      contactId: z.string().min(1)
    });

    const { contactId } = addContactSchema.parse(req.body);

    if (contactId === req.user!.id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot add yourself as a contact' }
      });
    }

    // Check if contact exists
    const contact = await prisma.user.findUnique({
      where: { id: contactId }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Check if already a contact
    const existingContact = await prisma.contact.findUnique({
      where: {
        userId_contactId: {
          userId: req.user!.id,
          contactId
        }
      }
    });

    if (existingContact) {
      return res.status(400).json({
        success: false,
        error: { message: 'User is already a contact' }
      });
    }

    const newContact = await prisma.contact.create({
      data: {
        userId: req.user!.id,
        contactId
      },
      include: {
        contact: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            bio: true,
            status: true,
            isOnline: true,
            lastSeen: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { contact: newContact }
    });
  } catch (error) {
    next(error);
  }
});

// Remove contact
router.delete('/me/contacts/:contactId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { contactId } = req.params;

    await prisma.contact.deleteMany({
      where: {
        userId: req.user!.id,
        contactId
      }
    });

    res.json({
      success: true,
      message: 'Contact removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };

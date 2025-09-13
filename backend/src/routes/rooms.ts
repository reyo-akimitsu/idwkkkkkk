import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get user's rooms
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId: req.user!.id,
            isActive: true
          }
        }
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                isOnline: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: { rooms }
    });
  } catch (error) {
    next(error);
  }
});

// Create a new room
router.post('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const createRoomSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      type: z.enum(['DIRECT', 'GROUP', 'CHANNEL']).default('GROUP'),
      isPrivate: z.boolean().default(false),
      memberIds: z.array(z.string()).min(1, 'At least one member is required')
    });

    const validatedData = createRoomSchema.parse(req.body);

    // Create room with members
    const room = await prisma.room.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        type: validatedData.type,
        isPrivate: validatedData.isPrivate,
        createdBy: req.user!.id,
        members: {
          create: [
            // Add creator as owner
            {
              userId: req.user!.id,
              role: 'OWNER'
            },
            // Add other members
            ...validatedData.memberIds
              .filter(id => id !== req.user!.id)
              .map(userId => ({
                userId,
                role: 'MEMBER' as const
              }))
          ]
        }
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                isOnline: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { room }
    });
  } catch (error) {
    next(error);
  }
});

// Get room by ID
router.get('/:roomId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;

    // Check if user is a member
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                isOnline: true
              }
            }
          }
        },
        pinnedMessages: {
          include: {
            message: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: { pinnedAt: 'desc' }
        }
      }
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        error: { message: 'Room not found' }
      });
    }

    res.json({
      success: true,
      data: { room }
    });
  } catch (error) {
    next(error);
  }
});

// Update room
router.patch('/:roomId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;

    // Check if user is admin or owner
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    const updateSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      avatar: z.string().url().optional()
    });

    const validatedData = updateSchema.parse(req.body);

    const room = await prisma.room.update({
      where: { id: roomId },
      data: validatedData,
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                status: true,
                isOnline: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: { room }
    });
  } catch (error) {
    next(error);
  }
});

// Add member to room
router.post('/:roomId/members', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;

    // Check if user is admin or owner
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    const addMemberSchema = z.object({
      userId: z.string().min(1),
      role: z.enum(['MEMBER', 'MODERATOR']).default('MEMBER')
    });

    const { userId, role } = addMemberSchema.parse(req.body);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Check if already a member
    const existingMember = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    if (existingMember) {
      if (existingMember.isActive) {
        return res.status(400).json({
          success: false,
          error: { message: 'User is already a member' }
        });
      } else {
        // Reactivate member
        const member = await prisma.roomMember.update({
          where: { id: existingMember.id },
          data: { isActive: true, role }
        });

        return res.json({
          success: true,
          data: { member }
        });
      }
    }

    // Add new member
    const member = await prisma.roomMember.create({
      data: {
        roomId,
        userId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
            status: true,
            isOnline: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { member }
    });
  } catch (error) {
    next(error);
  }
});

// Remove member from room
router.delete('/:roomId/members/:userId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId, userId } = req.params;

    // Check if user is admin or owner, or removing themselves
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    const isRemovingSelf = userId === req.user!.id;
    const hasPermission = membership && membership.isActive && ['OWNER', 'ADMIN'].includes(membership.role);

    if (!isRemovingSelf && !hasPermission) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    // Don't allow owner to remove themselves
    if (isRemovingSelf && membership?.role === 'OWNER') {
      return res.status(400).json({
        success: false,
        error: { message: 'Owner cannot leave the room' }
      });
    }

    await prisma.roomMember.updateMany({
      where: {
        roomId,
        userId
      },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Pin message
router.post('/:roomId/pin/:messageId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId, messageId } = req.params;

    // Check if user is admin or owner
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    const pinnedMessage = await prisma.pinnedMessage.create({
      data: {
        roomId,
        messageId,
        pinnedBy: req.user!.id
      },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { pinnedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// Unpin message
router.delete('/:roomId/pin/:messageId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId, messageId } = req.params;

    // Check if user is admin or owner
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive || !['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role)) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    await prisma.pinnedMessage.deleteMany({
      where: {
        roomId,
        messageId
      }
    });

    res.json({
      success: true,
      message: 'Message unpinned successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get pinned messages for a room
router.get('/:roomId/pinned', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;

    // Check if user is a member
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId: req.user!.id
        }
      }
    });

    if (!membership || !membership.isActive) {
      return res.status(403).json({
        success: false,
        error: { message: 'Access denied' }
      });
    }

    const pinnedMessages = await prisma.pinnedMessage.findMany({
      where: { roomId },
      include: {
        message: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: { pinnedAt: 'desc' }
    });

    res.json({
      success: true,
      data: { pinnedMessages }
    });
  } catch (error) {
    next(error);
  }
});

export { router as roomRoutes };

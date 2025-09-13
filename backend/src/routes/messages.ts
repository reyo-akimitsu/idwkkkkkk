import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get messages for a room
router.get('/room/:roomId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, cursor } = req.query;

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

    const whereClause: any = {
      roomId,
      isDeleted: false
    };

    if (cursor) {
      whereClause.id = { lt: cursor };
    }

    const messages = await prisma.message.findMany({
      where: whereClause,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        replyTo: {
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
        },
        files: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        },
        readReceipts: {
          where: { userId: req.user!.id },
          select: { readAt: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    // Get next cursor
    const nextCursor = messages.length === parseInt(limit as string) 
      ? messages[messages.length - 1].id 
      : null;

    res.json({
      success: true,
      data: { 
        messages: messages.reverse(), // Reverse to show oldest first
        nextCursor 
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get message by ID
router.get('/:messageId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        replyTo: {
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
        },
        files: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        },
        readReceipts: {
          include: {
            user: {
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

    if (!message) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }

    // Check if user has access to this message
    const membership = await prisma.roomMember.findUnique({
      where: {
        roomId_userId: {
          roomId: message.roomId,
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

    res.json({
      success: true,
      data: { message }
    });
  } catch (error) {
    next(error);
  }
});

// Edit message
router.patch('/:messageId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { messageId } = req.params;

    const editSchema = z.object({
      content: z.string().min(1).max(4000)
    });

    const { content } = editSchema.parse(req.body);

    // Check if message exists and user is the sender
    const message = await prisma.message.findUnique({
      where: { id: messageId },
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
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }

    if (message.senderId !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: { message: 'You can only edit your own messages' }
      });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        replyTo: {
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
        },
        files: true,
        reactions: {
          include: {
            user: {
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

    res.json({
      success: true,
      data: { message: updatedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// Delete message
router.delete('/:messageId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { messageId } = req.params;

    // Check if message exists and user is the sender or has admin permissions
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        room: {
          include: {
            members: {
              where: { userId: req.user!.id, isActive: true }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: { message: 'Message not found' }
      });
    }

    const isSender = message.senderId === req.user!.id;
    const membership = message.room.members[0];
    const hasAdminPermission = membership && ['OWNER', 'ADMIN', 'MODERATOR'].includes(membership.role);

    if (!isSender && !hasAdminPermission) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions' }
      });
    }

    // Soft delete message
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: null
      }
    });

    res.json({
      success: true,
      data: { message: deletedMessage }
    });
  } catch (error) {
    next(error);
  }
});

// Search messages
router.get('/search/:roomId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { roomId } = req.params;
    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: { message: 'Search query is required' }
      });
    }

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

    const messages = await prisma.message.findMany({
      where: {
        roomId,
        content: {
          contains: q,
          mode: 'insensitive'
        },
        isDeleted: false
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true
          }
        },
        files: true
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    next(error);
  }
});

// Mark messages as read
router.post('/mark-read', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const markReadSchema = z.object({
      messageIds: z.array(z.string()).min(1)
    });

    const { messageIds } = markReadSchema.parse(req.body);

    // Create read receipts
    const readReceipts = await Promise.all(
      messageIds.map(messageId =>
        prisma.readReceipt.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId: req.user!.id
            }
          },
          update: {
            readAt: new Date()
          },
          create: {
            messageId,
            userId: req.user!.id,
            readAt: new Date()
          }
        })
      )
    );

    res.json({
      success: true,
      data: { readReceipts }
    });
  } catch (error) {
    next(error);
  }
});

export { router as messageRoutes };

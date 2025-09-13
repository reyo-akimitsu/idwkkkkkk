import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { getRedis } from '../utils/redis';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

interface SocketUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: string;
  isOnline: boolean;
}

export function setupSocketHandlers(io: Server) {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
          status: true,
          isOnline: true,
          isBlocked: true
        }
      });

      if (!user || user.isBlocked) {
        return next(new Error('Authentication error'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected with socket ${socket.id}`);

    // Update user online status
    updateUserStatus(socket.userId!, 'ONLINE', true);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Join user to all their room memberships
    joinUserRooms(socket);

    // Handle joining a room
    socket.on('join_room', async (roomId: string) => {
      try {
        const isMember = await checkRoomMembership(socket.userId!, roomId);
        if (isMember) {
          socket.join(`room:${roomId}`);
          socket.emit('joined_room', { roomId });
          
          // Notify others in the room
          socket.to(`room:${roomId}`).emit('user_joined', {
            roomId,
            user: socket.user
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      socket.emit('left_room', { roomId });
      
      // Notify others in the room
      socket.to(`room:${roomId}`).emit('user_left', {
        roomId,
        user: socket.user
      });
    });

    // Handle sending messages
    socket.on('send_message', async (data: any) => {
      try {
        const { roomId, content, type = 'TEXT', replyToId, files } = data;

        // Verify room membership
        const isMember = await checkRoomMembership(socket.userId!, roomId);
        if (!isMember) {
          socket.emit('error', { message: 'Not a member of this room' });
          return;
        }

        // Create message in database
        const message = await prisma.message.create({
          data: {
            roomId,
            senderId: socket.userId!,
            content,
            type,
            replyToId,
            files: files ? {
              create: files.map((file: any) => ({
                userId: socket.userId!,
                filename: file.filename,
                originalName: file.originalName,
                mimeType: file.mimeType,
                size: file.size,
                url: file.url,
                thumbnailUrl: file.thumbnailUrl
              }))
            } : undefined
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

        // Emit message to room
        io.to(`room:${roomId}`).emit('new_message', message);

        // Update room last activity
        await prisma.room.update({
          where: { id: roomId },
          data: { updatedAt: new Date() }
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing_start', (data: { roomId: string }) => {
      socket.to(`room:${data.roomId}`).emit('user_typing', {
        roomId: data.roomId,
        user: socket.user,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { roomId: string }) => {
      socket.to(`room:${data.roomId}`).emit('user_typing', {
        roomId: data.roomId,
        user: socket.user,
        isTyping: false
      });
    });

    // Handle message reactions
    socket.on('add_reaction', async (data: { messageId: string; emoji: string }) => {
      try {
        const { messageId, emoji } = data;

        // Check if reaction already exists
        const existingReaction = await prisma.reaction.findUnique({
          where: {
            messageId_userId_emoji: {
              messageId,
              userId: socket.userId!,
              emoji
            }
          }
        });

        if (existingReaction) {
          // Remove existing reaction
          await prisma.reaction.delete({
            where: { id: existingReaction.id }
          });
        } else {
          // Add new reaction
          await prisma.reaction.create({
            data: {
              messageId,
              userId: socket.userId!,
              emoji
            }
          });
        }

        // Get updated message with reactions
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: {
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

        if (message) {
          // Emit updated message to room
          io.to(`room:${message.roomId}`).emit('message_updated', message);
        }

      } catch (error) {
        socket.emit('error', { message: 'Failed to add reaction' });
      }
    });

    // Handle read receipts
    socket.on('mark_read', async (data: { messageId: string }) => {
      try {
        const { messageId } = data;

        // Create or update read receipt
        await prisma.readReceipt.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId: socket.userId!
            }
          },
          update: {
            readAt: new Date()
          },
          create: {
            messageId,
            userId: socket.userId!,
            readAt: new Date()
          }
        });

        // Get message to find room
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { roomId: true }
        });

        if (message) {
          // Emit read receipt to room
          io.to(`room:${message.roomId}`).emit('message_read', {
            messageId,
            userId: socket.userId,
            readAt: new Date()
          });
        }

      } catch (error) {
        socket.emit('error', { message: 'Failed to mark message as read' });
      }
    });

    // Handle user status updates
    socket.on('update_status', async (data: { status: string }) => {
      try {
        const { status } = data;
        
        await prisma.user.update({
          where: { id: socket.userId! },
          data: { status }
        });

        updateUserStatus(socket.userId!, status, true);

        // Notify all rooms user is in
        const userRooms = await prisma.roomMember.findMany({
          where: { userId: socket.userId!, isActive: true },
          select: { roomId: true }
        });

        userRooms.forEach(({ roomId }) => {
          io.to(`room:${roomId}`).emit('user_status_updated', {
            userId: socket.userId,
            status,
            user: socket.user
          });
        });

      } catch (error) {
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.username} disconnected`);
      
      // Update user offline status
      updateUserStatus(socket.userId!, 'OFFLINE', false);

      // Notify all rooms user was in
      const userRooms = await prisma.roomMember.findMany({
        where: { userId: socket.userId!, isActive: true },
        select: { roomId: true }
      });

      userRooms.forEach(({ roomId }) => {
        socket.to(`room:${roomId}`).emit('user_left', {
          roomId,
          user: socket.user
        });
      });
    });
  });
}

async function updateUserStatus(userId: string, status: string, isOnline: boolean) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { status, isOnline, lastSeen: new Date() }
    });

    // Cache user status in Redis
    const redis = getRedis();
    await redis.setex(`user:${userId}:status`, 300, JSON.stringify({
      status,
      isOnline,
      lastSeen: new Date()
    }));
  } catch (error) {
    console.error('Failed to update user status:', error);
  }
}

async function joinUserRooms(socket: AuthenticatedSocket) {
  try {
    const userRooms = await prisma.roomMember.findMany({
      where: { userId: socket.userId!, isActive: true },
      select: { roomId: true }
    });

    userRooms.forEach(({ roomId }) => {
      socket.join(`room:${roomId}`);
    });
  } catch (error) {
    console.error('Failed to join user rooms:', error);
  }
}

async function checkRoomMembership(userId: string, roomId: string): Promise<boolean> {
  const membership = await prisma.roomMember.findUnique({
    where: {
      roomId_userId: {
        roomId,
        userId
      }
    }
  });

  return !!membership && membership.isActive;
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../utils/database';
import { getRedis } from '../utils/redis';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  static async register(data: RegisterData): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, username, password, displayName } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName: displayName || username,
        passwordHash,
        isOnline: true,
        status: 'ONLINE'
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        status: true,
        isOnline: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create user session
    await this.createUserSession(user.id, uuidv4());

    return { user, tokens };
  }

  static async login(data: LoginData): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password } = data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.isBlocked) {
      throw new Error('Account is blocked');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        status: 'ONLINE',
        lastSeen: new Date()
      }
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create user session
    await this.createUserSession(user.id, uuidv4());

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio,
        status: 'ONLINE',
        isOnline: true,
        createdAt: user.createdAt
      },
      tokens
    };
  }

  static async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
      
      // Check if user exists and is not blocked
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isBlocked: true, refreshToken: true }
      });

      if (!user || user.isBlocked || user.refreshToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async logout(userId: string, deviceId?: string): Promise<void> {
    // Clear refresh token
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null, refreshTokenExpires: null }
    });

    // Deactivate user session
    if (deviceId) {
      await prisma.userSession.updateMany({
        where: { userId, deviceId },
        data: { isActive: false }
      });
    } else {
      await prisma.userSession.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        status: 'OFFLINE',
        lastSeen: new Date()
      }
    });

    // Clear from Redis cache
    const redis = getRedis();
    await redis.del(`user:${userId}:status`);
  }

  static async generateTokens(userId: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId },
      process.env.JWT_SECRET!,
      { expiresIn: this.ACCESS_TOKEN_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: this.REFRESH_TOKEN_EXPIRES_IN }
    );

    // Store refresh token in database
    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 days

    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
        refreshTokenExpires
      }
    });

    return { accessToken, refreshToken };
  }

  static async createUserSession(userId: string, deviceId: string, deviceInfo?: any): Promise<void> {
    await prisma.userSession.create({
      data: {
        userId,
        deviceId,
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : null,
        isActive: true
      }
    });
  }

  static async getUserSessions(userId: string): Promise<any[]> {
    return await prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { lastUsed: 'desc' }
    });
  }

  static async revokeSession(userId: string, sessionId: string): Promise<void> {
    await prisma.userSession.update({
      where: { id: sessionId, userId },
      data: { isActive: false }
    });
  }
}

import { Router } from 'express';
import { prisma } from '../utils/database';
import { getRedis } from '../utils/redis';

const router = Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        redis: 'unknown',
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      }
    };

    // Check database connection
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'connected';
    } catch (error) {
      healthCheck.services.database = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    // Check Redis connection
    try {
      const redis = getRedis();
      await redis.ping();
      healthCheck.services.redis = 'connected';
    } catch (error) {
      healthCheck.services.redis = 'disconnected';
      healthCheck.status = 'DEGRADED';
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

// Detailed health check
router.get('/detailed', async (req, res) => {
  try {
    const detailedHealth = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        storage: await checkStorage()
      },
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      }
    };

    const hasErrors = Object.values(detailedHealth.services).some(
      service => service.status !== 'OK'
    );

    if (hasErrors) {
      detailedHealth.status = 'DEGRADED';
    }

    const statusCode = detailedHealth.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Detailed health check failed'
    });
  }
});

async function checkDatabase() {
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - start;

    // Get database stats
    const userCount = await prisma.user.count();
    const roomCount = await prisma.room.count();
    const messageCount = await prisma.message.count();

    return {
      status: 'OK',
      responseTime: `${responseTime}ms`,
      stats: {
        users: userCount,
        rooms: roomCount,
        messages: messageCount
      }
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkRedis() {
  try {
    const redis = getRedis();
    const start = Date.now();
    await redis.ping();
    const responseTime = Date.now() - start;

    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const usedMemory = memoryMatch ? memoryMatch[1] : 'unknown';

    return {
      status: 'OK',
      responseTime: `${responseTime}ms`,
      memory: usedMemory
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function checkStorage() {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const storagePath = process.env.STORAGE_PATH || './uploads';
    const stats = fs.statSync(storagePath);
    
    return {
      status: 'OK',
      path: storagePath,
      writable: stats.isDirectory(),
      type: process.env.STORAGE_TYPE || 'local'
    };
  } catch (error) {
    return {
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export { router as healthRoutes };

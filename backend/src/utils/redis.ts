import Redis from 'ioredis';

let redis: Redis;

export function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryDelayOnFailover: 100,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    redis.on('error', (error) => {
      console.error('❌ Redis connection error:', error);
    });
  }
  return redis;
}

export async function connectRedis() {
  try {
    const redisClient = getRedis();
    await redisClient.ping();
    console.log('✅ Redis connection verified');
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    throw error;
  }
}

export async function disconnectRedis() {
  try {
    if (redis) {
      await redis.quit();
      console.log('✅ Redis disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Redis disconnection failed:', error);
    throw error;
  }
}

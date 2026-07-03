import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let _client: Redis | null = null;

export const getRedis = (): Redis | null => _client;

export const connectRedis = async (): Promise<void> => {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info('REDIS_URL not set — using Prisma cache fallback');
    return;
  }
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });
    await client.connect();
    _client = client;
    _client.on('error', (err) => logger.error('Redis error', err));
    logger.info('Redis connected');
  } catch (err) {
    logger.warn('Redis connection failed — falling back to Prisma cache', err);
    _client = null;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  if (_client) {
    await _client.quit().catch(() => {});
    _client = null;
  }
};

/**
 * Plain connection options for BullMQ (avoids ioredis version conflicts).
 * BullMQ uses its own bundled ioredis — pass config, not a Redis instance.
 */
export const getBullMQConnection = (): { host: string; port: number; password?: string; username?: string } | null => {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return {
      host:     parsed.hostname || 'localhost',
      port:     parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
      username: parsed.username || undefined,
    };
  } catch {
    logger.warn('Invalid REDIS_URL format');
    return null;
  }
};

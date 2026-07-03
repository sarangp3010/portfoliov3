import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { getRedis } from '../config/redis.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000;

// ─── Redis backend ─────────────────────────────────────────────────────────────

async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await getRedis()!.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch { return null; }
}

async function redisSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  try {
    await getRedis()!.set(key, JSON.stringify(value), 'PX', ttlMs);
  } catch (err) { logger.error('Redis set error', err); }
}

async function redisDel(key: string): Promise<void> {
  try { await getRedis()!.del(key); } catch { /* ignore */ }
}

async function redisScan(prefix: string): Promise<void> {
  const r = getRedis()!;
  let cursor = '0';
  do {
    const [next, keys] = await r.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 200);
    cursor = next;
    if (keys.length > 0) await r.del(...keys);
  } while (cursor !== '0');
}

// ─── Prisma backend (fallback) ─────────────────────────────────────────────────

async function prismaGet<T>(key: string): Promise<T | null> {
  try {
    const entry = await prisma.cacheEntry.findUnique({ where: { key } });
    if (!entry) return null;
    if (new Date() > entry.expiresAt) {
      await prisma.cacheEntry.delete({ where: { key } }).catch(() => {});
      return null;
    }
    return entry.value as T;
  } catch { return null; }
}

async function prismaSet(key: string, value: unknown, ttlMs: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    await prisma.cacheEntry.upsert({
      where: { key },
      update: { value: value as any, expiresAt },
      create: { key, value: value as any, expiresAt },
    });
  } catch (err) { logger.error('Prisma cache set error', err); }
}

async function prismaDel(key: string): Promise<void> {
  await prisma.cacheEntry.deleteMany({ where: { key } }).catch(() => {});
}

async function prismaScan(prefix: string): Promise<void> {
  await prisma.cacheEntry.deleteMany({ where: { key: { startsWith: prefix } } }).catch(() => {});
}

// ─── Public API ────────────────────────────────────────────────────────────────

export const cacheGet = async <T>(key: string): Promise<T | null> =>
  getRedis() ? redisGet<T>(key) : prismaGet<T>(key);

export const cacheSet = async (key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): Promise<void> =>
  getRedis() ? redisSet(key, value, ttlMs) : prismaSet(key, value, ttlMs);

export const cacheDelete = async (key: string): Promise<void> =>
  getRedis() ? redisDel(key) : prismaDel(key);

export const cacheDeletePattern = async (prefix: string): Promise<void> =>
  getRedis() ? redisScan(prefix) : prismaScan(prefix);

/** Purge expired entries — only needed for the Prisma fallback; Redis handles TTL natively. */
export const cachePurgeExpired = async (): Promise<void> => {
  if (getRedis()) return;
  await prisma.cacheEntry.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
};

/** Wrap any async function with cache read-through. */
export const cached = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> => {
  const hit = await cacheGet<T>(key);
  if (hit !== null) return hit;
  const value = await fn();
  await cacheSet(key, value, ttlMs);
  return value;
};

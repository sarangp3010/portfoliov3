import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const entry = await prisma.cacheEntry.findUnique({ where: { key } });
    if (!entry) return null;
    if (new Date() > entry.expiresAt) {
      await prisma.cacheEntry.delete({ where: { key } }).catch(() => {});
      return null;
    }
    return entry.value as T;
  } catch { return null; }
};

export const cacheSet = async (key: string, value: unknown, ttlMs = DEFAULT_TTL_MS): Promise<void> => {
  try {
    const expiresAt = new Date(Date.now() + ttlMs);
    await prisma.cacheEntry.upsert({
      where: { key },
      update: { value: value as any, expiresAt },
      create: { key, value: value as any, expiresAt },
    });
  } catch (err) { logger.error('Cache set error', err); }
};

export const cacheDelete = async (key: string): Promise<void> => {
  await prisma.cacheEntry.deleteMany({ where: { key } }).catch(() => {});
};

export const cacheDeletePattern = async (prefix: string): Promise<void> => {
  await prisma.cacheEntry.deleteMany({ where: { key: { startsWith: prefix } } }).catch(() => {});
};

export const cachePurgeExpired = async (): Promise<void> => {
  await prisma.cacheEntry.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {});
};

/** Wrap any async function with cache */
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

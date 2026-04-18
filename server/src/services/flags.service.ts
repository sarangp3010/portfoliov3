import { prisma } from '../config/prisma.js';
import { cacheGet, cacheSet, cacheDelete } from './cache.service.js';

const CACHE_KEY = 'feature_flags:all';
const TTL = 60_000; // 1 minute

export const getAllFlags = async () => {
  const cached = await cacheGet<Record<string, boolean>>(CACHE_KEY);
  if (cached) return cached;
  const flags = await prisma.featureFlag.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  const map: Record<string, boolean> = {};
  flags.forEach(f => { map[f.key] = f.enabled; });
  await cacheSet(CACHE_KEY, map, TTL);
  return map;
};

export const getAllFlagsDetailed = () =>
  prisma.featureFlag.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });

export const getFlag = async (key: string): Promise<boolean> => {
  const flags = await getAllFlags();
  return flags[key] ?? true; // default on if unknown
};

export const setFlag = async (key: string, enabled: boolean, updatedBy?: string) => {
  await cacheDelete(CACHE_KEY);
  return prisma.featureFlag.update({
    where: { key },
    data: { enabled, updatedBy },
  });
};

export const updateFlag = async (key: string, data: {
  enabled?: boolean;
  name?: string;
  description?: string;
  category?: string;
  metadata?: Record<string, unknown>;
  updatedBy?: string;
}) => {
  await cacheDelete(CACHE_KEY);
  return prisma.featureFlag.update({ where: { key }, data: data as any });
};

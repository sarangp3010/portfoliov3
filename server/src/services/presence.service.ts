import { prisma } from '../config/prisma.js';

const STALE_MS = 3 * 60 * 1000; // 3 min without ping = gone

export const upsertPresence = async (payload: {
  sessionId: string;
  currentPage: string;
  country?: string;
  device?: string;
  browser?: string;
}) => {
  return prisma.activeVisitor.upsert({
    where: { sessionId: payload.sessionId },
    update: { currentPage: payload.currentPage, lastPing: new Date() },
    create: { ...payload, lastPing: new Date() },
  });
};

export const getActiveVisitors = async () => {
  const cutoff = new Date(Date.now() - STALE_MS);
  // Prune stale entries
  await prisma.activeVisitor.deleteMany({ where: { lastPing: { lt: cutoff } } }).catch(() => {});
  return prisma.activeVisitor.findMany({ orderBy: { lastPing: 'desc' } });
};

export const getActiveSummary = async () => {
  const visitors = await getActiveVisitors();
  const pages: Record<string, number> = {};
  const countries: Record<string, number> = {};
  visitors.forEach(v => {
    pages[v.currentPage] = (pages[v.currentPage] ?? 0) + 1;
    if (v.country) countries[v.country] = (countries[v.country] ?? 0) + 1;
  });
  return {
    count: visitors.length,
    pages: Object.entries(pages).map(([page, count]) => ({ page, count })).sort((a, b) => b.count - a.count),
    countries: Object.entries(countries).map(([country, count]) => ({ country, count })).sort((a, b) => b.count - a.count),
    visitors: visitors.map(v => ({ sessionId: v.sessionId, currentPage: v.currentPage, country: v.country, device: v.device, browser: v.browser, lastPing: v.lastPing })),
  };
};

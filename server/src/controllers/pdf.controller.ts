import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
};

// Build a minimal PDF as raw bytes using PDFKit-style raw PDF (no npm deps)
// Since we can't install pdfkit on the server at runtime, we serve a structured
// HTML page that the browser can print-to-PDF, and expose a /pdf/resume-data
// endpoint for the client-side PDF generator.

export const getResumeData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [profile, projects, skills] = await Promise.all([
      prisma.profile.findFirst(),
      prisma.project.findMany({ where: { featured: true }, orderBy: { order: 'asc' }, take: 6 }),
      prisma.profile.findFirst({ select: { skills: true, techStack: true, yearsExp: true, projectCount: true, clientCount: true } }),
    ]);
    res.json({ success: true, data: { profile, projects, skills } });
  } catch (err) { next(err); }
};

export const getPortfolioData = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [profile, projects, posts, services] = await Promise.all([
      prisma.profile.findFirst(),
      prisma.project.findMany({ orderBy: { order: 'asc' } }),
      prisma.blogPost.findMany({ where: { published: true }, orderBy: { views: 'desc' }, take: 5, select: { title: true, excerpt: true, tags: true, views: true, publishedAt: true } }),
      prisma.service.findMany({ orderBy: { order: 'asc' } }),
    ]);
    res.json({ success: true, data: { profile, projects, posts, services } });
  } catch (err) { next(err); }
};

export const getAnalyticsReportData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    const since = new Date(Date.now() - days * 86_400_000);
    const [visitors, pageViews, inquiries, topPages, dailyData] = await Promise.all([
      prisma.visitor.count({ where: { firstSeen: { gte: since } } }),
      prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
      prisma.pageView.groupBy({ by: ['page'], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { page: 'desc' } }, take: 8 }),
      prisma.$queryRaw<Array<{ day: string; visitors: bigint; pageviews: bigint }>>`
        SELECT to_char("firstSeen"::date,'YYYY-MM-DD') as day,
               COUNT(DISTINCT v.id)::bigint as visitors,
               COUNT(DISTINCT pv.id)::bigint as pageviews
        FROM "Visitor" v
        LEFT JOIN "PageView" pv ON pv."visitorId"=v.id AND pv."createdAt">=${since}
        WHERE v."firstSeen">=${since}
        GROUP BY v."firstSeen"::date ORDER BY day ASC LIMIT 30`,
    ]);
    res.json({
      success: true,
      data: {
        days, visitors, pageViews, inquiries,
        topPages: topPages.map(r => ({ page: r.page, views: r._count._all })),
        dailyData: (dailyData as any[]).map(r => ({ day: r.day, visitors: Number(r.visitors), pageviews: Number(r.pageviews) })),
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (err) { next(err); }
};

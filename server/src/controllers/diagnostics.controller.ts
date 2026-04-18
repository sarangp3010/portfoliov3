import { Request, Response, NextFunction } from 'express';
import { getDiagnostics, getAnalyticsEventLog, getNavFlows, getSmartInsights } from '../services/diagnostics.service.js';
import { getActiveSummary } from '../services/presence.service.js';
import { prisma } from '../config/prisma.js';

export const diagnosticsOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const hours = parseInt(req.query.hours as string ?? '24', 10);
    res.json({ success: true, data: await getDiagnostics(hours) });
  } catch (err) { next(err); }
};

export const eventLog = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string ?? '50', 10);
    res.json({ success: true, data: await getAnalyticsEventLog(limit) });
  } catch (err) { next(err); }
};

export const navFlows = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    res.json({ success: true, data: await getNavFlows(days) });
  } catch (err) { next(err); }
};

export const smartInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    res.json({ success: true, data: await getSmartInsights(days) });
  } catch (err) { next(err); }
};

export const activeVisitors = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json({ success: true, data: await getActiveSummary() }); } catch (err) { next(err); }
};

export const sessionTimeline = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await prisma.visitorSession.findUnique({
      where: { id: String(req.params.sessionId) },
      include: {
        visitor: { select: { sessionId: true, country: true, city: true, browser: true, os: true, device: true, isMobile: true, referrer: true } },
        contentEvents: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!session) { res.status(404).json({ success: false, error: 'Session not found' }); return; }
    res.json({ success: true, data: session });
  } catch (err) { next(err); }
};

export const listSessions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string ?? '1', 10);
    const limit = 20;
    const [sessions, total] = await Promise.all([
      prisma.visitorSession.findMany({
        orderBy: { sessionStart: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          visitor: { select: { country: true, browser: true, device: true, referrer: true } },
          _count: { select: { contentEvents: true } },
          contentEvents: {
            where: {
              eventType: {
                in: [
                  'INQUIRY_SUBMIT', 'RESUME_DOWNLOAD', 'SERVICE_INQUIRY_OPEN',
                  'PROJECT_GITHUB_CLICK', 'PROJECT_DEMO_CLICK',
                  'PROJECT_VIEW', 'BLOG_VIEW', 'EXTERNAL_LINK',
                ],
              },
            },
            orderBy: { createdAt: 'asc' },
            select: { eventType: true, contentTitle: true, contentId: true },
            take: 10,
          },
        },
      }),
      prisma.visitorSession.count(),
    ]);
    res.json({ success: true, data: { sessions, total, page, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

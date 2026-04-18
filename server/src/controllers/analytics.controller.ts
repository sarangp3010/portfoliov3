import { Request, Response, NextFunction } from 'express';
import { EventType, ContentEventType, ContentType } from '@prisma/client';
import {
  upsertVisitor, upsertVisitorSession,
  recordPageView, recordEvent, recordContentEvent,
  getAnalyticsSummary, getBlogAnalytics, getProjectAnalytics, getVisitorInsights,
} from '../services/analytics.service.js';
import { upsertPresence } from '../services/presence.service.js';
import { getFlag } from '../services/flags.service.js';
import { cached } from '../services/cache.service.js';

export const track = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Respect analytics feature flag
    const analyticsOn = await getFlag('analytics_enabled');
    if (!analyticsOn) { res.json({ success: true }); return; }

    const { sessionId, deviceId, page, title, referrer, eventType, target, metadata, contentEventType, contentType, contentId, contentTitle } = req.body;
    if (!sessionId) { res.json({ success: true }); return; }

    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() ?? req.ip;
    const ua = req.headers['user-agent'];
    const visitor = await upsertVisitor({ sessionId, deviceId, ip, userAgent: ua, referrer });

    let visitorSessionId: string | undefined;
    if (page) {
      try {
        visitorSessionId = await upsertVisitorSession(visitor.id, page, ip, visitor.browser ?? undefined, visitor.os ?? undefined, visitor.country ?? undefined, visitor.city ?? undefined);
      } catch { /* non-critical */ }

      await recordPageView(visitor.id, page, title, referrer);

      // Real-time presence
      const realtimeOn = await getFlag('realtime_analytics');
      if (realtimeOn) {
        upsertPresence({ sessionId, currentPage: page, country: visitor.country ?? undefined, device: visitor.device ?? undefined, browser: visitor.browser ?? undefined }).catch(() => {});
      }
    }

    if (eventType && Object.values(EventType).includes(eventType as EventType)) {
      await recordEvent(visitor.id, eventType as EventType, page, target, metadata);
    }

    if (contentEventType && Object.values(ContentEventType).includes(contentEventType as ContentEventType)) {
      const ct = contentType && Object.values(ContentType).includes(contentType as ContentType) ? (contentType as ContentType) : undefined;
      await recordContentEvent({ visitorId: visitor.id, sessionId: visitorSessionId, eventType: contentEventType as ContentEventType, pageUrl: page, contentType: ct, contentId, contentTitle, metadata });
    }

    res.json({ success: true, visitorId: visitor.id, sessionId: visitorSessionId });
  } catch (err) { next(err); }
};

export const getSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    const data = await cached(`analytics:summary:${days}`, () => getAnalyticsSummary(days), 2 * 60_000);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getBlogStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    const data = await cached(`analytics:blogs:${days}`, () => getBlogAnalytics(days), 3 * 60_000);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getProjectStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    const data = await cached(`analytics:projects:${days}`, () => getProjectAnalytics(days), 3 * 60_000);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

export const getVisitorStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string ?? '30', 10);
    const data = await cached(`analytics:visitors:${days}`, () => getVisitorInsights(days), 3 * 60_000);
    res.json({ success: true, data });
  } catch (err) { next(err); }
};

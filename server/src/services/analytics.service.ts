import { UAParser } from 'ua-parser-js';
import { prisma } from '../config/prisma.js';
import { EventType, ContentEventType, ContentType, Prisma } from '@prisma/client';
import { logger } from '../utils/logger.js';

// ─── User-Agent Parser ────────────────────────────────────────────────────────

const parseUA = (ua?: string) => {
  if (!ua) return { browser: null, os: null, device: 'desktop', isMobile: false };
  const p = new UAParser(ua).getResult();
  return {
    browser: p.browser.name ?? null,
    os: p.os.name ?? null,
    device: p.device.type ?? 'desktop',
    isMobile: p.device.type === 'mobile' || p.device.type === 'tablet',
  };
};

// ─── IP Geolocation ───────────────────────────────────────────────────────────

const getGeo = async (ip?: string) => {
  if (
    !ip ||
    ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) ||
    ip.startsWith('192.168') ||
    ip.startsWith('10.')
  ) {
    return { country: 'Local', city: null, region: null, timezone: null };
  }
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,regionName,timezone`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const d = await res.json() as { country?: string; city?: string; regionName?: string; timezone?: string };
    return { country: d.country, city: d.city, region: d.regionName, timezone: d.timezone };
  } catch { return {}; }
};

// ─── Visitor Upsert ───────────────────────────────────────────────────────────

export const upsertVisitor = async (payload: {
  sessionId: string;
  deviceId?: string;
  ip?: string;
  userAgent?: string;
  referrer?: string;
}) => {
  const existing = await prisma.visitor.findUnique({ where: { sessionId: payload.sessionId } });
  if (existing) {
    return prisma.visitor.update({
      where: { sessionId: payload.sessionId },
      data: { deviceId: payload.deviceId ?? existing.deviceId, lastSeen: new Date() },
    });
  }
  const ua = parseUA(payload.userAgent);
  const geo = await getGeo(payload.ip);
  return prisma.visitor.create({
    data: {
      sessionId: payload.sessionId,
      deviceId: payload.deviceId,
      ip: payload.ip,
      referrer: payload.referrer,
      ...ua, ...geo,
    },
  });
};

// ─── Visitor Session Management ───────────────────────────────────────────────

export const upsertVisitorSession = async (
  visitorId: string,
  page: string,
  ip?: string,
  browser?: string,
  os?: string,
  country?: string,
  city?: string,
): Promise<string> => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const existing = await prisma.visitorSession.findFirst({
    where: { visitorId, sessionEnd: null, sessionStart: { gte: cutoff } },
    orderBy: { sessionStart: 'desc' },
  });

  if (existing) {
    const path = existing.navigationPath ?? [];
    const updatedPath = path[path.length - 1] !== page ? [...path, page] : path;
    const updated = await prisma.visitorSession.update({
      where: { id: existing.id },
      data: {
        exitPage: page,
        navigationPath: updatedPath,
        pageCount: { increment: 1 },
        totalEvents: { increment: 1 },
      },
    });
    return updated.id;
  }

  const session = await prisma.visitorSession.create({
    data: {
      visitorId,
      ipAddress: ip,
      browser,
      operatingSystem: os,
      locationCountry: country,
      locationCity: city,
      entryPage: page,
      exitPage: page,
      navigationPath: [page],
      pageCount: 1,
      totalEvents: 1,
    },
  });
  return session.id;
};

// ─── Legacy Page View ─────────────────────────────────────────────────────────

export const recordPageView = async (visitorId: string, page: string, title?: string, referrer?: string) => {
  return prisma.pageView.create({ data: { visitorId, page, title: title ?? page, referrer } });
};

// ─── Legacy Analytics Event ───────────────────────────────────────────────────

export const recordEvent = async (
  visitorId: string,
  type: EventType,
  page?: string,
  target?: string,
  metadata?: Record<string, unknown>,
) => {
  return prisma.analyticsEvent.create({ data: { visitorId, type, page, target, metadata: metadata as Prisma.InputJsonValue } });
};

// ─── Content Event (enhanced) ─────────────────────────────────────────────────

export const recordContentEvent = async (payload: {
  visitorId: string;
  sessionId?: string;
  eventType: ContentEventType;
  pageUrl?: string;
  contentType?: ContentType;
  contentId?: string;
  contentTitle?: string;
  metadata?: Record<string, unknown>;
}) => {
  if (payload.sessionId) {
    prisma.visitorSession.updateMany({
      where: { id: payload.sessionId },
      data: { totalEvents: { increment: 1 } },
    }).catch(() => {});
  }
  return prisma.contentEvent.create({
    data: {
      visitorId: payload.visitorId,
      sessionId: payload.sessionId ?? null,
      eventType: payload.eventType,
      pageUrl: payload.pageUrl,
      contentType: payload.contentType ?? 'OTHER',
      contentId: payload.contentId,
      contentTitle: payload.contentTitle,
      metadata: payload.metadata as Prisma.InputJsonValue,
    },
  });
};

// ─── Overview Summary ─────────────────────────────────────────────────────────

export const getAnalyticsSummary = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000);

  try {
    const [
      totalVisitors, totalPageViews,
      newVisitors, mobileCount,
      topPages, topCountries,
      legacyEvents, contentEvents,
      dailyData, recentInquiries,
      totalSessions, totalContentEvents,
      resumeDownloads, contactSubmits,
    ] = await Promise.all([
      prisma.visitor.count({ where: { firstSeen: { gte: since } } }),
      prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      prisma.visitor.count({ where: { firstSeen: { gte: since } } }),
      prisma.visitor.count({ where: { isMobile: true, firstSeen: { gte: since } } }),
      prisma.pageView.groupBy({ by: ['page'], where: { createdAt: { gte: since } }, _count: { _all: true }, orderBy: { _count: { page: 'desc' } }, take: 10 }),
      prisma.visitor.groupBy({ by: ['country'], where: { firstSeen: { gte: since }, country: { not: null } }, _count: { _all: true }, orderBy: { _count: { country: 'desc' } }, take: 10 }),
      prisma.analyticsEvent.groupBy({ by: ['type'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
      prisma.contentEvent.groupBy({ by: ['eventType'], where: { createdAt: { gte: since } }, _count: { _all: true } }),
      prisma.$queryRaw<Array<{ day: string; visitors: bigint; pageviews: bigint }>>`
        SELECT
          to_char("firstSeen"::date, 'YYYY-MM-DD') as day,
          COUNT(DISTINCT v.id)::bigint as visitors,
          COUNT(DISTINCT pv.id)::bigint as pageviews
        FROM "Visitor" v
        LEFT JOIN "PageView" pv ON pv."visitorId" = v.id AND pv."createdAt" >= ${since}
        WHERE v."firstSeen" >= ${since}
        GROUP BY v."firstSeen"::date
        ORDER BY day ASC
        LIMIT 30`,
      prisma.inquiry.findMany({
        take: 5, orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, subject: true, status: true, serviceType: true, createdAt: true },
      }),
      prisma.visitorSession.count({ where: { sessionStart: { gte: since } } }),
      prisma.contentEvent.count({ where: { createdAt: { gte: since } } }),
      // Resume downloads: prefer new events, fall back to legacy
      prisma.contentEvent.count({ where: { eventType: 'RESUME_DOWNLOAD', createdAt: { gte: since } } })
        .then(async n => n > 0 ? n : prisma.analyticsEvent.count({ where: { type: 'RESUME_DOWNLOAD', createdAt: { gte: since } } })),
      prisma.contentEvent.count({ where: { eventType: 'INQUIRY_SUBMIT', createdAt: { gte: since } } })
        .then(async n => n > 0 ? n : prisma.analyticsEvent.count({ where: { type: 'CONTACT_SUBMIT', createdAt: { gte: since } } })),
    ]);

    // Merge event breakdown: legacy EventType + new ContentEventType
    const eventMap: Record<string, number> = {};
    legacyEvents.forEach(e => { eventMap[e.type] = (eventMap[e.type] ?? 0) + e._count._all; });
    contentEvents.forEach(e => { eventMap[e.eventType] = (eventMap[e.eventType] ?? 0) + e._count._all; });
    const mergedEventBreakdown = Object.entries(eventMap)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      summary: {
        totalVisitors, totalPageViews, resumeDownloads, contactSubmits, newVisitors,
        totalSessions, totalContentEvents,
        mobilePercent: totalVisitors > 0 ? Math.round((mobileCount / totalVisitors) * 100) : 0,
        avgPagesPerVisitor: totalVisitors > 0 ? +(totalPageViews / totalVisitors).toFixed(1) : 0,
      },
      topPages: topPages.map(r => ({ page: r.page, views: r._count._all })),
      topCountries: topCountries.map(r => ({ country: r.country ?? 'Unknown', count: r._count._all })),
      eventBreakdown: mergedEventBreakdown,
      dailyData: (dailyData as Array<{ day: string; visitors: bigint; pageviews: bigint }>).map(r => ({
        day: r.day, visitors: Number(r.visitors), pageviews: Number(r.pageviews),
      })),
      recentInquiries,
    };
  } catch (err) {
    logger.error('Analytics summary error', err);
    return null;
  }
};

// ─── Blog Analytics ───────────────────────────────────────────────────────────

export const getBlogAnalytics = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000);
  try {
    const [topBlogs, avgEngagement, sources, countries, repeatVisitorResult] = await Promise.all([
      prisma.contentEvent.groupBy({
        by: ['contentId', 'contentTitle'],
        where: { contentType: 'BLOG', eventType: 'BLOG_VIEW', createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { contentId: 'desc' } },
        take: 10,
      }),
      prisma.$queryRaw<Array<{ contentId: string; contentTitle: string; avgDuration: number; viewCount: bigint }>>`
        SELECT
          "contentId",
          "contentTitle",
          AVG((metadata->>'duration')::float) as "avgDuration",
          COUNT(*)::bigint as "viewCount"
        FROM "ContentEvent"
        WHERE "contentType" = 'BLOG'
          AND "eventType" = 'BLOG_VIEW'
          AND "createdAt" >= ${since}
          AND metadata->>'duration' IS NOT NULL
        GROUP BY "contentId", "contentTitle"
        ORDER BY "viewCount" DESC
        LIMIT 10`,
      prisma.$queryRaw<Array<{ referrer: string; count: bigint }>>`
        SELECT COALESCE(v.referrer, 'Direct') as referrer, COUNT(DISTINCT v.id)::bigint as count
        FROM "ContentEvent" ce
        JOIN "Visitor" v ON v.id = ce."visitorId"
        WHERE ce."contentType" = 'BLOG' AND ce."createdAt" >= ${since}
        GROUP BY v.referrer
        ORDER BY count DESC
        LIMIT 8`,
      prisma.$queryRaw<Array<{ country: string; count: bigint }>>`
        SELECT v.country, COUNT(DISTINCT v.id)::bigint as count
        FROM "ContentEvent" ce
        JOIN "Visitor" v ON v.id = ce."visitorId"
        WHERE ce."contentType" = 'BLOG' AND ce."createdAt" >= ${since}
          AND v.country IS NOT NULL
        GROUP BY v.country
        ORDER BY count DESC
        LIMIT 8`,
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count FROM (
          SELECT "visitorId"
          FROM "ContentEvent"
          WHERE "contentType" = 'BLOG' AND "createdAt" >= ${since}
          GROUP BY "visitorId"
          HAVING COUNT(*) > 1
        ) t`,
    ]);

    return {
      topBlogs: topBlogs.map(b => ({ contentId: b.contentId ?? '', title: b.contentTitle ?? '', views: b._count._all })),
      avgEngagement: (avgEngagement as any[]).map(r => ({
        contentId: r.contentId, title: r.contentTitle,
        avgDuration: Math.round(Number(r.avgDuration ?? 0)),
        viewCount: Number(r.viewCount),
      })),
      sources: (sources as any[]).map(r => ({ referrer: r.referrer, count: Number(r.count) })),
      countries: (countries as any[]).map(r => ({ country: r.country, count: Number(r.count) })),
      repeatVisitors: Number((repeatVisitorResult as any[])[0]?.count ?? 0),
    };
  } catch (err) {
    logger.error('Blog analytics error', err);
    return null;
  }
};

// ─── Project Analytics ────────────────────────────────────────────────────────

export const getProjectAnalytics = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000);
  try {
    const [topViews, githubClicks, demoClicks] = await Promise.all([
      prisma.contentEvent.groupBy({
        by: ['contentId', 'contentTitle'],
        where: { contentType: 'PROJECT', eventType: 'PROJECT_VIEW', createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { contentId: 'desc' } },
        take: 10,
      }),
      prisma.contentEvent.groupBy({
        by: ['contentId', 'contentTitle'],
        where: { contentType: 'PROJECT', eventType: 'PROJECT_GITHUB_CLICK', createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { contentId: 'desc' } },
      }),
      prisma.contentEvent.groupBy({
        by: ['contentId', 'contentTitle'],
        where: { contentType: 'PROJECT', eventType: 'PROJECT_DEMO_CLICK', createdAt: { gte: since } },
        _count: { _all: true },
        orderBy: { _count: { contentId: 'desc' } },
      }),
    ]);

    const viewMap: Record<string, { title: string; views: number; github: number; demo: number }> = {};
    topViews.forEach(p => {
      const k = p.contentId ?? 'unknown';
      viewMap[k] = { title: p.contentTitle ?? k, views: p._count._all, github: 0, demo: 0 };
    });
    githubClicks.forEach(p => {
      const k = p.contentId ?? 'unknown';
      if (!viewMap[k]) viewMap[k] = { title: p.contentTitle ?? k, views: 0, github: 0, demo: 0 };
      viewMap[k].github = p._count._all;
    });
    demoClicks.forEach(p => {
      const k = p.contentId ?? 'unknown';
      if (!viewMap[k]) viewMap[k] = { title: p.contentTitle ?? k, views: 0, github: 0, demo: 0 };
      viewMap[k].demo = p._count._all;
    });

    return {
      totalViews: topViews.reduce((s, r) => s + r._count._all, 0),
      totalGithubClicks: githubClicks.reduce((s, r) => s + r._count._all, 0),
      totalDemoClicks: demoClicks.reduce((s, r) => s + r._count._all, 0),
      projects: Object.entries(viewMap).map(([id, v]) => ({
        contentId: id, ...v,
        githubClickRate: v.views > 0 ? +((v.github / v.views) * 100).toFixed(1) : 0,
        demoClickRate: v.views > 0 ? +((v.demo / v.views) * 100).toFixed(1) : 0,
      })),
    };
  } catch (err) {
    logger.error('Project analytics error', err);
    return null;
  }
};

// ─── Visitor Insights ─────────────────────────────────────────────────────────

export const getVisitorInsights = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000);
  try {
    const [topCountries, topBrowsers, topDevices, topOS, sessionStats, recentSessions] = await Promise.all([
      prisma.visitor.groupBy({ by: ['country'], where: { firstSeen: { gte: since }, country: { not: null } }, _count: { _all: true }, orderBy: { _count: { country: 'desc' } }, take: 10 }),
      prisma.visitor.groupBy({ by: ['browser'], where: { firstSeen: { gte: since }, browser: { not: null } }, _count: { _all: true }, orderBy: { _count: { browser: 'desc' } }, take: 8 }),
      prisma.visitor.groupBy({ by: ['device'], where: { firstSeen: { gte: since }, device: { not: null } }, _count: { _all: true }, orderBy: { _count: { device: 'desc' } }, take: 6 }),
      prisma.visitor.groupBy({ by: ['os'], where: { firstSeen: { gte: since }, os: { not: null } }, _count: { _all: true }, orderBy: { _count: { os: 'desc' } }, take: 8 }),
      prisma.$queryRaw<[{ avgDuration: number; avgPages: number; bounceCount: bigint; totalSessions: bigint }]>`
        SELECT
          AVG("totalDuration") as "avgDuration",
          AVG("pageCount") as "avgPages",
          COUNT(CASE WHEN "pageCount" = 1 THEN 1 END)::bigint as "bounceCount",
          COUNT(*)::bigint as "totalSessions"
        FROM "VisitorSession"
        WHERE "sessionStart" >= ${since}`,
      prisma.visitorSession.findMany({
        where: { sessionStart: { gte: since } },
        orderBy: { sessionStart: 'desc' },
        take: 10,
        select: {
          id: true, locationCountry: true, locationCity: true, browser: true,
          operatingSystem: true, entryPage: true, exitPage: true,
          pageCount: true, totalDuration: true, totalEvents: true,
          navigationPath: true, sessionStart: true,
        },
      }),
    ]);

    const stats = (sessionStats as any[])[0] ?? {};
    return {
      topCountries: topCountries.map(r => ({ country: r.country ?? 'Unknown', count: r._count._all })),
      topBrowsers: topBrowsers.map(r => ({ browser: r.browser ?? 'Unknown', count: r._count._all })),
      topDevices: topDevices.map(r => ({ device: r.device ?? 'Unknown', count: r._count._all })),
      topOS: topOS.map(r => ({ os: r.os ?? 'Unknown', count: r._count._all })),
      sessionStats: {
        avgDuration: Math.round(Number(stats.avgDuration ?? 0)),
        avgPages: +Number(stats.avgPages ?? 0).toFixed(1),
        totalSessions: Number(stats.totalSessions ?? 0),
        bounceRate: Number(stats.totalSessions) > 0
          ? +((Number(stats.bounceCount) / Number(stats.totalSessions)) * 100).toFixed(1)
          : 0,
      },
      recentSessions,
    };
  } catch (err) {
    logger.error('Visitor insights error', err);
    return null;
  }
};

import { prisma } from '../config/prisma.js';

export const logRequest = async (entry: {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  ip?: string;
  userAgent?: string;
  userId?: string;
  errorMessage?: string;
}) => {
  // fire-and-forget, never block a request
  prisma.apiLog.create({ data: entry }).catch(() => {});
};

export const getDiagnostics = async (hours = 24) => {
  const since = new Date(Date.now() - hours * 3_600_000);
  const [
    totalRequests, errorCount, slowCount,
    topPaths, recentErrors, statusBreakdown,
    avgDuration, p95Duration,
  ] = await Promise.all([
    prisma.apiLog.count({ where: { createdAt: { gte: since } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: since }, statusCode: { gte: 400 } } }),
    prisma.apiLog.count({ where: { createdAt: { gte: since }, durationMs: { gte: 1000 } } }),
    prisma.apiLog.groupBy({
      by: ['path'], where: { createdAt: { gte: since } },
      _count: { _all: true }, _avg: { durationMs: true },
      orderBy: { _count: { path: 'desc' } }, take: 12,
    }),
    prisma.apiLog.findMany({
      where: { createdAt: { gte: since }, statusCode: { gte: 400 } },
      orderBy: { createdAt: 'desc' }, take: 20,
      select: { id: true, method: true, path: true, statusCode: true, durationMs: true, errorMessage: true, ip: true, createdAt: true },
    }),
    prisma.apiLog.groupBy({
      by: ['statusCode'], where: { createdAt: { gte: since } },
      _count: { _all: true }, orderBy: { _count: { statusCode: 'desc' } },
    }),
    prisma.$queryRaw<[{ avg: number }]>`SELECT AVG("durationMs") as avg FROM "ApiLog" WHERE "createdAt" >= ${since}`,
    prisma.$queryRaw<[{ p95: number }]>`SELECT PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY "durationMs") as p95 FROM "ApiLog" WHERE "createdAt" >= ${since}`,
  ]);

  const slowRequests = await prisma.apiLog.findMany({
    where: { createdAt: { gte: since }, durationMs: { gte: 500 } },
    orderBy: { durationMs: 'desc' }, take: 10,
    select: { id: true, method: true, path: true, statusCode: true, durationMs: true, createdAt: true },
  });

  return {
    overview: {
      totalRequests,
      errorCount,
      errorRate: totalRequests > 0 ? +((errorCount / totalRequests) * 100).toFixed(1) : 0,
      slowCount,
      avgDurationMs: Math.round(Number((avgDuration as any)[0]?.avg ?? 0)),
      p95DurationMs: Math.round(Number((p95Duration as any)[0]?.p95 ?? 0)),
    },
    topPaths: topPaths.map(r => ({
      path: r.path, count: r._count._all,
      avgMs: Math.round(Number(r._avg.durationMs ?? 0)),
    })),
    statusBreakdown: statusBreakdown.map(r => ({ statusCode: r.statusCode, count: r._count._all })),
    recentErrors,
    slowRequests,
  };
};

export const getAnalyticsEventLog = async (limit = 50) => {
  return prisma.contentEvent.findMany({
    orderBy: { createdAt: 'desc' }, take: limit,
    select: { id: true, eventType: true, contentType: true, contentId: true, contentTitle: true, pageUrl: true, createdAt: true },
  });
};

export const getNavFlows = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000);
  const sessions = await prisma.visitorSession.findMany({
    where: { sessionStart: { gte: since }, pageCount: { gte: 2 } },
    select: { navigationPath: true, pageCount: true, totalEvents: true },
  });
  // Count 2-step transitions
  const transitions: Record<string, number> = {};
  sessions.forEach(s => {
    const path = s.navigationPath;
    for (let i = 0; i < path.length - 1; i++) {
      const key = `${path[i]} → ${path[i + 1]}`;
      transitions[key] = (transitions[key] ?? 0) + 1;
    }
  });
  const topFlows = Object.entries(transitions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([flow, count]) => ({ flow, count }));

  // Count entry pages
  const entries: Record<string, number> = {};
  sessions.forEach(s => {
    const ep = s.navigationPath[0];
    if (ep) entries[ep] = (entries[ep] ?? 0) + 1;
  });
  const topEntries = Object.entries(entries).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, count]) => ({ page, count }));

  // Drop-off: last page in session
  const exits: Record<string, number> = {};
  sessions.forEach(s => {
    const ep = s.navigationPath[s.navigationPath.length - 1];
    if (ep) exits[ep] = (exits[ep] ?? 0) + 1;
  });
  const topExits = Object.entries(exits).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, count]) => ({ page, count }));

  return { topFlows, topEntries, topExits, sessionCount: sessions.length };
};

export const getSmartInsights = async (days = 30) => {
  const since = new Date(Date.now() - days * 86_400_000);
  const prev = new Date(Date.now() - days * 2 * 86_400_000);
  const [
    curVisitors, prevVisitors,
    topBlog, topProject,
    topCountry, topDevice,
    resumeDownloads, inquirySubmits,
  ] = await Promise.all([
    prisma.visitor.count({ where: { firstSeen: { gte: since } } }),
    prisma.visitor.count({ where: { firstSeen: { gte: prev, lt: since } } }),
    prisma.contentEvent.groupBy({
      by: ['contentId', 'contentTitle'],
      where: { contentType: 'BLOG', eventType: 'BLOG_VIEW', createdAt: { gte: since } },
      _count: { _all: true }, orderBy: { _count: { contentId: 'desc' } }, take: 1,
    }),
    prisma.contentEvent.groupBy({
      by: ['contentId', 'contentTitle'],
      where: { contentType: 'PROJECT', eventType: 'PROJECT_VIEW', createdAt: { gte: since } },
      _count: { _all: true }, orderBy: { _count: { contentId: 'desc' } }, take: 1,
    }),
    prisma.visitor.groupBy({
      by: ['country'], where: { firstSeen: { gte: since }, country: { not: null } },
      _count: { _all: true }, orderBy: { _count: { country: 'desc' } }, take: 1,
    }),
    prisma.visitor.groupBy({
      by: ['device'], where: { firstSeen: { gte: since }, device: { not: null } },
      _count: { _all: true }, orderBy: { _count: { device: 'desc' } }, take: 1,
    }),
    prisma.contentEvent.count({ where: { eventType: 'RESUME_DOWNLOAD', createdAt: { gte: since } } }),
    prisma.contentEvent.count({ where: { eventType: 'INQUIRY_SUBMIT', createdAt: { gte: since } } }),
  ]);

  const growthPct = prevVisitors > 0 ? Math.round(((curVisitors - prevVisitors) / prevVisitors) * 100) : null;

  const insights: Array<{ type: string; icon: string; title: string; detail: string }> = [];

  if (growthPct !== null) {
    insights.push({
      type: growthPct >= 0 ? 'positive' : 'negative',
      icon: growthPct >= 0 ? '📈' : '📉',
      title: `Traffic ${growthPct >= 0 ? 'up' : 'down'} ${Math.abs(growthPct)}%`,
      detail: `${curVisitors} visitors vs ${prevVisitors} in the previous ${days}-day period.`,
    });
  }

  if (topBlog[0]) {
    insights.push({
      type: 'info', icon: '✍️',
      title: `Top blog: "${topBlog[0].contentTitle ?? topBlog[0].contentId}"`,
      detail: `${topBlog[0]._count._all} views in the last ${days} days.`,
    });
  }

  if (topProject[0]) {
    insights.push({
      type: 'info', icon: '🗂',
      title: `Top project: "${topProject[0].contentTitle ?? topProject[0].contentId}"`,
      detail: `${topProject[0]._count._all} views in the last ${days} days.`,
    });
  }

  if (topCountry[0]) {
    insights.push({
      type: 'info', icon: '🌍',
      title: `Top audience: ${topCountry[0].country}`,
      detail: `${topCountry[0]._count._all} visitors from ${topCountry[0].country}.`,
    });
  }

  if (topDevice[0]) {
    insights.push({
      type: 'info', icon: topDevice[0].device === 'mobile' ? '📱' : '🖥',
      title: `Most visitors use ${topDevice[0].device ?? 'desktop'}`,
      detail: `${topDevice[0]._count._all} sessions from ${topDevice[0].device} devices.`,
    });
  }

  if (resumeDownloads > 0) {
    insights.push({
      type: 'positive', icon: '⬇',
      title: `${resumeDownloads} resume download${resumeDownloads > 1 ? 's' : ''}`,
      detail: `Your resume was downloaded ${resumeDownloads} times in the last ${days} days.`,
    });
  }

  if (inquirySubmits > 0) {
    insights.push({
      type: 'positive', icon: '📬',
      title: `${inquirySubmits} new inquir${inquirySubmits > 1 ? 'ies' : 'y'}`,
      detail: `${inquirySubmits} contact form submission${inquirySubmits > 1 ? 's' : ''} received.`,
    });
  }

  return { insights, period: days };
};

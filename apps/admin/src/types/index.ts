export interface Profile {
  id: string;
  name: string;
  title: string;
  bio: string;
  bioShort: string;
  avatarUrl?: string;
  email: string;
  phone?: string;
  location?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  skills: string[];
  techStack: string[];
  yearsExp: number;
  projectCount: number;
  clientCount: number;
  available: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDesc?: string;
  techStack: string[];
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  featured: boolean;
  order: number;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags: string[];
  published: boolean;
  readingTime: number;
  views: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  features: string[];
  price: string;
  priceNote?: string;
  tier: string;
  popular: boolean;
  ctaLabel: string;
  order: number;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  avatarUrl?: string;
  linkedinUrl?: string;
  rating: number;
  featured: boolean;
  order: number;
}

export interface Resume {
  id: string;
  fileName: string;
  fileUrl: string;
  version: string;
  isActive: boolean;
  downloadCount: number;
  createdAt: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  serviceType?: string;
  status: 'UNREAD' | 'READ' | 'REPLIED' | 'ARCHIVED';
  ipAddress?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface AnalyticsSummary {
  summary: {
    totalVisitors: number;
    totalPageViews: number;
    resumeDownloads: number;
    contactSubmits: number;
    newVisitors: number;
    totalSessions: number;
    totalContentEvents: number;
    mobilePercent: number;
    avgPagesPerVisitor: number;
  };
  topPages: Array<{ page: string; views: number }>;
  topCountries: Array<{ country: string; count: number }>;
  eventBreakdown: Array<{ type: string; count: number }>;
  dailyData: Array<{ day: string; visitors: number; pageviews: number }>;
  recentInquiries: Partial<Inquiry>[];
}

export interface BlogAnalytics {
  topBlogs: Array<{ contentId: string; title: string; views: number }>;
  avgEngagement: Array<{ contentId: string; title: string; avgDuration: number; viewCount: number }>;
  sources: Array<{ referrer: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  repeatVisitors: number;
}

export interface ProjectAnalytics {
  totalViews: number;
  totalGithubClicks: number;
  totalDemoClicks: number;
  projects: Array<{
    contentId: string;
    title: string;
    views: number;
    github: number;
    demo: number;
    githubClickRate: number;
    demoClickRate: number;
  }>;
}

export interface VisitorSession {
  id: string;
  locationCountry?: string;
  locationCity?: string;
  browser?: string;
  operatingSystem?: string;
  entryPage?: string;
  exitPage?: string;
  pageCount: number;
  totalDuration?: number;
  totalEvents: number;
  navigationPath: string[];
  sessionStart: string;
}

export interface VisitorInsights {
  topCountries: Array<{ country: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
  topOS: Array<{ os: string; count: number }>;
  sessionStats: {
    avgDuration: number;
    avgPages: number;
    totalSessions: number;
    bounceRate: number;
  };
  recentSessions: VisitorSession[];
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  category: string;
  metadata?: Record<string, unknown>;
  updatedBy?: string;
  updatedAt: string;
}

export interface ContentVersionMeta {
  id: string;
  version: number;
  title: string;
  changedBy?: string;
  changeNote?: string;
  createdAt: string;
}

export interface ContentVersionFull extends ContentVersionMeta {
  contentType: string;
  contentId: string;
  snapshot: Record<string, unknown>;
}

export interface ActiveVisitorSummary {
  count: number;
  pages: Array<{ page: string; count: number }>;
  countries: Array<{ country: string; count: number }>;
  visitors: Array<{ sessionId: string; currentPage: string; country?: string; device?: string; browser?: string; lastPing: string }>;
}

export interface SmartInsight {
  type: 'positive' | 'negative' | 'info';
  icon: string;
  title: string;
  detail: string;
}

export interface NavFlow {
  topFlows: Array<{ flow: string; count: number }>;
  topEntries: Array<{ page: string; count: number }>;
  topExits: Array<{ page: string; count: number }>;
  sessionCount: number;
}

export interface DiagnosticsData {
  overview: {
    totalRequests: number;
    errorCount: number;
    errorRate: number;
    slowCount: number;
    avgDurationMs: number;
    p95DurationMs: number;
  };
  topPaths: Array<{ path: string; count: number; avgMs: number }>;
  statusBreakdown: Array<{ statusCode: number; count: number }>;
  recentErrors: Array<{ id: string; method: string; path: string; statusCode: number; durationMs: number; errorMessage?: string; ip?: string; createdAt: string }>;
  slowRequests: Array<{ id: string; method: string; path: string; statusCode: number; durationMs: number; createdAt: string }>;
}

export interface SessionDetail {
  id: string;
  visitorId: string;
  ipAddress?: string;
  browser?: string;
  operatingSystem?: string;
  locationCountry?: string;
  locationCity?: string;
  entryPage?: string;
  exitPage?: string;
  sessionStart: string;
  sessionEnd?: string;
  totalDuration?: number;
  totalEvents: number;
  pageCount: number;
  navigationPath: string[];
  visitor: {
    sessionId: string;
    country?: string;
    city?: string;
    browser?: string;
    os?: string;
    device?: string;
    isMobile: boolean;
    referrer?: string;
  };
  contentEvents: Array<{
    id: string;
    eventType: string;
    contentType: string;
    contentId?: string;
    contentTitle?: string;
    pageUrl?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
  }>;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface ServicePlan {
  id: string;
  name: string;
  description: string;
  price: number;       // cents
  priceLabel: string;
  features: string[];
  popular: boolean;
  badge?: string;
}

export interface Payment {
  id: string;
  stripeSessionId: string;
  amount: number;  // cents
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  type: 'service' | 'custom' | 'donation';
  paymentSource: 'direct' | 'inquiry';
  planId?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  serviceName?: string;
  inquiryId?: string;
  createdAt: string;
}

export interface PaymentAnalytics {
  totalRevenue: number;
  totalCount: number;
  avgOrderValue: number;
  byType: Array<{ type: string; _sum: { amount: number }; _count: { id: number } }>;
  bySource: Array<{ paymentSource: string; _sum: { amount: number }; _count: { id: number } }>;
  byDay: Array<{ day: string; revenue: number; count: number }>;
  recent: Payment[];
  webhookErrors: number;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface ThemeSetting {
  id: string;
  mode: string;
  primaryColor: string;
  accentColor: string;
  fontSans: string;
  fontMono: string;
  fontDisplay: string;
  borderRadius: string;
  animationSpeed: string;
  customCss?: string;
}

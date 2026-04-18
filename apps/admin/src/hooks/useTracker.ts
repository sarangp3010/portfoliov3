import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { track } from '../api/index';

// ─── Persistent identifiers ───────────────────────────────────────────────────

const getSessionId = (): string => {
  let id = sessionStorage.getItem('_sid');
  if (!id) { id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; sessionStorage.setItem('_sid', id); }
  return id;
};

const getDeviceId = (): string => {
  let id = localStorage.getItem('_did');
  if (!id) { id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`; localStorage.setItem('_did', id); }
  return id;
};

// ─── Base payload builder ─────────────────────────────────────────────────────

const base = () => ({
  sessionId: getSessionId(),
  deviceId: getDeviceId(),
  referrer: document.referrer || undefined,
});

// ─── Core page-view hook (call once at app root) ──────────────────────────────
// Fix 6: module-level Set prevents double PAGE_VIEW from React StrictMode
//        (StrictMode mounts→unmounts→remounts each component in dev)
// Fix 7: admin routes are skipped so /admin/* navigation never pollutes
//        visitor analytics
const _trackedPaths = new Set<string>();

export const useTracker = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Skip all admin routes — admin interactions are tracked separately
    if (pathname.startsWith('/admin')) return;
    // Deduplicate: only fire once per path per page-load cycle
    if (_trackedPaths.has(pathname)) return;
    _trackedPaths.add(pathname);
    track({ ...base(), page: pathname, title: document.title, contentEventType: 'PAGE_VIEW' });
    // Clear the guard when the effect re-runs (i.e. the user navigates away)
    return () => { _trackedPaths.delete(pathname); };
  }, [pathname]);
};

// ─── Blog tracker ─────────────────────────────────────────────────────────────

// Tracks which blog slugs have already fired BLOG_VIEW this page-session
// Prevents double-fire caused by React StrictMode mount→unmount→remount in dev
const _viewedSlugs = new Set<string>();

export const useBlogTracker = (slug: string, title: string) => {
  const startRef = useRef(Date.now());
  const scrollRef = useRef(0);
  const sentRef = useRef(false);

  useEffect(() => {
    startRef.current = Date.now();
    scrollRef.current = 0;

    const onScroll = () => {
      const el = document.documentElement;
      const pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      if (pct > scrollRef.current) scrollRef.current = pct;
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Only fire BLOG_VIEW once per slug per page-load
    if (!_viewedSlugs.has(slug)) {
      _viewedSlugs.add(slug);
      sentRef.current = false;
      track({ ...base(), page: `/blog/${slug}`, contentEventType: 'BLOG_VIEW', contentType: 'BLOG', contentId: slug, contentTitle: title });
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (!sentRef.current) {
        sentRef.current = true;
        const duration = Math.round((Date.now() - startRef.current) / 1000);
        track({ ...base(), page: `/blog/${slug}`, contentEventType: 'BLOG_SCROLL', contentType: 'BLOG', contentId: slug, contentTitle: title, metadata: { scrollDepth: scrollRef.current, duration } });
      }
    };
  }, [slug, title]);
};

// ─── Project tracker ──────────────────────────────────────────────────────────

export const useProjectTracker = (projectId: string, title: string) => {
  useEffect(() => {
    track({ ...base(), page: `/projects/${projectId}`, contentEventType: 'PROJECT_VIEW', contentType: 'PROJECT', contentId: projectId, contentTitle: title });
  }, [projectId, title]);
};

// ─── Generic event functions (call from onClick handlers) ─────────────────────

export const trackEvent = (
  contentEventType: string,
  opts: {
    page?: string;
    contentType?: string;
    contentId?: string;
    contentTitle?: string;
    target?: string;
    metadata?: Record<string, unknown>;
    legacyEventType?: string;
  } = {},
) => {
  track({
    ...base(),
    page: opts.page ?? window.location.pathname,
    contentEventType,
    contentType: opts.contentType,
    contentId: opts.contentId,
    contentTitle: opts.contentTitle,
    target: opts.target,
    metadata: opts.metadata,
    ...(opts.legacyEventType ? { eventType: opts.legacyEventType } : {}),
  });
};

// ─── Specific trackers ────────────────────────────────────────────────────────

export const trackBlogLinkClick = (slug: string, title: string, href: string) =>
  trackEvent('BLOG_LINK_CLICK', { contentType: 'BLOG', contentId: slug, contentTitle: title, target: href });

export const trackProjectGithubClick = (projectId: string, title: string, url: string) => {
  trackEvent('PROJECT_GITHUB_CLICK', { contentType: 'PROJECT', contentId: projectId, contentTitle: title, target: url, legacyEventType: 'PROJECT_CLICK' });
};

export const trackProjectDemoClick = (projectId: string, title: string, url: string) => {
  trackEvent('PROJECT_DEMO_CLICK', { contentType: 'PROJECT', contentId: projectId, contentTitle: title, target: url, legacyEventType: 'EXTERNAL_LINK' });
};

export const trackResumeDownload = () => {
  trackEvent('RESUME_DOWNLOAD', { page: '/resume', contentType: 'RESUME', legacyEventType: 'RESUME_DOWNLOAD' });
};

export const trackResumePageVisit = () =>
  trackEvent('RESUME_PAGE_VISIT', { page: '/resume', contentType: 'RESUME' });

export const trackServicePageVisit = () =>
  trackEvent('SERVICE_PAGE_VISIT', { page: '/services', contentType: 'SERVICE' });

export const trackServiceInquiryOpen = (serviceTitle?: string) =>
  trackEvent('SERVICE_INQUIRY_OPEN', { page: '/services', contentType: 'SERVICE', contentTitle: serviceTitle });

export const trackInquirySubmit = () => {
  trackEvent('INQUIRY_SUBMIT', { legacyEventType: 'CONTACT_SUBMIT' });
};

export const trackButtonClick = (label: string, page?: string) =>
  trackEvent('BUTTON_CLICK', { page: page ?? window.location.pathname, target: label, legacyEventType: 'BUTTON_CLICK' });

export const trackExternalLink = (href: string, label?: string) =>
  trackEvent('EXTERNAL_LINK', { target: href, contentTitle: label, legacyEventType: 'EXTERNAL_LINK' });

export const trackNavigation = (to: string, label: string) =>
  trackEvent('BUTTON_CLICK', { target: to, contentTitle: label, metadata: { action: 'navigation' } });

export const trackThemeChange = (theme: string) =>
  trackEvent('BUTTON_CLICK', { target: 'theme', metadata: { theme, action: 'theme_change' } });

export const trackSearch = (query: string, resultsCount?: number) =>
  trackEvent('BUTTON_CLICK', { target: 'search', metadata: { query, resultsCount, action: 'search' } });

// Plain function alias — safe to call from onClick handlers (not a hook)
export const trackProjectView = (projectId: string, title: string) => {
  trackEvent('PROJECT_VIEW', { contentType: 'PROJECT', contentId: projectId, contentTitle: title });
};

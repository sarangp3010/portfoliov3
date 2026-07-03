import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SessionDetail } from '../../types/index';
import { Spinner } from '../../components/ui/Spinner';
import {
  useAdminAnalyticsSessionsQuery,
  useAdminSessionTimelineQuery,
} from '../../hooks/queries/useAdminToolingQueries';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDuration = (s?: number | null) => {
  if (!s) return '—';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
};
const fmtTime  = (iso: string) => new Date(iso).toLocaleString();
const fmtDate  = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtRelative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ─── Engagement scoring ───────────────────────────────────────────────────────

const ENGAGEMENT_WEIGHTS: Record<string, number> = {
  INQUIRY_SUBMIT: 10, RESUME_DOWNLOAD: 8, SERVICE_INQUIRY_OPEN: 6,
  PROJECT_GITHUB_CLICK: 5, PROJECT_DEMO_CLICK: 5, BLOG_SCROLL: 4,
  BLOG_VIEW: 3, PROJECT_VIEW: 3, SERVICE_PAGE_VISIT: 2,
  RESUME_PAGE_VISIT: 2, BLOG_LINK_CLICK: 2, EXTERNAL_LINK: 1, PAGE_VIEW: 1,
};

const scoreSession = (events: any[]) =>
  events.reduce((acc, ev) => acc + (ENGAGEMENT_WEIGHTS[ev.eventType] ?? 1), 0);

const engagementLabel = (score: number, events: number) => {
  if (score >= 20 || events >= 12) return { label: 'High', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
  if (score >= 8  || events >= 5)  return { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' };
  return { label: 'Low', color: 'text-slate-500', bg: 'bg-slate-800 border-slate-700' };
};

// ─── Key actions — the events worth highlighting in a summary ────────────────

const KEY_ACTIONS: Record<string, { icon: string; label: string; color: string }> = {
  INQUIRY_SUBMIT:       { icon: '📬', label: 'Sent inquiry',       color: 'text-rose-400' },
  RESUME_DOWNLOAD:      { icon: '⬇',  label: 'Downloaded resume',  color: 'text-emerald-400' },
  SERVICE_INQUIRY_OPEN: { icon: '💬', label: 'Opened service inquiry', color: 'text-purple-400' },
  PROJECT_GITHUB_CLICK: { icon: '🐙', label: 'Viewed GitHub',      color: 'text-yellow-400' },
  PROJECT_DEMO_CLICK:   { icon: '🚀', label: 'Opened live demo',   color: 'text-blue-400' },
  PROJECT_VIEW:         { icon: '🗂',  label: 'Viewed project',     color: 'text-slate-300' },
  BLOG_VIEW:            { icon: '📖', label: 'Read blog post',      color: 'text-slate-300' },
  EXTERNAL_LINK:        { icon: '🌐', label: 'External link',       color: 'text-slate-400' },
};

const EVENT_ICONS: Record<string, string> = {
  PAGE_VIEW: '👁', BLOG_VIEW: '📖', BLOG_SCROLL: '📜', BLOG_LINK_CLICK: '🔗',
  PROJECT_VIEW: '🗂', PROJECT_GITHUB_CLICK: '🐙', PROJECT_DEMO_CLICK: '🚀',
  RESUME_PAGE_VISIT: '📄', RESUME_DOWNLOAD: '⬇', SERVICE_PAGE_VISIT: '💼',
  SERVICE_INQUIRY_OPEN: '💬', INQUIRY_SUBMIT: '📬', BUTTON_CLICK: '👆',
  EXTERNAL_LINK: '🌐', SESSION_END: '🏁',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatPill = ({ label, value, sub }: { label: string; value: string; sub?: string }) => (
  <div className="text-center">
    <p className="text-xl font-bold text-white leading-none">{value}</p>
    {sub && <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>}
    <p className="text-xs text-slate-500 mt-1">{label}</p>
  </div>
);

function SessionCard({ s, onClick }: { s: any; onClick: () => void }) {
  const events = s._count?.contentEvents ?? s.totalEvents ?? 0;
  const score  = scoreSession(s.highlights ?? []);
  const eng    = engagementLabel(score, events);
  const hasInquiry = (s.highlights ?? []).some((e: any) => e.eventType === 'INQUIRY_SUBMIT');
  const hasDownload = (s.highlights ?? []).some((e: any) => e.eventType === 'RESUME_DOWNLOAD');

  return (
    <div
      onClick={onClick}
      className="admin-card p-4 cursor-pointer hover:border-slate-600 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white text-sm font-medium truncate">
              {s.locationCountry ?? s.visitor?.country ?? 'Unknown'} · {s.browser ?? s.visitor?.browser ?? 'Unknown'}
            </span>
            {hasInquiry  && <span className="text-xs bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded border border-rose-500/20">📬 Inquiry</span>}
            {hasDownload && <span className="text-xs bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">⬇ Resume</span>}
          </div>
          <p className="text-slate-500 text-xs mt-0.5">{fmtRelative(s.sessionStart)} · {fmtDate(s.sessionStart)}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded border shrink-0 ${eng.bg} ${eng.color}`}>{eng.label}</span>
      </div>

      <div className="flex items-center gap-5 text-xs text-slate-400 mb-3">
        <span>📄 {s.pageCount} pages</span>
        <span>⚡ {events} events</span>
        <span>⏱ {fmtDuration(s.totalDuration)}</span>
        {s.entryPage && <span className="font-mono text-slate-500 truncate hidden sm:block max-w-[140px]">{s.entryPage}</span>}
      </div>

      {/* Key action highlights */}
      {(s.highlights ?? []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(s.highlights as any[])
            .filter(e => KEY_ACTIONS[e.eventType])
            .slice(0, 5)
            .map((e, i) => {
              const a = KEY_ACTIONS[e.eventType]!;
              return (
                <span key={i} className={`text-[11px] ${a.color} bg-slate-800 px-2 py-0.5 rounded`}>
                  {a.icon} {e.contentTitle ? `${e.contentTitle}` : a.label}
                </span>
              );
            })}
        </div>
      )}
      <div className="text-right mt-2">
        <span className="text-accent text-xs opacity-0 group-hover:opacity-100 transition-opacity">View full session →</span>
      </div>
    </div>
  );
}

function SessionDetail({ detail, onBack }: { detail: SessionDetail; onBack: () => void }) {
  const score = scoreSession(detail.contentEvents ?? []);
  const eng   = engagementLabel(score, detail.totalEvents);

  // Deduplicate consecutive PAGE_VIEWs on same URL for nav path display
  const navPath = detail.navigationPath.filter((p, i, a) => i === 0 || p !== a[i - 1]);

  // Group events into a readable summary
  const blogsPosts  = [...new Set(detail.contentEvents.filter(e => e.eventType === 'BLOG_VIEW').map(e => e.contentTitle).filter(Boolean))];
  const projectsSeen= [...new Set(detail.contentEvents.filter(e => e.eventType === 'PROJECT_VIEW').map(e => e.contentTitle).filter(Boolean))];
  const keyActions  = detail.contentEvents.filter(e => ENGAGEMENT_WEIGHTS[e.eventType] >= 4);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm mb-2 flex items-center gap-1.5 transition-colors">
            ← Back to sessions
          </button>
          <h2 className="text-xl font-bold text-white">Session Detail</h2>
          <p className="text-slate-400 text-sm mt-0.5">{fmtTime(detail.sessionStart)}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded border ${eng.bg} ${eng.color}`}>{eng.label} Engagement</span>
      </div>

      {/* Stats row */}
      <div className="admin-card p-5">
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-6">
          <StatPill label="Duration"   value={fmtDuration(detail.totalDuration)} />
          <StatPill label="Pages"      value={String(detail.pageCount)} />
          <StatPill label="Events"     value={String(detail.totalEvents)} />
          <StatPill label="Eng. Score" value={String(score)} />
          {detail.visitor.country && <StatPill label="Country"  value={detail.visitor.country} />}
          {detail.visitor.browser && <StatPill label="Browser"  value={detail.visitor.browser} />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Key actions taken */}
          {keyActions.length > 0 && (
            <div className="admin-card p-5">
              <h3 className="text-white font-semibold mb-3">Key Actions</h3>
              <div className="space-y-2">
                {keyActions.map((ev, i) => {
                  const a = KEY_ACTIONS[ev.eventType];
                  return (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="text-lg leading-none mt-0.5">{a?.icon ?? EVENT_ICONS[ev.eventType] ?? '•'}</span>
                      <div>
                        <p className={a?.color ?? 'text-slate-300'}>{a?.label ?? ev.eventType}</p>
                        {ev.contentTitle && <p className="text-slate-500 text-xs">{ev.contentTitle}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content consumed */}
          {(blogsPosts.length > 0 || projectsSeen.length > 0) && (
            <div className="admin-card p-5">
              <h3 className="text-white font-semibold mb-3">Content Viewed</h3>
              {blogsPosts.length > 0 && (
                <div className="mb-3">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1.5">Blog Posts</p>
                  {blogsPosts.map((t, i) => <p key={i} className="text-slate-300 text-sm">📖 {t}</p>)}
                </div>
              )}
              {projectsSeen.length > 0 && (
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1.5">Projects</p>
                  {projectsSeen.map((t, i) => <p key={i} className="text-slate-300 text-sm">🗂 {t}</p>)}
                </div>
              )}
            </div>
          )}

          {/* Visitor context */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-3">Visitor</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Country', detail.visitor.country],
                ['Browser', detail.visitor.browser],
                ['OS',      detail.visitor.os],
                ['Device',  detail.visitor.device],
                ['Mobile',  detail.visitor.isMobile ? 'Yes' : null],
                ['Referrer',detail.visitor.referrer],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-500">{k}</span>
                  <span className="text-slate-300 text-right truncate max-w-[160px]">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation path */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-3">Pages Visited</h3>
            <ol className="space-y-2">
              {navPath.map((p, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-500 text-[10px] flex items-center justify-center shrink-0 font-mono">{i + 1}</span>
                  <span className="text-slate-300 font-mono truncate">{p}</span>
                  {i < navPath.length - 1 && (
                    <span className="text-slate-700 text-xs shrink-0">→</span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Right: full timeline */}
        <div className="lg:col-span-2 admin-card p-5">
          <h3 className="text-white font-semibold mb-4">Full Event Timeline</h3>
          {detail.contentEvents.length === 0 ? (
            <p className="text-slate-500 italic text-sm">No events recorded for this session.</p>
          ) : (
            <div className="relative">
              <div className="absolute left-[18px] top-0 bottom-0 w-px bg-slate-800" />
              <div className="space-y-3">
                {detail.contentEvents.map((ev) => {
                  const ka = KEY_ACTIONS[ev.eventType];
                  const isKey = !!ka && ENGAGEMENT_WEIGHTS[ev.eventType] >= 4;
                  return (
                    <div key={ev.id} className="flex gap-3 relative">
                      <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-sm shrink-0 z-10
                        ${isKey ? 'bg-slate-700 border-accent/50' : 'bg-slate-800 border-slate-700'}`}>
                        {EVENT_ICONS[ev.eventType] ?? '•'}
                      </div>
                      <div className="flex-1 pb-1 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-sm font-medium ${isKey ? (ka?.color ?? 'text-slate-200') : 'text-slate-400'}`}>
                            {ka?.label ?? ev.eventType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                          </span>
                          {ev.contentTitle && (
                            <span className="text-slate-500 text-xs truncate max-w-[200px]">{ev.contentTitle}</span>
                          )}
                        </div>
                        {ev.pageUrl && !ev.contentTitle && (
                          <p className="text-slate-600 text-xs font-mono mt-0.5 truncate">{ev.pageUrl}</p>
                        )}
                        {ev.metadata && ev.eventType === 'BLOG_SCROLL' && (
                          <p className="text-slate-600 text-[11px] mt-0.5">
                            {(ev.metadata as any).scrollDepth}% scrolled · {(ev.metadata as any).duration}s
                          </p>
                        )}
                        <p className="text-slate-700 text-[11px] mt-0.5">{fmtDate(ev.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SessionsViewer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('session');

  const [page, setPage]               = useState(1);
  const [filter, setFilter]           = useState<'all' | 'high' | 'inquiry' | 'resume'>('all');
  const { data: sessionsData, isLoading: loading } = useAdminAnalyticsSessionsQuery(page);
  const { data: detail, isLoading: detailLoading } = useAdminSessionTimelineQuery(selectedId);

  const sessions = sessionsData?.sessions ?? [];
  const total = sessionsData?.total ?? 0;
  const pages = sessionsData?.pages ?? 1;

  const selectSession = (id: string) => setSearchParams({ session: id });
  const clearSession  = () => setSearchParams({});

  // Client-side filter
  const filtered = sessions.filter(s => {
    if (filter === 'all') return true;
    const highlights: any[] = s.highlights ?? [];
    if (filter === 'inquiry') return highlights.some(e => e.eventType === 'INQUIRY_SUBMIT');
    if (filter === 'resume')  return highlights.some(e => e.eventType === 'RESUME_DOWNLOAD');
    if (filter === 'high') {
      const score = scoreSession(highlights);
      return engagementLabel(score, s.totalEvents).label === 'High';
    }
    return true;
  });

  // Aggregate quick stats
  const inquiryCount  = sessions.filter(s => (s.highlights ?? []).some((e: any) => e.eventType === 'INQUIRY_SUBMIT')).length;
  const downloadCount = sessions.filter(s => (s.highlights ?? []).some((e: any) => e.eventType === 'RESUME_DOWNLOAD')).length;
  const highEngCount  = sessions.filter(s => engagementLabel(scoreSession(s.highlights ?? []), s.totalEvents).label === 'High').length;
  const avgDuration   = sessions.length
    ? Math.round(sessions.reduce((a, s) => a + (s.totalDuration ?? 0), 0) / sessions.length)
    : 0;

  if (detail) {
    return detailLoading
      ? <div className="flex justify-center py-20"><Spinner /></div>
      : <SessionDetail detail={detail} onBack={clearSession} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Visitor Sessions</h1>
        <p className="text-slate-400 text-sm mt-0.5">{total.toLocaleString()} sessions · click any card to explore</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions',  value: total,         sub: 'this period',   icon: '🧭' },
          { label: 'High Engagement', value: highEngCount,  sub: `${Math.round(highEngCount/Math.max(sessions.length,1)*100)}% of shown`, icon: '🔥' },
          { label: 'Sent Inquiries',  value: inquiryCount,  sub: 'strong intent', icon: '📬' },
          { label: 'Avg Duration',    value: fmtDuration(avgDuration), sub: 'per session', icon: '⏱' },
        ].map(s => (
          <div key={s.label} className="admin-card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold text-white leading-none">{s.value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{s.label}</p>
              <p className="text-slate-600 text-[10px]">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'high', 'inquiry', 'resume'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              filter === f ? 'bg-accent text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}>
            {f === 'all' ? 'All Sessions' : f === 'high' ? '🔥 High Engagement' : f === 'inquiry' ? '📬 Sent Inquiry' : '⬇ Downloaded Resume'}
          </button>
        ))}
        <span className="ml-auto text-slate-600 text-xs self-center">{filtered.length} shown</span>
      </div>

      {/* Session cards */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <>
          {filtered.length === 0 && (
            <div className="admin-card p-12 text-center text-slate-600 italic">No sessions match this filter.</div>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map(s => (
              <SessionCard key={s.id} s={s} onClick={() => selectSession(s.id)} />
            ))}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-slate-500 text-sm">Page {page} of {pages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1}     onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">← Prev</button>
                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

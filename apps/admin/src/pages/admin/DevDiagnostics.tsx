import { useState, useEffect } from 'react';
import { getDiagnostics, getEventLog } from '../../api/index';
import type { DiagnosticsData } from '../../types/index';
import { Spinner } from '../../components/ui/Spinner';

const STATUS_COLOR: Record<string, string> = {
  '2': 'text-emerald-400', '3': 'text-blue-400', '4': 'text-yellow-400', '5': 'text-red-400',
};
const statusColor = (code: number) => STATUS_COLOR[String(code)[0]] ?? 'text-slate-400';

const MetricCard = ({ label, value, sub, danger }: { label: string; value: string | number; sub?: string; danger?: boolean }) => (
  <div className={`admin-card p-5 ${danger ? 'border border-red-500/30' : ''}`}>
    <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-2xl font-bold ${danger ? 'text-red-400' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);

const EVENT_ICONS: Record<string, string> = {
  PAGE_VIEW: '👁', BLOG_VIEW: '📖', PROJECT_VIEW: '🗂', RESUME_DOWNLOAD: '⬇',
  PROJECT_GITHUB_CLICK: '🐙', PROJECT_DEMO_CLICK: '🚀', INQUIRY_SUBMIT: '📬',
  BUTTON_CLICK: '👆', EXTERNAL_LINK: '🌐', SERVICE_INQUIRY_OPEN: '💬',
};

export default function DevDiagnostics() {
  const [hours, setHours] = useState(24);
  const [diag, setDiag] = useState<DiagnosticsData | null>(null);
  const [eventLog, setEventLog] = useState<any[]>([]);
  const [tab, setTab] = useState<'overview' | 'errors' | 'slow' | 'events'>('overview');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [diagR, evR] = await Promise.all([getDiagnostics(hours), getEventLog(100)]);
      setDiag(diagR.data.data ?? null);
      setEventLog(evR.data.data ?? []);
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, [hours]);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'errors', label: `Errors (${diag?.recentErrors.length ?? 0})`, icon: '🔴' },
    { id: 'slow', label: `Slow (${diag?.slowRequests.length ?? 0})`, icon: '🐢' },
    { id: 'events', label: 'Event Log', icon: '📋' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Developer Diagnostics</h1>
          <p className="text-slate-400 text-sm mt-0.5">API performance, error tracking, and event ingestion</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={hours} onChange={e => setHours(Number(e.target.value))} className="admin-input text-sm py-1.5 px-3 w-32">
            {[1, 6, 12, 24, 48, 72].map(h => <option key={h} value={h}>Last {h}h</option>)}
          </select>
          <button onClick={load} className="btn-ghost text-sm px-3 py-1.5">↻ Refresh</button>
        </div>
      </div>

      {/* Metric Cards */}
      {diag && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard label="Total Requests" value={diag.overview.totalRequests.toLocaleString()} />
          <MetricCard label="Error Rate" value={`${diag.overview.errorRate}%`} danger={diag.overview.errorRate > 5} sub={`${diag.overview.errorCount} errors`} />
          <MetricCard label="Avg Response" value={`${diag.overview.avgDurationMs}ms`} danger={diag.overview.avgDurationMs > 500} />
          <MetricCard label="P95 Response" value={`${diag.overview.p95DurationMs}ms`} danger={diag.overview.p95DurationMs > 1000} />
          <MetricCard label="Slow Requests" value={diag.overview.slowCount} danger={diag.overview.slowCount > 10} sub=">1000ms" />
          <MetricCard label="Events Logged" value={eventLog.length} sub="Recent 100" />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800 pb-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.id ? 'border-accent text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && diag && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Paths */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-4">Top API Paths</h3>
            <div className="space-y-2">
              {diag.topPaths.map((p, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-600 w-5 text-right shrink-0">{i + 1}</span>
                  <span className="text-slate-300 font-mono text-xs flex-1 truncate">{p.path}</span>
                  <span className="text-slate-400 text-xs shrink-0">{p.count}x</span>
                  <span className={`text-xs shrink-0 ${p.avgMs > 500 ? 'text-yellow-400' : 'text-slate-500'}`}>{p.avgMs}ms</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-4">Response Status Breakdown</h3>
            <div className="space-y-3">
              {diag.statusBreakdown.map((s, i) => {
                const max = diag.statusBreakdown.reduce((m, r) => Math.max(m, r.count), 1);
                const pct = Math.round((s.count / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={`font-mono font-semibold ${statusColor(s.statusCode)}`}>{s.statusCode}</span>
                      <span className="text-slate-400">{s.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.statusCode < 400 ? 'bg-emerald-500' : s.statusCode < 500 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Errors */}
      {tab === 'errors' && (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider text-left">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Error</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {diag?.recentErrors.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(e.createdAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{e.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-200 truncate max-w-[200px]">{e.path}</td>
                  <td className={`px-4 py-3 font-mono font-semibold text-sm ${statusColor(e.statusCode)}`}>{e.statusCode}</td>
                  <td className={`px-4 py-3 text-xs ${e.durationMs > 500 ? 'text-yellow-400' : 'text-slate-400'}`}>{e.durationMs}ms</td>
                  <td className="px-4 py-3 text-red-400 text-xs truncate max-w-[200px]">{e.errorMessage ?? '—'}</td>
                </tr>
              ))}
              {(!diag?.recentErrors.length) && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-emerald-500 italic">No errors in the selected period 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Slow */}
      {tab === 'slow' && (
        <div className="admin-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-slate-500 text-xs uppercase tracking-wider text-left">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Path</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Duration</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-800">
              {diag?.slowRequests.map(e => (
                <tr key={e.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(e.createdAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-300">{e.method}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-200 truncate max-w-[250px]">{e.path}</td>
                  <td className={`px-4 py-3 font-mono text-sm ${statusColor(e.statusCode)}`}>{e.statusCode}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`text-sm font-semibold ${e.durationMs > 2000 ? 'text-red-400' : e.durationMs > 1000 ? 'text-yellow-400' : 'text-slate-300'}`}>{e.durationMs}ms</span>
                  </td>
                </tr>
              ))}
              {(!diag?.slowRequests.length) && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-emerald-500 italic">No slow requests detected 🚀</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Event Log */}
      {tab === 'events' && (
        <div className="admin-card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <p className="text-slate-400 text-sm">Last {eventLog.length} analytics events</p>
          </div>
          <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
            {eventLog.map(ev => (
              <div key={ev.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-800/20 transition-colors">
                <span className="text-xl w-7 text-center shrink-0">{EVENT_ICONS[ev.eventType] ?? '•'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-200 text-sm font-medium">{ev.eventType}</span>
                    <span className="text-slate-500 text-xs">{ev.contentType}</span>
                    {ev.contentTitle && <span className="text-slate-400 text-xs truncate">— {ev.contentTitle}</span>}
                  </div>
                  {ev.pageUrl && <p className="text-slate-600 font-mono text-[11px] truncate">{ev.pageUrl}</p>}
                </div>
                <span className="text-slate-600 text-xs shrink-0 whitespace-nowrap">{new Date(ev.createdAt).toLocaleTimeString()}</span>
              </div>
            ))}
            {eventLog.length === 0 && (
              <p className="px-5 py-10 text-center text-slate-600 italic">No events ingested yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

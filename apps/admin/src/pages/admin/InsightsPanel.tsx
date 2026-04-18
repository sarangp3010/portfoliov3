import { useState, useEffect, useCallback } from 'react';
import { getSmartInsights, getNavFlows, getActiveVisitors, getAnalyticsSessions } from '../../api/index';
import type { SmartInsight, NavFlow, ActiveVisitorSummary } from '../../types/index';
import { Spinner } from '../../components/ui/Spinner';

const REFRESH_MS = 30_000;

const insightColors: Record<string, string> = {
  positive: 'border-l-emerald-500 bg-emerald-500/5',
  negative: 'border-l-red-500 bg-red-500/5',
  info: 'border-l-accent bg-accent/5',
};

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="admin-card p-5">
    <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value}</p>
    {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
  </div>
);

export default function InsightsPanel() {
  const [days, setDays] = useState(30);
  const [insights, setInsights] = useState<SmartInsight[]>([]);
  const [flows, setFlows] = useState<NavFlow | null>(null);
  const [active, setActive] = useState<ActiveVisitorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [insR, flowR, actR] = await Promise.all([
        getSmartInsights(days),
        getNavFlows(days),
        getActiveVisitors(),
      ]);
      setInsights(insR.data.data?.insights ?? []);
      setFlows(flowR.data.data ?? null);
      setActive(actR.data.data ?? null);
      setLastRefresh(new Date());
    } catch { /* silent */ }
    setLoading(false);
  }, [days]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useEffect(() => {
    const t = setInterval(() => { getActiveVisitors().then(r => setActive(r.data.data ?? null)).catch(() => {}); }, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Spinner /></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Smart Insights</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-generated observations about your portfolio's performance</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={days} onChange={e => setDays(Number(e.target.value))} className="admin-input text-sm py-1.5 px-3 w-36">
            {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>Last {d} days</option>)}
          </select>
          <span className="text-slate-600 text-xs">Refreshed {lastRefresh.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Real-Time Active Visitors */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Active Right Now
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
          <StatCard label="Active Visitors" value={active?.count ?? 0} sub="Last 3 minutes" />
          <StatCard label="Top Page" value={active?.pages[0]?.page ?? '—'} sub={active?.pages[0] ? `${active.pages[0].count} viewer${active.pages[0].count !== 1 ? 's' : ''}` : undefined} />
          <StatCard label="Top Country" value={active?.countries[0]?.country ?? '—'} sub={active?.countries[0] ? `${active.countries[0].count} visitor${active.countries[0].count !== 1 ? 's' : ''}` : undefined} />
          <StatCard label="Active Pages" value={active?.pages.length ?? 0} sub="Unique pages" />
        </div>
        {active && active.count > 0 && (
          <div className="admin-card overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Current Page</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Device</th>
                <th className="px-4 py-3">Browser</th>
                <th className="px-4 py-3">Last Ping</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-800">
                {active.visitors.map(v => (
                  <tr key={v.sessionId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 text-white font-mono text-xs truncate max-w-[200px]">{v.currentPage}</td>
                    <td className="px-4 py-3 text-slate-300">{v.country ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 capitalize">{v.device ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400">{v.browser ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(v.lastPing).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {active?.count === 0 && <p className="text-slate-500 text-sm italic">No active visitors right now.</p>}
      </section>

      {/* Smart Insight Cards */}
      {insights.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">Observations</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {insights.map((ins, i) => (
              <div key={i} className={`admin-card border-l-4 p-5 ${insightColors[ins.type] ?? ''}`}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none">{ins.icon}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{ins.title}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{ins.detail}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Navigation Flows */}
      {flows && (
        <section className="grid lg:grid-cols-3 gap-6">
          {/* Top Journeys */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-4">Top Navigation Flows</h3>
            <p className="text-slate-500 text-xs mb-3">{flows.sessionCount.toLocaleString()} sessions analysed</p>
            <div className="space-y-2">
              {flows.topFlows.slice(0, 10).map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-slate-300 text-xs font-mono truncate flex-1">{f.flow}</span>
                  <span className="text-accent font-semibold text-sm shrink-0">{f.count}</span>
                </div>
              ))}
              {flows.topFlows.length === 0 && <p className="text-slate-600 text-sm italic">Not enough data yet</p>}
            </div>
          </div>

          {/* Entry Pages */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-4">Entry Pages</h3>
            <p className="text-slate-500 text-xs mb-3">Where visitors start their journey</p>
            <div className="space-y-3">
              {flows.topEntries.map((e, i) => {
                const max = flows.topEntries[0]?.count ?? 1;
                const pct = Math.round((e.count / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-mono truncate">{e.page}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{e.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exit Pages */}
          <div className="admin-card p-5">
            <h3 className="text-white font-semibold mb-4">Exit Pages</h3>
            <p className="text-slate-500 text-xs mb-3">Where visitors leave</p>
            <div className="space-y-3">
              {flows.topExits.map((e, i) => {
                const max = flows.topExits[0]?.count ?? 1;
                const pct = Math.round((e.count / max) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300 font-mono truncate">{e.page}</span>
                      <span className="text-slate-400 shrink-0 ml-2">{e.count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

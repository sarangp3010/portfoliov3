import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend,
} from 'recharts';
import {
  AnalyticsSummary, BlogAnalytics, ProjectAnalytics, VisitorInsights, PaymentAnalytics,
} from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { downloadAnalyticsReportPDF } from '../../utils/pdf';
import { useAnalyticsPageQuery } from '../../hooks/queries/useAnalyticsPageQuery';

// ─── Constants ────────────────────────────────────────────────────────────────

const PERIODS = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }];
const TABS = ['Overview', 'Blogs', 'Projects', 'Visitors', 'Revenue'] as const;
type Tab = typeof TABS[number];

const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#60a5fa','#34d399','#f59e0b','#f87171','#94a3b8','#64748b'];
const fmtCurrency = (cents: number) => `$${(cents/100).toLocaleString('en-US', {minimumFractionDigits:0,maximumFractionDigits:0})}`;

const eventLabels: Record<string, string> = {
  PAGE_VIEW: 'Page Views', BUTTON_CLICK: 'Button Clicks', LINK_CLICK: 'Link Clicks',
  RESUME_DOWNLOAD: 'Resume Downloads', PROJECT_CLICK: 'Project Clicks',
  CONTACT_SUBMIT: 'Form Submits', BLOG_READ: 'Blog Reads', SERVICE_INQUIRY: 'Service Inquiries',
  EXTERNAL_LINK: 'External Links', BLOG_VIEW: 'Blog Views', BLOG_SCROLL: 'Blog Scroll',
  BLOG_LINK_CLICK: 'Blog Link Clicks', PROJECT_VIEW: 'Project Views',
  PROJECT_GITHUB_CLICK: 'GitHub Clicks', PROJECT_DEMO_CLICK: 'Demo Clicks',
  RESUME_PAGE_VISIT: 'Resume Page Visits', SERVICE_PAGE_VISIT: 'Service Page Visits',
  SERVICE_INQUIRY_OPEN: 'Inquiry Opens', INQUIRY_SUBMIT: 'Inquiries Submitted',
  SESSION_END: 'Sessions Ended',
};

// ─── Reusable sub-components ──────────────────────────────────────────────────

const StatBox = ({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string }) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-xl">{icon}</span>
    </div>
    <p className="font-display text-3xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900 border border-slate-700 rounded-xl px-4 py-3 shadow-xl text-sm">
      <p className="text-slate-400 mb-1 font-mono text-xs">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="font-semibold" style={{ color: p.color }}>{p.name}: {p.value?.toLocaleString?.() ?? p.value}</p>
      ))}
    </div>
  );
};

const BarList = ({ data, valueKey, labelKey, colorIndex = 0 }: {
  data: any[]; valueKey: string; labelKey: string; colorIndex?: number;
}) => {
  const max = data[0]?.[valueKey] ?? 1;
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-slate-600 font-mono text-xs w-4">{i + 1}</span>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between mb-1.5">
              <span className="text-slate-300 text-sm truncate">{item[labelKey] || '/'}</span>
              <span className="text-slate-500 text-xs shrink-0 ml-2">{item[valueKey]?.toLocaleString()}</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full">
              <div className="h-full rounded-full" style={{ width: `${(item[valueKey] / max) * 100}%`, background: COLORS[(i + colorIndex) % COLORS.length] }} />
            </div>
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-slate-500 text-sm">No data yet.</p>}
    </div>
  );
};

const SectionCard = ({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="card p-6">
    <h2 className="font-display font-bold text-white mb-5">{title}</h2>
    {children}
  </motion.div>
);

const fmtDay = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDuration = (s: number) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ data, days }: { data: AnalyticsSummary; days: number }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Unique Visitors" value={data.summary.totalVisitors} sub={`Last ${days} days`} icon="👥" />
        <StatBox label="Page Views" value={data.summary.totalPageViews} sub={`${data.summary.avgPagesPerVisitor} avg/visitor`} icon="👁" />
        <StatBox label="Total Sessions" value={data.summary.totalSessions ?? 0} icon="🔁" />
        <StatBox label="Content Events" value={data.summary.totalContentEvents ?? 0} icon="⚡" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Resume Downloads" value={data.summary.resumeDownloads} icon="⬇" />
        <StatBox label="Contact Submits" value={data.summary.contactSubmits} icon="📬" />
        <StatBox label="Mobile Users" value={`${data.summary.mobilePercent}%`} sub="Of all visitors" icon="📱" />
        <StatBox label="Total Events" value={data.eventBreakdown.reduce((s, e) => s + e.count, 0)} icon="📊" />
      </div>

      {data.dailyData.length > 0 && (
        <SectionCard title="Visitors Over Time">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.dailyData.map(d => ({ ...d, day: fmtDay(d.day) }))}>
              <defs>
                <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="visitors" name="Visitors" stroke="#6366f1" strokeWidth={2} fill="url(#vGrad)" dot={false} />
              <Area type="monotone" dataKey="pageviews" name="Page Views" stroke="#8b5cf6" strokeWidth={1.5} fill="none" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </SectionCard>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Top Pages" delay={0.05}>
          <BarList data={data.topPages.slice(0, 8)} valueKey="views" labelKey="page" />
        </SectionCard>
        <SectionCard title="Visitor Countries" delay={0.1}>
          {data.topCountries.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.topCountries.slice(0, 8)} layout="vertical">
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="country" tick={{ fill: '#94a3b8', fontSize: 12 }} width={90} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Visitors" radius={[0, 6, 6, 0]}>
                  {data.topCountries.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm">No country data yet.</p>}
        </SectionCard>
      </div>

      {data.eventBreakdown.length > 0 && (
        <SectionCard title="Event Breakdown" delay={0.15}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.eventBreakdown.map((ev, i) => (
              <div key={ev.type} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-400 text-xs truncate">{eventLabels[ev.type] ?? ev.type}</p>
                  <p className="font-display font-bold text-white">{ev.count.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {data.recentInquiries?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800">
            <h2 className="font-display font-bold text-white">Recent Inquiries</h2>
          </div>
          <table className="data-table">
            <thead><tr><th>Name</th><th>Subject</th><th>Service</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {data.recentInquiries.map((inq: any) => (
                <tr key={inq.id}>
                  <td className="text-white font-medium">{inq.name}</td>
                  <td className="max-w-[200px] truncate">{inq.subject}</td>
                  <td>{inq.serviceType ?? '—'}</td>
                  <td><span className={`badge ${inq.status === 'UNREAD' ? 'badge-red' : inq.status === 'REPLIED' ? 'badge-green' : 'badge-blue'}`}>{inq.status}</span></td>
                  <td className="font-mono text-xs">{new Date(inq.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}

// ─── Tab: Blogs ───────────────────────────────────────────────────────────────

function BlogsTab({ data }: { data: BlogAnalytics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox label="Unique Blog Posts Viewed" value={data.topBlogs.length} icon="📝" />
        <StatBox label="Total Blog Views" value={data.topBlogs.reduce((s, b) => s + b.views, 0)} icon="👁" />
        <StatBox label="Repeat Visitors" value={data.repeatVisitors} sub="Viewed 2+ posts" icon="🔄" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Most Viewed Posts">
          <BarList data={data.topBlogs.slice(0, 8)} valueKey="views" labelKey="title" />
        </SectionCard>

        <SectionCard title="Avg Time on Post (seconds)" delay={0.05}>
          {data.avgEngagement.length > 0 ? (
            <div className="space-y-3">
              {data.avgEngagement.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-300 text-sm truncate flex-1 mr-4">{item.title || item.contentId}</span>
                  <div className="text-right shrink-0">
                    <p className="text-accent font-bold font-mono">{fmtDuration(item.avgDuration)}</p>
                    <p className="text-slate-600 text-xs">{item.viewCount} views</p>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-slate-500 text-sm">No engagement data yet. Visitors need to read posts for this to populate.</p>}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Visitor Sources" delay={0.1}>
          <BarList data={data.sources.slice(0, 8)} valueKey="count" labelKey="referrer" colorIndex={2} />
        </SectionCard>
        <SectionCard title="Reader Countries" delay={0.15}>
          <BarList data={data.countries.slice(0, 8)} valueKey="count" labelKey="country" colorIndex={4} />
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Tab: Projects ────────────────────────────────────────────────────────────

function ProjectsTab({ data }: { data: ProjectAnalytics }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatBox label="Total Project Views" value={data.totalViews} icon="🗂" />
        <StatBox label="GitHub Clicks" value={data.totalGithubClicks} icon="⌥" />
        <StatBox label="Demo Clicks" value={data.totalDemoClicks} icon="🚀" />
      </div>

      <SectionCard title="Project Engagement">
        {data.projects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th className="text-right">Views</th>
                  <th className="text-right">GitHub Clicks</th>
                  <th className="text-right">GitHub CTR</th>
                  <th className="text-right">Demo Clicks</th>
                  <th className="text-right">Demo CTR</th>
                </tr>
              </thead>
              <tbody>
                {data.projects.sort((a, b) => b.views - a.views).map((p, i) => (
                  <tr key={i}>
                    <td className="text-white font-medium">{p.title}</td>
                    <td className="text-right font-mono">{p.views}</td>
                    <td className="text-right font-mono">{p.github}</td>
                    <td className="text-right"><span className="text-emerald-400 font-mono text-sm">{p.githubClickRate}%</span></td>
                    <td className="text-right font-mono">{p.demo}</td>
                    <td className="text-right"><span className="text-blue-400 font-mono text-sm">{p.demoClickRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-slate-500 text-sm">No project interaction data yet.</p>}
      </SectionCard>

      {data.projects.length > 0 && (
        <SectionCard title="Views by Project" delay={0.1}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.projects.sort((a, b) => b.views - a.views).slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="title" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="views" name="Views" radius={[6, 6, 0, 0]}>
                {data.projects.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Tab: Visitors ────────────────────────────────────────────────────────────

function VisitorsTab({ data }: { data: VisitorInsights }) {
  const { sessionStats } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Sessions" value={sessionStats.totalSessions} icon="🔁" />
        <StatBox label="Avg Session Time" value={fmtDuration(sessionStats.avgDuration)} icon="⏱" />
        <StatBox label="Avg Pages / Session" value={sessionStats.avgPages} icon="📄" />
        <StatBox label="Bounce Rate" value={`${sessionStats.bounceRate}%`} sub="Single-page visits" icon="↩" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Top Countries">
          <BarList data={data.topCountries.slice(0, 8)} valueKey="count" labelKey="country" />
        </SectionCard>
        <SectionCard title="Browsers" delay={0.05}>
          {data.topBrowsers.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.topBrowsers} dataKey="count" nameKey="browser" cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                  {data.topBrowsers.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={(v) => <span className="text-slate-400 text-xs">{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500 text-sm">No browser data yet.</p>}
        </SectionCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Devices" delay={0.1}>
          <BarList data={data.topDevices} valueKey="count" labelKey="device" colorIndex={3} />
        </SectionCard>
        <SectionCard title="Operating Systems" delay={0.15}>
          <BarList data={data.topOS.slice(0, 6)} valueKey="count" labelKey="os" colorIndex={5} />
        </SectionCard>
      </div>

      {data.recentSessions.length > 0 && (
        <SectionCard title="Recent Visitor Sessions" delay={0.2}>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Country</th><th>Browser</th><th>Entry</th><th>Exit</th>
                  <th className="text-right">Pages</th><th className="text-right">Duration</th><th className="text-right">Events</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.map((s) => (
                  <tr key={s.id}>
                    <td>{s.locationCountry ?? '—'}{s.locationCity ? `, ${s.locationCity}` : ''}</td>
                    <td>{s.browser ?? '—'}{s.operatingSystem ? ` / ${s.operatingSystem}` : ''}</td>
                    <td className="font-mono text-xs text-slate-400">{s.entryPage ?? '—'}</td>
                    <td className="font-mono text-xs text-slate-400">{s.exitPage ?? '—'}</td>
                    <td className="text-right font-mono">{s.pageCount}</td>
                    <td className="text-right font-mono">{s.totalDuration ? fmtDuration(s.totalDuration) : '—'}</td>
                    <td className="text-right font-mono">{s.totalEvents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 text-xs mt-3 font-mono">Showing most recent 10 sessions</p>
        </SectionCard>
      )}
    </div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────

// ─── Tab: Revenue ──────────────────────────────────────────────────────────────

function RevenueTab({ data }: { data: PaymentAnalytics }) {
  const byDay = (data.byDay ?? []).map(d => ({ day: d.day.slice(5), revenue: d.revenue, count: d.count }));
  const byType = (data.byType ?? []).map(t => ({
    name: t.type.charAt(0).toUpperCase() + t.type.slice(1),
    value: t._sum?.amount ?? 0,
  }));
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox label="Total Revenue"   value={fmtCurrency(data.totalRevenue ?? 0)}    sub="completed payments" icon="💰" />
        <StatBox label="Transactions"    value={data.totalCount ?? 0}                   sub="all time"           icon="🧾" />
        <StatBox label="Avg Order"       value={fmtCurrency(data.avgOrderValue ?? 0)}   sub="per transaction"    icon="📊" />
        <StatBox label="Webhook Errors"  value={data.webhookErrors ?? 0}                sub="unprocessed"        icon="⚠️" />
      </div>

      <SectionCard title="Revenue Over Time">
        {byDay.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-8">No payment data yet. Configure Stripe keys to start accepting payments.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byDay}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
              <XAxis dataKey="day" stroke="#475569" tick={{ fill:'#64748b', fontSize:11 }}/>
              <YAxis stroke="#475569" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => `$${(v/100).toFixed(0)}`}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="revenue" name="Revenue ($cents)" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      <div className="grid lg:grid-cols-2 gap-6">
        <SectionCard title="Revenue by Type">
          {byType.length === 0 ? <p className="text-slate-500 text-sm">No data</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b"/>
                <XAxis dataKey="name" stroke="#475569" tick={{ fill:'#64748b', fontSize:11 }}/>
                <YAxis stroke="#475569" tick={{ fill:'#64748b', fontSize:11 }} tickFormatter={v => `$${(v/100).toFixed(0)}`}/>
                <Tooltip content={<CustomTooltip/>}/>
                <Bar dataKey="value" name="Revenue" radius={[6,6,0,0]}>
                  {byType.map((_,i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SectionCard>

        <SectionCard title="Recent Transactions">
          <div className="space-y-2">
            {(data.recent ?? []).slice(0,6).map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm truncate">{p.description || p.type}</p>
                  <p className="text-slate-500 text-xs">{p.customerEmail || '—'}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-white font-mono text-sm">{fmtCurrency(p.amount)}</p>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    p.status === 'COMPLETED' ? 'text-emerald-400 bg-emerald-500/10' :
                    p.status === 'PENDING'   ? 'text-yellow-400 bg-yellow-500/10'  :
                    'text-slate-400 bg-slate-800'
                  }`}>{p.status}</span>
                </div>
              </div>
            ))}
            {!(data.recent?.length) && <p className="text-slate-500 text-sm">No transactions yet.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}


export default function Analytics() {
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<Tab>('Overview');
  const { data, isLoading: loading } = useAnalyticsPageQuery(days);
  const summary = data?.summary ?? null;
  const blogStats = data?.blogStats ?? null;
  const projectStats = data?.projectStats ?? null;
  const visitorStats = data?.visitorStats ?? null;
  const paymentStats = data?.paymentStats ?? null;

  return (
    <>
      <Helmet><title>Analytics — Admin</title></Helmet>
      <div className="max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-white">Analytics</h1>
            <p className="text-slate-500 mt-1">Visitor insights, content performance &amp; behavior tracking</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => downloadAnalyticsReportPDF(days)} className="btn-outline text-sm px-4 py-2">📊 Export PDF</button>
            <div className="flex rounded-xl border border-slate-700 overflow-hidden">
              {PERIODS.map(p => (
                <button key={p.days} onClick={() => setDays(p.days)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${days === p.days ? 'bg-accent text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-6 w-fit">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-accent text-white shadow' : 'text-slate-400 hover:text-white'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-32"><Spinner size="lg" /></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              {tab === 'Overview' && (summary
                ? <OverviewTab data={summary} days={days} />
                : <p className="text-slate-500 text-center py-20">No analytics data available yet.</p>
              )}
              {tab === 'Blogs' && (blogStats
                ? <BlogsTab data={blogStats} />
                : <p className="text-slate-500 text-center py-20">No blog analytics yet. Visitors need to view blog posts.</p>
              )}
              {tab === 'Projects' && (projectStats
                ? <ProjectsTab data={projectStats} />
                : <p className="text-slate-500 text-center py-20">No project analytics yet.</p>
              )}
              {tab === 'Visitors' && (visitorStats
                ? <VisitorsTab data={visitorStats} />
                : <p className="text-slate-500 text-center py-20">No visitor session data yet.</p>
              )}
              {tab === 'Revenue' && (paymentStats
                ? <RevenueTab data={paymentStats} />
                : <p className="text-slate-500 text-center py-20">No payment data yet. Configure Stripe to start.</p>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </>
  );
}

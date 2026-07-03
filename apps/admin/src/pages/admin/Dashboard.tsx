import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Spinner } from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { useDashboardQuery } from '../../hooks/queries/useDashboardQuery';

const StatCard = ({ label, value, sub, icon }: { label: string; value: string | number; sub?: string; icon: string; color?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stat-card relative overflow-hidden"
    style={{ cursor: 'default' }}
    whileHover={{ y: -4, transition: { duration: 0.25 } }}
  >
    {/* Subtle corner glow */}
    <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
      style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', filter: 'blur(16px)' }} />
    <div className="relative z-10 flex items-center justify-between">
      <p className="text-sm" style={{ color: '#475569' }}>{label}</p>
      <span className="text-xl p-2 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.1)' }}>{icon}</span>
    </div>
    <div className="relative z-10 mt-3">
      <p className="font-display text-3xl font-bold"
        style={{ background: 'linear-gradient(135deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        {value.toLocaleString()}
      </p>
      {sub && <p className="text-xs mt-1" style={{ color: '#334155' }}>{sub}</p>}
    </div>
  </motion.div>
);

const statusBadge = (status: string) => {
  const map: Record<string, string> = { UNREAD: 'badge-red', READ: 'badge-blue', REPLIED: 'badge-green', ARCHIVED: 'badge-yellow' };
  return <span className={map[status] ?? 'badge'}>{status}</span>;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading: loading } = useDashboardQuery();
  const summary = data?.summary;
  const inquiries = data?.inquiries ?? [];

  const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Helmet><title>Dashboard — Admin</title></Helmet>
      <div className="max-w-6xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-white">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1" style={{ color: '#334155' }}>Here's what's happening with your portfolio.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard label="Visitors (7d)" value={summary?.summary.totalVisitors ?? 0} sub="Unique sessions" icon="👥" />
              <StatCard label="Page Views (7d)" value={summary?.summary.totalPageViews ?? 0} sub="All pages" icon="👁" />
              <StatCard label="Resume Downloads" value={summary?.summary.resumeDownloads ?? 0} sub="Last 7 days" icon="⬇" />
              <StatCard label="Unread Inquiries" value={inquiries.length} sub="Needs attention" icon="📬" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Recent Inquiries */}
              <div className="card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-display font-bold text-white">Unread Inquiries</h2>
                  <Link to="/inquiries" className="text-accent text-xs hover:underline">View all →</Link>
                </div>
                {inquiries.length === 0 ? (
                  <p className="text-slate-500 text-sm p-6">No unread inquiries.</p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {inquiries.map(inq => (
                      <div key={inq.id} className="px-5 py-4 hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white text-sm truncate">{inq.name}</p>
                            <p className="text-slate-500 text-xs truncate">{inq.subject}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {statusBadge(inq.status)}
                            <span className="text-xs text-slate-600">{fmt(inq.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Links */}
              <div className="card p-5">
                <h2 className="font-display font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { to: '/blog',         label: 'New Blog Post',   icon: '✍️' },
                    { to: '/projects',     label: 'Add Project',     icon: '🗂' },
                    { to: '/services',     label: 'Edit Services',   icon: '💼' },
                    { to: '/resume',       label: 'Upload Resume',   icon: '📄' },
                    { to: '/testimonials', label: 'Add Testimonial', icon: '💬' },
                    { to: '/analytics',    label: 'Full Analytics',  icon: '📈' },
                  ].map(item => (
                    <Link key={item.to} to={item.to} className="card-hover p-4 flex items-center gap-3 group">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-slate-400 group-hover:text-white text-sm font-medium transition-colors">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Top pages */}
            {summary?.topPages && summary.topPages.length > 0 && (
              <div className="card mt-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h2 className="font-display font-bold text-white">Top Pages (7 days)</h2>
                  <Link to="/analytics" className="text-accent text-xs hover:underline">Full analytics →</Link>
                </div>
                <div className="p-4 space-y-3">
                  {summary.topPages.slice(0, 5).map((p, i) => {
                    const max = summary.topPages[0]?.views ?? 1;
                    return (
                      <div key={p.page} className="flex items-center gap-4">
                        <span className="text-slate-600 font-mono text-xs w-4 shrink-0">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-slate-300 text-sm font-mono truncate">{p.page || '/'}</span>
                            <span className="text-slate-500 text-xs shrink-0 ml-3">{p.views} views</span>
                          </div>
                          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(p.views / max) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

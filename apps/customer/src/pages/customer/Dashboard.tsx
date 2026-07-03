import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Payment, ServicePlan } from '../../types';
import { useCustomerAuth } from '../../context/AuthContext';
import { PUBLIC_URL } from '../../config/urls';
import { useCustomerDashboardQuery } from '../../hooks/queries/useCustomerQueries';

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const statusColor: Record<string, string> = {
  COMPLETED: 'badge-green', PENDING: 'badge-yellow', FAILED: 'badge-red',
  CANCELLED: 'badge-gray', REFUNDED: 'badge-blue',
};

export default function Dashboard() {
  const { customer } = useCustomerAuth();
  const { data, isLoading: loading } = useCustomerDashboardQuery();
  const payments: Payment[] = data?.payments ?? [];
  const plans: ServicePlan[] = data?.plans ?? [];
  const devProfile = data?.devProfile ?? null;

  const totalSpend = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
  const completedCount = payments.filter(p => p.status === 'COMPLETED').length;
  const recentPayments = payments.slice(0, 5);

  const stats = [
    { label: 'Total Spent', value: fmt(totalSpend), icon: '💰', color: 'text-green-400' },
    { label: 'Payments', value: completedCount, icon: '💳', color: 'text-blue-400' },
    { label: 'Services Available', value: plans.length, icon: '💼', color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
          Welcome back, {customer?.name?.split(' ')[0]} 👋
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#475569' }}>Here's an overview of your account.</p>
      </motion.div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="card h-24" style={{ animation: 'pulse 1.8s ease-in-out infinite', opacity: 0.4 }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="card relative overflow-hidden"
              style={{ padding: '1.25rem' }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
            >
              <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', filter: 'blur(12px)' }} />
              <div className="relative z-10 flex items-center gap-3">
                <span className="text-2xl p-2 rounded-xl flex-shrink-0"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  {s.icon}
                </span>
                <div>
                  <p className="text-2xl font-bold" style={{
                    background: s.color.includes('green') ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                      : s.color.includes('blue') ? 'linear-gradient(135deg, #60a5fa, #3b82f6)'
                      : 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    fontFamily: 'Syne, Outfit, sans-serif',
                  }}>
                    {s.value}
                  </p>
                  <p className="text-xs" style={{ color: '#475569' }}>{s.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Payments</h2>
            <Link to="/payments" className="text-sm font-medium" style={{color:"#818cf8"}}>View all →</Link>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center py-8 gap-2 text-center">
              <span style={{ fontSize: '28px' }}>💳</span>
              <p className="text-sm font-medium text-white">No payments yet</p>
              <Link to="/services" className="text-sm transition-colors" style={{ color: '#818cf8' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}>
                Browse available services →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 last:border-0" style={{borderBottom:"1px solid rgba(99,102,241,0.07)"}}>
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-[180px]">{p.serviceName || p.description || 'Service'}</p>
                    <p className="text-xs" style={{color:"#475569"}}>{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${statusColor[p.status] || 'badge-gray'}`}>{p.status}</span>
                    <span className="text-sm font-semibold text-white">{fmt(p.amount)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links + Dev Profile */}
        <div className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-white mb-4" style={{fontFamily:"Syne,sans-serif"}}>Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/services"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.08)';
                }}
              >
                <span>💼</span>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Browse Service Plans</span>
                <span className="ml-auto text-xs" style={{ color: '#334155' }}>→</span>
              </Link>
              <Link to="/payments"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.08)';
                }}
              >
                <span>📋</span>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Payment History</span>
                <span className="ml-auto text-xs" style={{ color: '#334155' }}>→</span>
              </Link>
              <Link to="/contact-admin"
                className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group"
                style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.08)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.12)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.06)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.08)';
                }}
              >
                <span>✉️</span>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Contact Admin</span>
                <span className="ml-auto text-xs" style={{ color: '#334155' }}>→</span>
              </Link>
            </div>
          </div>

          {devProfile && (
            <div className="card">
              <h2 className="font-semibold text-white mb-3" style={{fontFamily:"Syne,sans-serif"}}>Developer Links</h2>
              <div className="flex flex-wrap gap-2">
                {/* View Portfolio — cross-app link to public subdomain */}
                <a href={PUBLIC_URL}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg text-sm text-indigo-300 hover:text-white transition-colors">
                  <span>🌐</span> View Portfolio
                </a>
                {devProfile.githubUrl && (
                  <a href={devProfile.githubUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
                    <span>⬛</span> GitHub
                  </a>
                )}
                {devProfile.linkedinUrl && (
                  <a href={devProfile.linkedinUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 hover:text-white transition-colors">
                    <span>🔵</span> LinkedIn
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

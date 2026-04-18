import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie,
} from 'recharts';
import { getPaymentAnalytics, listAdminPayments } from '../../api';
import { PaymentAnalytics, Payment } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { downloadReceiptPDF, downloadAnalyticsReportPDF } from '../../utils/pdf';

const fmt = (cents: number, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'text-emerald-400 bg-emerald-500/10',
  PENDING:   'text-yellow-400 bg-yellow-500/10',
  FAILED:    'text-red-400 bg-red-500/10',
  CANCELLED: 'text-slate-400 bg-slate-800',
  REFUNDED:  'text-purple-400 bg-purple-500/10',
};

const SOURCE_STYLES: Record<string, string> = {
  direct:  'text-accent bg-accent/10 border border-accent/25',
  inquiry: 'text-purple-400 bg-purple-500/10 border border-purple-500/25',
};

const TYPE_COLORS  = ['#6366f1', '#8b5cf6', '#06b6d4'];
const SOURCE_CLRS  = ['#6366f1', '#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: any) =>
  active && payload?.length ? (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'revenue' ? fmt(p.value) : `${p.value} payments`}
        </p>
      ))}
    </div>
  ) : null;

const StatCard = ({ label, value, sub, icon, color = '' }: { label: string; value: string; sub?: string; icon: string; color?: string }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="stat-card">
    <div className="flex items-center justify-between mb-2">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-2xl">{icon}</span>
    </div>
    <p className={`font-display text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
    {sub && <p className="text-slate-600 text-xs mt-1">{sub}</p>}
  </motion.div>
);

export default function PaymentsManager() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [payments, setPayments]   = useState<Payment[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [days, setDays]           = useState(30);
  const [tab, setTab]             = useState<'overview' | 'transactions'>('overview');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'direct' | 'inquiry'>('all');
  const [loading, setLoading]     = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getPaymentAnalytics(days);
      setAnalytics(r.data.data);
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== 'transactions') return;
    setTxLoading(true);
    const src = sourceFilter !== 'all' ? sourceFilter : undefined;
    listAdminPayments(page, src).then(r => {
      setPayments(r.data.data.payments ?? []);
      setTotal(r.data.data.total ?? 0);
      setPages(r.data.data.pages ?? 1);
    }).catch(() => {}).finally(() => setTxLoading(false));
  }, [tab, page, sourceFilter]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  const a = analytics!;
  const revenueByDay = (a.byDay ?? []).map(d => ({ day: d.day.slice(5), revenue: d.revenue, count: d.count }));
  const byTypePie    = (a.byType ?? []).map(t => ({ name: t.type.charAt(0).toUpperCase() + t.type.slice(1), value: t._sum.amount ?? 0 }));
  const bySourcePie  = (a.bySource ?? []).map(s => ({
    name: s.paymentSource === 'direct' ? '⚡ Direct' : '💬 Inquiry',
    value: s._sum.amount ?? 0,
    count: s._count.id ?? 0,
  }));
  const directCount  = (a.bySource ?? []).find(s => s.paymentSource === 'direct')?._count.id ?? 0;

  return (
    <>
      <Helmet><title>Payments — Admin</title></Helmet>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-white">Payments</h1>
            <p className="text-slate-400 text-sm mt-0.5">Revenue tracking and transaction history</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => downloadAnalyticsReportPDF(days)} className="btn-outline text-sm px-4 py-2">📊 Export Report</button>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${days === d ? 'bg-accent text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                {d}d
              </button>
            ))}
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-slate-900 rounded-xl p-1 w-fit">
          {(['overview', 'transactions'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Revenue"    value={fmt(a.totalRevenue)}      sub={`last ${days} days`}         icon="💰" color="text-emerald-400" />
              <StatCard label="Transactions"      value={String(a.totalCount)}     sub="completed payments"          icon="🧾" />
              <StatCard label="Direct Payments"   value={String(directCount)}      sub="via Pay Now on Services"     icon="⚡" color="text-accent" />
              <StatCard label="Webhook Errors"    value={String(a.webhookErrors)}  sub="unprocessed events"          icon="⚠️" color={a.webhookErrors > 0 ? 'text-red-400' : 'text-white'} />
            </div>

            {/* Revenue chart */}
            <div className="card p-6">
              <h2 className="font-display text-base font-bold text-white mb-4">Revenue Over Time</h2>
              {revenueByDay.length === 0 ? (
                <p className="text-slate-500 italic text-sm py-8 text-center">No payment data yet. Set up Stripe to start accepting payments.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueByDay}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="day" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `$${(v / 100).toFixed(0)}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="revenue" stroke="#6366f1" fill="url(#gRev)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* By source + by type + recent */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Payment source breakdown */}
              <div className="card p-6">
                <h2 className="font-display text-base font-bold text-white mb-1">By Payment Source</h2>
                <p className="text-slate-500 text-xs mb-4">Direct vs inquiry-based payments</p>
                {bySourcePie.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No data</p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <ResponsiveContainer width="50%" height={130}>
                        <PieChart>
                          <Pie data={bySourcePie} dataKey="value" cx="50%" cy="50%" outerRadius={55} paddingAngle={3}>
                            {bySourcePie.map((_, i) => <Cell key={i} fill={SOURCE_CLRS[i % SOURCE_CLRS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => fmt(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 flex-1">
                        {bySourcePie.map((s, i) => (
                          <div key={s.name} className="text-xs">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SOURCE_CLRS[i % SOURCE_CLRS.length] }} />
                              <span className="text-slate-300 font-medium">{s.name}</span>
                            </div>
                            <p className="text-slate-500 pl-4">{fmt(s.value)} · {s.count} txn{s.count !== 1 ? 's' : ''}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue by type */}
              <div className="card p-6">
                <h2 className="font-display text-base font-bold text-white mb-4">By Payment Type</h2>
                {byTypePie.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No data</p>
                ) : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={130}>
                      <PieChart>
                        <Pie data={byTypePie} dataKey="value" cx="50%" cy="50%" outerRadius={55} paddingAngle={3}>
                          {byTypePie.map((_, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {byTypePie.map((t, i) => (
                        <div key={t.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                          <span className="text-slate-300">{t.name}</span>
                          <span className="text-slate-500 ml-auto">{fmt(t.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recent transactions */}
              <div className="card p-6">
                <h2 className="font-display text-base font-bold text-white mb-4">Recent Transactions</h2>
                {a.recent.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">No transactions yet.</p>
                ) : (
                  <div className="space-y-2">
                    {a.recent.slice(0, 5).map(p => (
                      <div key={p.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0">
                        <div className="flex-1 min-w-0 mr-2">
                          <p className="text-slate-200 text-xs truncate">{p.description ?? p.type}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${SOURCE_STYLES[p.paymentSource] ?? ''}`}>
                              {p.paymentSource === 'direct' ? '⚡ Direct' : '💬 Inquiry'}
                            </span>
                            <span className="text-slate-600 text-[10px]">{fmtDate(p.createdAt)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-mono text-xs">{fmt(p.amount, p.currency)}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </>
        )}

        {/* ── Transactions ── */}
        {tab === 'transactions' && (
          <>
            {/* Source filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 text-xs">Filter by source:</span>
              {(['all', 'direct', 'inquiry'] as const).map(s => (
                <button key={s} onClick={() => { setSourceFilter(s); setPage(1); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                    sourceFilter === s
                      ? s === 'direct'  ? 'bg-accent/20 text-accent border-accent/40'
                      : s === 'inquiry' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      : 'bg-slate-700 text-white border-slate-600'
                      : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'direct' ? '⚡ Direct' : '💬 Inquiry'}
                </button>
              ))}
            </div>

            {txLoading ? <div className="flex justify-center py-20"><Spinner /></div> : (
              <>
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-slate-500 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {payments.map(p => (
                        <tr key={p.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                          <td className="px-4 py-3">
                            <p className="text-slate-200 text-sm">{p.customerName ?? '—'}</p>
                            <p className="text-slate-500 text-xs">{p.customerEmail ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm max-w-[180px] truncate">{p.description ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${SOURCE_STYLES[p.paymentSource] ?? 'text-slate-400 bg-slate-800'}`}>
                              {p.paymentSource === 'direct' ? '⚡ Direct' : '💬 Inquiry'}
                            </span>
                          </td>
                          <td className="px-4 py-3"><span className="badge-purple capitalize text-xs">{p.type}</span></td>
                          <td className="px-4 py-3 text-right font-mono text-slate-200 text-sm">{fmt(p.amount, p.currency)}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[p.status] ?? ''}`}>{p.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => downloadReceiptPDF(p as any)} className="text-accent text-xs hover:underline">📥 PDF</button>
                          </td>
                        </tr>
                      ))}
                      {payments.length === 0 && (
                        <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-600 italic">No transactions found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {pages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-slate-500 text-sm">Page {page} of {pages} · {total} total</p>
                    <div className="flex gap-2">
                      <button disabled={page === 1}     onClick={() => setPage(p => p - 1)} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">← Prev</button>
                      <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="btn-ghost text-sm px-3 py-1.5 disabled:opacity-40">Next →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

      </div>
    </>
  );
}

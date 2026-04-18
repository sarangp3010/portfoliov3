import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../../api/axios';

interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  _count: { payments: number; sessions: number; messages: number };
}

interface CustomerDetail {
  id: string;
  email: string;
  name: string;
  phone?: string;
  provider: string;
  isActive: boolean;
  createdAt: string;
  payments: Array<{ id: string; amount: number; status: string; serviceName?: string; createdAt: string }>;
  sessions: Array<{ id: string; browser?: string; device?: string; ipAddress?: string; loginAt: string; lastActiveAt: string; isActive: boolean }>;
  messages: Array<{ id: string; message: string; status: string; createdAt: string }>;
}

interface ActiveSession {
  id: string;
  customerId: string;
  browser?: string;
  device?: string;
  ipAddress?: string;
  loginAt: string;
  lastActiveAt: string;
  customer: { email: string; name: string };
}

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const providerBadge: Record<string, string> = {
  local: 'bg-gray-700 text-gray-300',
  google: 'bg-blue-500/20 text-blue-400',
  github: 'bg-gray-600/30 text-gray-300',
  microsoft: 'bg-blue-700/20 text-blue-300',
};

export default function CustomersManager() {
  const [tab, setTab] = useState<'list' | 'sessions' | 'messages'>('list');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [messages, setMessages] = useState<Array<{ id: string; message: string; status: string; createdAt: string; customer: { name: string; email: string }; adminReply?: string }>>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    if (tab === 'list') loadCustomers();
    if (tab === 'sessions') loadSessions();
    if (tab === 'messages') loadMessages();
  }, [tab, page]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const r = await api.get(`/admin/customers?page=${page}`);
      setCustomers(r.data.data.customers || []);
      setTotal(r.data.data.total || 0);
    } finally { setLoading(false); }
  };

  const loadSessions = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/customers/sessions');
      setSessions(r.data.data || []);
    } finally { setLoading(false); }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/customers/messages');
      setMessages(r.data.data || []);
    } finally { setLoading(false); }
  };

  const toggleCustomer = async (id: string, isActive: boolean) => {
    await api.patch(`/admin/customers/${id}/active`, { isActive: !isActive });
    loadCustomers();
  };

  const terminateSession = async (sessionId: string) => {
    await api.delete(`/admin/customers/sessions/${sessionId}`);
    loadSessions();
  };

  const sendReply = async (msgId: string) => {
    if (!replyText.trim()) return;
    await api.post(`/admin/customers/messages/${msgId}/reply`, { reply: replyText });
    setReplyingTo(null);
    setReplyText('');
    loadMessages();
  };

  const openDetail = async (id: string) => {
    const r = await api.get(`/admin/customers/${id}`);
    setDetail(r.data.data);
  };

  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Customer Management</h1>
        <p className="text-slate-400 mt-1">Manage portal customers, sessions, and messages.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {(['list', 'sessions', 'messages'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setDetail(null); }}
            className={`px-5 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t === 'list' ? `Customers (${total})` : t === 'sessions' ? `Active Sessions (${sessions.length})` : `Messages (${messages.filter(m => m.status === 'UNREAD').length} new)`}
          </button>
        ))}
      </div>

      {/* ── Customer List ── */}
      {tab === 'list' && !detail && (
        <div className="bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-14 bg-slate-800 rounded animate-pulse" />)}</div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center"><p className="text-slate-500">No customers yet.</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Customer</th>
                  <th className="px-6 py-4 text-left hidden md:table-cell">Provider</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Payments</th>
                  <th className="px-6 py-4 text-center hidden sm:table-cell">Sessions</th>
                  <th className="px-6 py-4 text-left hidden lg:table-cell">Joined</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs font-bold text-indigo-400">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          <p className="text-slate-500 text-xs">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className={`badge text-xs px-2 py-0.5 rounded ${providerBadge[c.provider] || 'bg-gray-700 text-gray-300'}`}>{c.provider}</span>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className="text-slate-300 text-sm">{c._count.payments}</span>
                    </td>
                    <td className="px-6 py-4 text-center hidden sm:table-cell">
                      <span className="text-slate-300 text-sm">{c._count.sessions}</span>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-500 text-xs">{new Date(c.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <span className={`badge text-xs ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'Active' : 'Inactive'}</span>
                        <button onClick={() => openDetail(c.id)} className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors">
                          View
                        </button>
                        <button onClick={() => toggleCustomer(c.id, c.isActive)}
                          className={`text-xs px-2 py-1 rounded transition-colors ${c.isActive ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'}`}>
                          {c.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
          {pages > 1 && (
            <div className="px-6 py-4 border-t border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">Page {page} of {pages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">← Prev</button>
                <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-40">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Customer Detail ── */}
      {tab === 'list' && detail && (
        <div className="space-y-4">
          <button onClick={() => setDetail(null)} className="text-sm text-slate-400 hover:text-white flex items-center gap-2">← Back to list</button>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card">
              <h3 className="text-white font-semibold mb-3">Customer Info</h3>
              <div className="space-y-2 text-sm">
                <p><span className="text-slate-500">Name:</span> <span className="text-white">{detail.name}</span></p>
                <p><span className="text-slate-500">Email:</span> <span className="text-white">{detail.email}</span></p>
                {detail.phone && <p><span className="text-slate-500">Phone:</span> <span className="text-white">{detail.phone}</span></p>}
                <p><span className="text-slate-500">Provider:</span> <span className="text-white capitalize">{detail.provider}</span></p>
                <p><span className="text-slate-500">Joined:</span> <span className="text-white">{new Date(detail.createdAt).toLocaleDateString()}</span></p>
                <p><span className="text-slate-500">Status:</span> <span className={detail.isActive ? 'text-green-400' : 'text-red-400'}>{detail.isActive ? 'Active' : 'Inactive'}</span></p>
              </div>
            </div>
            <div className="card lg:col-span-2">
              <h3 className="text-white font-semibold mb-3">Payment History</h3>
              {detail.payments.length === 0 ? <p className="text-slate-500 text-sm">No payments.</p> : (
                <div className="space-y-2">
                  {detail.payments.map(p => (
                    <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-800 last:border-0 text-sm">
                      <span className="text-slate-300">{p.serviceName || 'Service'}</span>
                      <div className="flex items-center gap-3">
                        <span className={`badge text-xs ${p.status === 'COMPLETED' ? 'badge-green' : 'badge-yellow'}`}>{p.status}</span>
                        <span className="text-white font-medium">{fmt(p.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="text-white font-semibold mb-3">Login Sessions</h3>
            <div className="space-y-2">
              {detail.sessions.map(s => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0 text-sm">
                  <div>
                    <p className="text-slate-300">{s.browser || 'Unknown browser'} · {s.device || 'Unknown device'}</p>
                    <p className="text-slate-500 text-xs">{s.ipAddress} · Login: {new Date(s.loginAt).toLocaleString()}</p>
                  </div>
                  <span className={`badge text-xs ${s.isActive ? 'badge-green' : 'badge-gray'}`}>{s.isActive ? 'Active' : 'Ended'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Active Sessions ── */}
      {tab === 'sessions' && (
        <div className="bg-surface-900 border border-slate-800 rounded-xl overflow-hidden">
          {loading ? <div className="p-8"><div className="h-32 bg-slate-800 rounded animate-pulse" /></div>
          : sessions.length === 0 ? <div className="p-12 text-center"><p className="text-slate-500">No active sessions.</p></div>
          : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-4 text-left">Customer</th>
                  <th className="px-6 py-4 text-left hidden md:table-cell">Browser / Device</th>
                  <th className="px-6 py-4 text-left hidden lg:table-cell">Last Active</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-slate-800 last:border-0">
                    <td className="px-6 py-4">
                      <p className="text-white text-sm">{s.customer.name}</p>
                      <p className="text-slate-500 text-xs">{s.customer.email}</p>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <p className="text-slate-300 text-sm">{s.browser || '—'}</p>
                      <p className="text-slate-500 text-xs">{s.device || '—'} · {s.ipAddress || '—'}</p>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <span className="text-slate-400 text-sm">{new Date(s.lastActiveAt).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => terminateSession(s.id)} className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded hover:bg-red-500/10 transition-colors">
                        Terminate
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Messages ── */}
      {tab === 'messages' && (
        <div className="space-y-3">
          {loading ? <div className="card h-32 animate-pulse bg-slate-800" />
          : messages.length === 0 ? <div className="card text-center py-12"><p className="text-slate-500">No messages.</p></div>
          : messages.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-white font-medium text-sm">{m.customer.name}</p>
                    <p className="text-slate-500 text-xs">{m.customer.email}</p>
                    <span className={`badge text-xs ${m.status === 'UNREAD' ? 'badge-yellow' : m.status === 'REPLIED' ? 'badge-green' : 'badge-gray'}`}>{m.status}</span>
                  </div>
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{m.message}</p>
                  {m.adminReply && (
                    <div className="mt-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                      <p className="text-indigo-400 text-xs font-medium mb-1">Your reply:</p>
                      <p className="text-slate-300 text-sm">{m.adminReply}</p>
                    </div>
                  )}
                  {replyingTo === m.id && (
                    <div className="mt-3 space-y-2">
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={4}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-indigo-500"
                        placeholder="Type your reply…" />
                      <div className="flex gap-2">
                        <button onClick={() => sendReply(m.id)} disabled={!replyText.trim()} className="btn-primary text-xs px-3 py-1.5 disabled:opacity-40">Send Reply</button>
                        <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-slate-600 text-xs whitespace-nowrap">{new Date(m.createdAt).toLocaleDateString()}</p>
                  {!replyingTo && (
                    <button onClick={() => setReplyingTo(m.id)} className="text-indigo-400 hover:text-indigo-300 text-xs px-2 py-1 rounded hover:bg-indigo-500/10 transition-colors">
                      Reply
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

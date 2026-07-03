import { useState } from 'react';
import { motion } from 'framer-motion';
import { Payment } from '../../types';
import { useCustomerMutations, useCustomerPaymentsQuery } from '../../hooks/queries/useCustomerQueries';

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const statusColor: Record<string, string> = {
  COMPLETED: 'badge-green', PENDING: 'badge-yellow', FAILED: 'badge-red',
  CANCELLED: 'badge-gray', REFUNDED: 'badge-blue',
};

export default function Payments() {
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { data, isLoading: loading } = useCustomerPaymentsQuery(page);
  const { getPaymentReceipt: getPaymentReceiptMutation } = useCustomerMutations();
  const payments: Payment[] = data?.payments ?? [];
  const total = data?.total ?? 0;

  const handleReceipt = async (payment: Payment) => {
    if (payment.status !== 'COMPLETED') return;
    setDownloading(payment.id);
    try {
      const r = await getPaymentReceiptMutation.mutateAsync(payment.id);
      const blob = new Blob([JSON.stringify(r.data.data, null, 2)], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.id.slice(-8)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not download receipt');
    } finally {
      setDownloading(null);
    }
  };

  const totalSpent = payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
  const perPage = 10;
  const totalPages = Math.ceil(total / perPage);

  const thStyle = { color: '#334155', letterSpacing: '0.08em' };
  const rowBorder = { borderBottom: '1px solid rgba(99,102,241,0.06)' };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
          Payment History
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#475569' }}>All your transactions and receipts.</p>
        {error && (
          <p className="mt-3 text-sm" style={{ color: '#fca5a5' }}>{error}</p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-2xl font-bold" style={{
            background: 'linear-gradient(135deg,#4ade80,#22c55e)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: 'Syne, sans-serif',
          }}>{fmt(totalSpent)}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Total Spent</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold" style={{
            background: 'linear-gradient(135deg,#fff,#a5b4fc)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: 'Syne, sans-serif',
          }}>{total}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Total Transactions</p>
        </div>
        <div className="card">
          <p className="text-2xl font-bold" style={{
            background: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            fontFamily: 'Syne, sans-serif',
          }}>{payments.filter(p => p.status === 'COMPLETED').length}</p>
          <p className="text-xs mt-1" style={{ color: '#475569' }}>Successful</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="card h-14" style={{ opacity: 0.3, animation: 'pulse 1.8s ease-in-out infinite' }} />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-3">💳</p>
            <p style={{ color: '#475569' }}>No payments yet.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase" style={thStyle}>Service</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase hidden sm:table-cell" style={thStyle}>Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium uppercase" style={thStyle}>Status</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase" style={thStyle}>Amount</th>
                <th className="px-6 py-4 text-right text-xs font-medium uppercase" style={thStyle}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="transition-colors"
                  style={rowBorder}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.04)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm text-white font-medium">{p.serviceName || p.description || 'Service'}</p>
                    <p className="text-xs font-mono" style={{ color: '#334155' }}>{p.stripeSessionId?.slice(-12)}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <p className="text-sm" style={{ color: '#64748b' }}>{new Date(p.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${statusColor[p.status] || 'badge-gray'}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-white">{fmt(p.amount)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'COMPLETED' && (
                      <button
                        onClick={() => handleReceipt(p)}
                        disabled={downloading === p.id}
                        className="text-xs font-medium transition-colors disabled:opacity-50"
                        style={{ color: '#818cf8' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
                      >
                        {downloading === p.id ? '…' : '⬇ PDF'}
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: '#475569' }}>Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">← Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

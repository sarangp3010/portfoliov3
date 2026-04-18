import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod } from '../../api';
import { PaymentMethod } from '../../types';

const brandIcon: Record<string, string> = {
  visa: '💳', mastercard: '💳', amex: '💳', discover: '💳', default: '💳',
};

export default function PaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    getPaymentMethods()
      .then(r => setMethods(r.data.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    setAdding(true);
    try {
      const r = await addPaymentMethod();
      window.location.href = r.data.data.url;
    } catch {
      setError('Could not set up payment method');
      setAdding(false);
    }
  };

  const handleDelete = async (pmId: string) => {
    if (!confirm('Remove this payment method?')) return;
    setDeleting(pmId);
    try {
      await deletePaymentMethod(pmId);
      load();
    } catch {
      setError('Could not remove payment method');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
          {error}
          <button onClick={() => setError('')} className="ml-2 underline text-xs">dismiss</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
            Payment Methods
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#475569' }}>Manage your saved cards.</p>
        </div>
        <button onClick={handleAdd} disabled={adding} className="btn-primary">
          {adding ? 'Redirecting…' : '+ Add Card'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="card h-20" style={{ opacity: 0.3, animation: 'pulse 1.8s ease-in-out infinite' }} />
          ))}
        </div>
      ) : methods.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🪙</p>
          <p className="mb-4 text-sm" style={{ color: '#475569' }}>No saved payment methods.</p>
          <button onClick={handleAdd} disabled={adding} className="btn-primary">
            {adding ? 'Setting up…' : 'Add a Card'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((pm, i) => (
            <motion.div
              key={pm.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="card flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl">{brandIcon[pm.brand] || '💳'}</span>
                <div>
                  <p className="text-white font-medium capitalize">
                    {pm.brand} •••• {pm.last4}
                    {pm.isDefault && <span className="ml-2 badge badge-green text-xs">Default</span>}
                  </p>
                  <p className="text-sm" style={{ color: '#475569' }}>
                    Expires {pm.expMonth}/{pm.expYear}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(pm.id)}
                disabled={deleting === pm.id}
                className="text-sm disabled:opacity-50 transition-colors"
                style={{ color: '#f87171' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#fca5a5'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
              >
                {deleting === pm.id ? '…' : 'Remove'}
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <p className="text-xs text-center" style={{ color: '#334155' }}>
        Payment methods are securely managed by Stripe.
      </p>
    </div>
  );
}

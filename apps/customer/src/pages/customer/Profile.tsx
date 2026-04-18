import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useCustomerAuth } from '../../context/AuthContext';
import { updateCustomerProfile } from '../../api';

export default function Profile() {
  const { customer, refresh } = useCustomerAuth();
  const [form, setForm] = useState({ name: customer?.name || '', phone: '' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: { name?: string; phone?: string } = {};
      if (form.name !== customer?.name) payload.name = form.name;
      if (form.phone) payload.phone = form.phone;
      if (Object.keys(payload).length === 0) { setSaved(true); setLoading(false); return; }
      await updateCustomerProfile(payload);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const initials = customer?.name
    ? customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CP';

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{fontFamily:"Syne,Outfit,sans-serif"}}>Profile</h1>
        <p className="mt-1 text-sm" style={{color:"#475569"}}>Manage your account settings.</p>
      </div>

      {/* Avatar */}
      <div className="card flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold text-white" style={{background:"linear-gradient(135deg,#6366f1,#06b6d4)",boxShadow:"0 4px 20px rgba(99,102,241,0.4)"}}>
          {initials}
        </div>
        <div>
          <p className="text-white font-semibold">{customer?.name}</p>
          <p className="text-sm" style={{color:"#64748b"}}>{customer?.email}</p>
          <span className="badge badge-blue mt-1">{customer?.provider || 'local'}</span>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm" style={{background:"rgba(248,113,113,0.08)",border:"1px solid rgba(248,113,113,0.2)",color:"#fca5a5"}}>{error}</div>
        )}
        {saved && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
            ✓ Profile updated successfully
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} className="input" required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={customer?.email || ''} className="input opacity-60 cursor-not-allowed" disabled />
            <p className="text-xs mt-1" style={{color:"#334155"}}>Email cannot be changed.</p>
          </div>
          <div>
            <label className="label">Phone <span className="text-gray-600">(for SMS notifications)</span></label>
            <input type="tel" value={form.phone} onChange={set('phone')} className="input" placeholder={customer?.phone || '+1 555 000 0000'} />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

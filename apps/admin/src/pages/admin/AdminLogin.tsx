import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { login } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const r = await login(email, password);
      const { token, user } = r.data.data;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_user', JSON.stringify(user));
      setUser(user);
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <>
      <Helmet><title>Admin Login</title></Helmet>
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ backgroundColor: '#03050f' }}>
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))',
                border: '1px solid rgba(99,102,241,0.3)',
                boxShadow: '0 0 40px rgba(99,102,241,0.2)',
              }}>
              <span className="text-2xl">🔒</span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-sm" style={{ color: '#334155' }}>Sign in with your admin credentials</p>
          </div>

          <div className="card" style={{ padding: '2rem' }}>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label" htmlFor="email">Email Address</label>
                <input id="email" type="email" className="input" placeholder="admin@portfolio.dev"
                  value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="password">Password</label>
                <input id="password" type="password" className="input" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
                  <span className="text-sm" style={{ color: '#fca5a5' }}>{error}</span>
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5 text-base">
                {loading ? 'Signing in...' : 'Sign In →'}
              </button>
            </form>
          </div>
          <p className="text-center text-xs mt-6 font-mono" style={{ color: '#1e293b' }}>
            Protected admin area. Unauthorized access prohibited.
          </p>
        </motion.div>
      </div>
    </>
  );
}

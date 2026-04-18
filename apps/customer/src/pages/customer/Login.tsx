import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerLogin } from '../../api';
import { useCustomerAuth } from '../../context/AuthContext';
import { OAuthButtons } from '../../components/auth/OAuthButtons';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { signIn }              = useCustomerAuth();
  const navigate                = useNavigate();
  const [params]                = useSearchParams();
  const redirect                = params.get('redirect') || '/dashboard';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await customerLogin(email, password);
      signIn(r.data.data.token, r.data.data.customer);
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#03050f' }}>

      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
            Customer Portal
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#475569' }}>Sign in to manage your services</p>
        </div>

        <div className="card" style={{ padding: '2rem' }}>

          {/* Error banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}
            >
              {error}
            </motion.div>
          )}

          {/* ── OAuth buttons ── */}
          <OAuthButtons label="continue with" />

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.1)' }} />
            <span className="text-xs" style={{ color: '#334155' }}>or sign in with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.1)' }} />
          </div>

          {/* ── Email / password form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Signing in…
                  </span>
                : 'Sign In'
              }
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#475569' }}>
            Don't have an account?{' '}
            <Link to="/register"
              style={{ color: '#818cf8' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
            >
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

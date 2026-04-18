import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerRegister } from '../../api';
import { useCustomerAuth } from '../../context/AuthContext';
import { OAuthButtons } from '../../components/auth/OAuthButtons';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn }            = useCustomerAuth();
  const navigate              = useNavigate();

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        ...(form.phone ? { phone: form.phone } : {}),
      };
      const r = await customerRegister(payload);
      signIn(r.data.data.token, r.data.data.customer);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#03050f' }}>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%)', filter: 'blur(60px)' }} />
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
              background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
              boxShadow: '0 8px 32px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}>
            <span className="text-2xl">⚡</span>
          </div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
            Create Account
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#475569' }}>Start working with us today</p>
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
          <OAuthButtons label="sign up with" />

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.1)' }} />
            <span className="text-xs" style={{ color: '#334155' }}>or create account with email</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(99,102,241,0.1)' }} />
          </div>

          {/* ── Email / password form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={set('name')}
                className="input"
                placeholder="John Doe"
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
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
                value={form.password}
                onChange={set('password')}
                className="input"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="label">
                Phone{' '}
                <span style={{ color: '#334155', fontSize: '0.75rem', fontWeight: 400 }}>
                  (optional – for SMS notifications)
                </span>
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                className="input"
                placeholder="+1 555 000 0000"
                autoComplete="tel"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Creating account…
                  </span>
                : 'Create Account'
              }
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#475569' }}>
            Already have an account?{' '}
            <Link to="/login"
              style={{ color: '#818cf8' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

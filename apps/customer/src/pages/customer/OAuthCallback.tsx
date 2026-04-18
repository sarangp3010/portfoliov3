/**
 * OAuthCallback.tsx
 *
 * Landing page for OAuth redirects.
 * The server redirects to:
 *   customer.localhost:5173/auth/callback?token=<jwt>&session=<sessionToken>
 *     OR
 *   customer.localhost:5173/login?error=<message>
 *
 * This page reads the token, stores it, and navigates to /dashboard.
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerMe } from '../../api';
import { useCustomerAuth } from '../../context/AuthContext';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const { signIn } = useCustomerAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const token   = searchParams.get('token');
    const error   = searchParams.get('error');

    if (error) {
      setErrorMsg(decodeURIComponent(error));
      setStatus('error');
      return;
    }

    if (!token) {
      setErrorMsg('Authentication failed — no token received.');
      setStatus('error');
      return;
    }

    // Store token then fetch customer profile
    localStorage.setItem('customer_token', token);

    customerMe()
      .then(r => {
        signIn(token, r.data.data);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('customer_token');
        setErrorMsg('Could not load your account. Please try again.');
        setStatus('error');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#03050f' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md text-center"
        >
          <div className="card" style={{ padding: '2.5rem' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2"
              style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
              Sign-in Failed
            </h1>
            <p className="text-sm mb-6" style={{ color: '#64748b' }}>
              {errorMsg}
            </p>
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="btn-primary w-full py-3"
            >
              Back to Login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#03050f' }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-5"
      >
        {/* Spinning gradient ring */}
        <div className="w-14 h-14 relative">
          <div className="absolute inset-0 rounded-full"
            style={{ border: '2px solid rgba(99,102,241,0.1)' }} />
          <div className="absolute inset-0 rounded-full"
            style={{
              border: '2px solid transparent',
              borderTopColor: '#6366f1',
              borderRightColor: 'rgba(6,182,212,0.6)',
              animation: 'spin 0.8s linear infinite',
            }} />
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ fontSize: '18px' }}>
            ✦
          </div>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>
            Signing you in…
          </p>
          <p className="text-xs mt-1" style={{ color: '#334155' }}>
            Setting up your account
          </p>
        </div>
      </motion.div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

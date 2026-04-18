/**
 * NotificationBell.tsx
 *
 * Floating bell icon with unread badge and dropdown panel.
 * Polls for unread count every 30s. Works for both admin and customer
 * — the backend scopes results by the JWT role automatically.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  event: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'error';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

interface NotificationBellProps {
  /** API base path for notifications — default '/api/notifications' */
  apiBase?: string;
  /** Path to the full notifications page */
  notificationsPath?: string;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_DOT: Record<string, string> = {
  success: '#4ade80',
  warning: '#fbbf24',
  error:   '#f87171',
  info:    '#818cf8',
};

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('customer_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...authHeaders(), ...init?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── component ─────────────────────────────────────────────────────────────────

export function NotificationBell({ notificationsPath = '/notifications' }: NotificationBellProps) {
  const [open, setOpen]               = useState(false);
  const [unread, setUnread]           = useState(0);
  const [notifications, setNotifs]    = useState<Notification[]>([]);
  const [loading, setLoading]         = useState(false);
  const dropdownRef                   = useRef<HTMLDivElement>(null);
  const navigate                      = useNavigate();

  // ── fetch unread count (polling) ────────────────────────────────────────────

  const fetchCount = useCallback(async () => {
    try {
      const data = await apiFetch('/api/notifications/unread-count');
      setUnread(data.data.count ?? 0);
    } catch { /* silently ignore */ }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // ── fetch notifications when dropdown opens ──────────────────────────────────

  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/notifications?page=1');
      setNotifs(data.data.notifications ?? []);
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  // ── close on outside click ───────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // ── mark one read + navigate ─────────────────────────────────────────────────

  const handleClick = async (n: Notification) => {
    if (!n.isRead) {
      try {
        await apiFetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' });
        setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        setUnread(c => Math.max(0, c - 1));
      } catch { /* ignore */ }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  // ── mark all read ────────────────────────────────────────────────────────────

  const handleMarkAll = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg transition-all"
        style={{ color: open ? '#a5b4fc' : '#64748b' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.color = '#64748b'; }}
        title="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {/* Badge */}
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-white font-bold"
            style={{ fontSize: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 8px rgba(99,102,241,0.6)' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 z-50 flex flex-col"
            style={{
              width: '340px',
              maxHeight: '420px',
              background: 'linear-gradient(180deg, rgba(8,11,22,0.99) 0%, rgba(4,6,14,1) 100%)',
              border: '1px solid rgba(99,102,241,0.18)',
              borderRadius: '16px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.06)',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
                  Notifications
                </span>
                {unread > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
                    {unread} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={handleMarkAll} className="text-xs transition-colors"
                    style={{ color: '#64748b' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => { setOpen(false); navigate(notificationsPath); }}
                  className="text-xs transition-colors"
                  style={{ color: '#64748b' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#a5b4fc'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#64748b'}>
                  See all
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
              {loading ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 rounded-xl"
                      style={{ background: 'rgba(99,102,241,0.05)', animation: 'pulse 1.8s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <span style={{ fontSize: '28px' }}>🔔</span>
                  <p className="text-sm" style={{ color: '#334155' }}>No notifications yet</p>
                </div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 transition-all"
                    style={{
                      borderBottom: '1px solid rgba(99,102,241,0.06)',
                      background: n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.isRead ? 'transparent' : 'rgba(99,102,241,0.04)'}
                  >
                    {/* Type dot */}
                    <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full"
                      style={{ background: TYPE_DOT[n.type] ?? '#818cf8', boxShadow: `0 0 6px ${TYPE_DOT[n.type] ?? '#818cf8'}66` }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug"
                        style={{ color: n.isRead ? '#64748b' : '#e2e8f0', fontWeight: n.isRead ? 400 : 500 }}>
                        {n.message}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#334155' }}>{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.isRead && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                        style={{ background: '#6366f1' }} />
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

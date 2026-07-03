import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  NotificationItem,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from '../../hooks/queries/useNotificationsQuery';

const TYPE_DOT: Record<string, string> = {
  success: '#4ade80',
  warning: '#fbbf24',
  error:   '#f87171',
  info:    '#818cf8',
};

const TYPE_BG: Record<string, string> = {
  success: 'rgba(74,222,128,0.08)',
  warning: 'rgba(251,191,36,0.08)',
  error:   'rgba(248,113,113,0.08)',
  info:    'rgba(129,140,248,0.08)',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage]            = useState(1);
  const [unreadOnly, setUnreadOnly]= useState(false);
  const { data, isLoading: loading } = useNotificationsQuery(page, unreadOnly);
  const markReadMutation = useMarkNotificationReadMutation();
  const markAllMutation = useMarkAllNotificationsReadMutation();
  const notifications: NotificationItem[] = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await markReadMutation.mutateAsync(n.id);
      } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await markAllMutation.mutateAsync();
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const markingAll = markAllMutation.isPending;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-2xl text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
            Notifications
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#475569' }}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAll}
            disabled={markingAll}
            className="text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}
          >
            {markingAll ? 'Marking…' : 'Mark all read'}
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)' }}>
        {[{ label: 'All', value: false }, { label: 'Unread', value: true }].map(tab => (
          <button
            key={String(tab.value)}
            onClick={() => { setUnreadOnly(tab.value); setPage(1); }}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: unreadOnly === tab.value ? 'rgba(99,102,241,0.2)' : 'transparent',
              color:      unreadOnly === tab.value ? '#a5b4fc' : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl"
              style={{ background: 'rgba(99,102,241,0.05)', animation: 'pulse 1.8s ease-in-out infinite' }} />
          ))
        ) : notifications.length === 0 ? (
          <div className="card flex flex-col items-center py-16 gap-3">
            <span style={{ fontSize: '40px' }}>🔔</span>
            <p className="font-semibold text-white">No notifications</p>
            <p className="text-sm" style={{ color: '#475569' }}>
              {unreadOnly ? 'No unread notifications.' : "You're all caught up!"}
            </p>
          </div>
        ) : (
          notifications.map((n, i) => (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => handleClick(n)}
              className="w-full text-left flex items-start gap-4 p-4 rounded-2xl transition-all"
              style={{
                background: n.isRead ? 'rgba(99,102,241,0.03)' : TYPE_BG[n.type],
                border: `1px solid ${n.isRead ? 'rgba(99,102,241,0.06)' : `${TYPE_DOT[n.type]}33`}`,
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.isRead ? 'rgba(99,102,241,0.03)' : TYPE_BG[n.type]}
            >
              {/* Icon dot */}
              <span className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-1.5"
                style={{ background: TYPE_DOT[n.type], boxShadow: `0 0 8px ${TYPE_DOT[n.type]}66` }} />

              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug"
                  style={{ color: n.isRead ? '#64748b' : '#e2e8f0', fontWeight: n.isRead ? 400 : 500 }}>
                  {n.message}
                </p>
                <p className="text-xs mt-1" style={{ color: '#334155' }}>{timeAgo(n.createdAt)}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {n.link && (
                  <span className="text-xs" style={{ color: '#475569' }}>→</span>
                )}
                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: '#6366f1', boxShadow: '0 0 6px rgba(99,102,241,0.6)' }} />
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm" style={{ color: '#475569' }}>Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >← Prev</button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

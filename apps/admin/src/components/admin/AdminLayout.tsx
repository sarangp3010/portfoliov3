import { useEffect, useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { PUBLIC_URL } from '../../config/urls';
import { Scene3D } from '../ui/Scene3D';
import { NotificationBell } from '../ui/NotificationBell';
import { CommandPalette } from '../ui/CommandPalette';

const navItems = [
  { section: 'Overview' },
  { to: '/',                    label: 'Dashboard',     icon: '⊞', end: true },
  { to: '/insights',            label: 'Insights',      icon: '✨' },
  { section: 'Analytics' },
  { to: '/analytics',           label: 'Analytics',     icon: '📈', end: true },
  { to: '/analytics/sessions',  label: 'Sessions',      icon: '🧭' },
  { section: 'Customers' },
  { to: '/customers',           label: 'Customers',     icon: '👥' },
  { to: '/payments',            label: 'Payments',      icon: '💳' },
  { section: 'Content' },
  { to: '/profile',             label: 'Profile',       icon: '👤' },
  { to: '/projects',            label: 'Projects',      icon: '🗂' },
  { to: '/blog',                label: 'Blog',          icon: '✍️' },
  { to: '/services',            label: 'Services',      icon: '💼' },
  { to: '/testimonials',        label: 'Testimonials',  icon: '💬' },
  { to: '/resume',              label: 'Resume',        icon: '📄' },
  { to: '/inquiries',           label: 'Inquiries',     icon: '📬' },
  { to: '/email-templates',     label: 'Email Templates', icon: '📧' },
  { section: 'Platform' },
  { to: '/page-sections',       label: 'Page Sections',   icon: '🎨' },
  { to: '/notifications',       label: 'Notifications',   icon: '🔔' },
  { to: '/theme',               label: 'Theme',         icon: '🎨' },
  { to: '/flags',               label: 'Feature Flags', icon: '🚩' },
  { to: '/diagnostics',         label: 'Diagnostics',   icon: '🔧' },
  { to: '/settings',            label: 'Settings',      icon: '⚙️' },
];

export const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSignOut = () => { signOut(); navigate('/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 14px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
            A
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
              {user?.name ?? 'Admin'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Portfolio Admin</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
        {navItems.map((item, i) => {
          if ('section' in item) {
            return (
              <p key={i} className="px-3 pt-4 pb-1 first:pt-2"
                style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155' }}>
                {item.section}
              </p>
            );
          }
          return (
            <NavLink key={item.to} to={item.to!} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}>
              <span className="text-base w-5 text-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
        <a href={PUBLIC_URL} target="_blank" rel="noreferrer"
          className="admin-nav-item flex items-center gap-2 text-sm cursor-pointer">
          <span className="text-base w-5 text-center">🌐</span>
          <span>View Public Site</span>
        </a>
        <button onClick={handleSignOut} className="admin-nav-item w-full text-left"
          style={{ color: '#f87171' }}>
          <span className="text-base w-5 text-center">⏻</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#03050f' }}>
      <Scene3D variant="dashboard" />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-60 fixed inset-y-0 left-0 z-40"
        style={{
          background: 'linear-gradient(180deg, rgba(10,13,26,0.97) 0%, rgba(5,7,15,0.98) 100%)',
          borderRight: '1px solid rgba(99,102,241,0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '4px 0 32px rgba(0,0,0,0.4)',
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)} />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden flex flex-col"
              style={{
                background: 'linear-gradient(180deg, rgba(10,13,26,0.99) 0%, rgba(5,7,15,1) 100%)',
                borderRight: '1px solid rgba(99,102,241,0.12)',
                backdropFilter: 'blur(24px)',
              }}>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        {/* Top header bar */}
        <header className="h-14 sticky top-0 z-30 flex items-center px-4 gap-4"
          style={{
            background: 'rgba(3,5,15,0.85)',
            borderBottom: '1px solid rgba(99,102,241,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 1px 0 rgba(99,102,241,0.06)',
          }}>
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#64748b' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="flex-1" />
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)', color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#94a3b8'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.12)'; e.currentTarget.style.color = '#475569'; }}
          >
            <span>🔍</span>
            <span>Search</span>
            <kbd className="text-xs px-1.5 py-0.5 rounded ml-1"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#334155' }}>
              ⌘K
            </kbd>
          </button>
          <NotificationBell notificationsPath="/notifications" />
          <span className="text-xs font-mono hidden sm:block" style={{ color: '#334155' }}>{user?.email}</span>
          <span className="badge-purple text-xs px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.25)', fontFamily: 'Outfit', fontWeight: 600 }}>
            Admin
          </span>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto page-enter">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
};

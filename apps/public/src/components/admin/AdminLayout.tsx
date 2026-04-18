import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { section: 'Overview' },
  { to: '/admin', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/admin/insights', label: 'Insights', icon: '✨' },
  { section: 'Analytics' },
  { to: '/admin/analytics', label: 'Analytics', icon: '📈', end: true },
  { to: '/admin/analytics/sessions', label: 'Sessions', icon: '🧭' },
  { section: 'Content' },
  { to: '/admin/profile', label: 'Profile', icon: '👤' },
  { to: '/admin/projects', label: 'Projects', icon: '🗂' },
  { to: '/admin/blog', label: 'Blog', icon: '✍️' },
  { to: '/admin/services', label: 'Services', icon: '💼' },
  { to: '/admin/testimonials', label: 'Testimonials', icon: '💬' },
  { to: '/admin/resume', label: 'Resume', icon: '📄' },
  { to: '/admin/inquiries', label: 'Inquiries', icon: '📬' },
  { section: 'Revenue' },
  { to: '/admin/payments', label: 'Payments', icon: '💳' },
  { section: 'Platform' },
  { to: '/admin/theme', label: 'Theme', icon: '🎨' },
  { to: '/admin/flags', label: 'Feature Flags', icon: '🚩' },
  { to: '/admin/diagnostics', label: 'Diagnostics', icon: '🔧' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export const AdminLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = () => { signOut(); navigate('/admin/login'); };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-bold text-white text-sm">A</div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">{user?.name ?? 'Admin'}</p>
            <p className="text-slate-500 text-xs mt-0.5">Portfolio Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {navItems.map((item, i) => {
          if ('section' in item) {
            return <p key={i} className="text-slate-600 text-[10px] font-semibold uppercase tracking-widest px-3 pt-4 pb-1 first:pt-2">{item.section}</p>;
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

      <div className="p-3 border-t border-slate-800 space-y-1">
        <NavLink to="/" target="_blank" className="admin-nav-item">
          <span className="text-base w-5 text-center">🌐</span>
          <span>View Site</span>
        </NavLink>
        <button onClick={handleSignOut} className="admin-nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <span className="text-base w-5 text-center">⏻</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:flex lg:flex-col w-60 bg-surface-900 border-r border-slate-800 fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.aside initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 bg-surface-900 border-r border-slate-800 z-50 lg:hidden flex flex-col">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 lg:pl-60 flex flex-col">
        <header className="h-14 border-b border-slate-800 bg-surface-900/50 backdrop-blur flex items-center px-4 gap-4 sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div className="flex-1" />
          <span className="text-slate-500 text-xs font-mono hidden sm:block">{user?.email}</span>
          <span className="badge-purple">Admin</span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

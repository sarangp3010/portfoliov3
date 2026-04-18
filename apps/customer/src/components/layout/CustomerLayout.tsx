import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCustomerAuth } from '../../context/AuthContext';
import { PUBLIC_URL } from '../../config/urls';
import { Scene3D } from '../ui/Scene3D';
import { Chatbot } from '../ui/Chatbot';
import { NotificationBell } from '../ui/NotificationBell';

const navItems = [
  { to: '/dashboard',       label: 'Dashboard',       icon: '⊞' },
  { to: '/notifications',   label: 'Notifications',   icon: '🔔' },
  { to: '/services',        label: 'Services',         icon: '💼' },
  { to: '/payments',        label: 'Payments',         icon: '💳' },
  { to: '/payment-methods', label: 'Payment Methods',  icon: '🪙' },
  { to: '/contact-admin',   label: 'Contact Admin',    icon: '💬' },
  { to: '/profile',         label: 'Profile',          icon: '👤' },
];

export const CustomerLayout = () => {
  const { customer, signOut } = useCustomerAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => { await signOut(); navigate('/login'); };

  const initials = customer?.name
    ? customer.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : 'CP';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5" style={{ borderBottom: '1px solid rgba(99,102,241,0.12)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
              fontFamily: 'Syne, Outfit, sans-serif',
            }}>
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-none truncate"
              style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
              {customer?.name}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: '#475569' }}>{customer?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
        <a href={PUBLIC_URL} target="_blank" rel="noreferrer" className="nav-link">
          <span className="text-base">🌐</span>
          <span>View Portfolio</span>
        </a>
        <button onClick={handleSignOut} className="nav-link w-full text-left"
          style={{ color: '#f87171' }}>
          <span className="text-base">⏻</span>
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
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 lg:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-64 z-50 lg:hidden flex flex-col"
              style={{
                background: 'linear-gradient(180deg, rgba(10,13,26,0.99) 0%, rgba(5,7,15,1) 100%)',
                borderRight: '1px solid rgba(99,102,241,0.12)',
                backdropFilter: 'blur(24px)',
              }}
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <header className="h-14 sticky top-0 z-30 flex items-center px-4 gap-4"
          style={{
            background: 'rgba(3,5,15,0.85)',
            borderBottom: '1px solid rgba(99,102,241,0.08)',
            backdropFilter: 'blur(20px)',
          }}>
          <button onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-lg transition-colors"
            style={{ color: '#64748b' }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <div className="text-sm font-semibold lg:hidden" style={{ color: '#94a3b8', fontFamily: 'Syne, sans-serif' }}>
            Customer Portal
          </div>
          <div className="flex-1" />
          <NotificationBell notificationsPath="/notifications" />
          <span className="text-xs font-mono hidden sm:block" style={{ color: '#334155' }}>{customer?.email}</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: 'rgba(6,182,212,0.12)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)', fontFamily: 'Outfit' }}>
            Customer
          </span>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">
          <Outlet />
        </main>
      </div>

      {/* AI assistant — customer context, forwards JWT for account-aware responses */}
      <Chatbot
        context="customer"
        authToken={localStorage.getItem('customer_token') ?? undefined}
      />
    </div>
  );
};

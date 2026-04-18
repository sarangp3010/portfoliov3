import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ADMIN_URL } from '../../config/urls';

const links = [
  { to: '/', label: 'Profile' },
  { to: '/blog', label: 'Blog' },
  { to: '/services', label: 'Services' },
  { to: '/testimonials', label: 'Testimonials' },
  { to: '/resume', label: 'Resume' },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => setOpen(false), [location]);

  return (
    <>
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-500"
        style={scrolled ? {
          background: 'rgba(3,5,15,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(99,102,241,0.1)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.05)',
        } : { background: 'transparent' }}
      >
        {/* Glow line at bottom when scrolled */}
        {scrolled && (
          <div className="absolute bottom-0 inset-x-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(6,182,212,0.3), transparent)' }} />
        )}

        <div className="container-max flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="font-display font-bold text-xl group flex items-center gap-1">
            <span style={{ color: '#818cf8', textShadow: '0 0 20px rgba(99,102,241,0.6)' }}>&lt;</span>
            <span className="text-white group-hover:text-slate-200 transition-colors">Dev</span>
            <span style={{ color: '#06b6d4', textShadow: '0 0 20px rgba(6,182,212,0.5)' }}>/&gt;</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className={({ isActive }) => `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-indigo-300 bg-indigo-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={({ isActive }) => isActive ? { boxShadow: '0 0 16px rgba(99,102,241,0.15)' } : {}}
              >
                {l.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a href={ADMIN_URL} target="_blank" rel="noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200"
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.2)',
                color: '#818cf8',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.15)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 0 16px rgba(99,102,241,0.2)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.08)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
              }}
            >
              Admin ↗
            </a>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: '#64748b' }}
            >
              <motion.svg animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}
                className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </motion.svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-16 inset-x-0 z-40 p-3 md:hidden"
            style={{
              background: 'rgba(3,5,15,0.96)',
              backdropFilter: 'blur(24px)',
              borderBottom: '1px solid rgba(99,102,241,0.1)',
              boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex flex-col gap-1">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} end={l.to === '/'}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive ? 'text-indigo-300 bg-indigo-500/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
              <div className="mt-1 pt-2" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
                <a href={ADMIN_URL} target="_blank" rel="noreferrer"
                  className="px-4 py-3 block text-sm transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
                >
                  Admin Panel ↗
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

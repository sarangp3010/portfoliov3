import { Link } from 'react-router-dom';

export const Footer = () => (
  <footer className="mt-auto" style={{ borderTop: '1px solid rgba(99,102,241,0.1)' }}>
    {/* Top glow line */}
    <div className="h-px w-full"
      style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), rgba(6,182,212,0.2), transparent)' }} />

    <div className="container-max py-10 flex flex-col sm:flex-row items-center justify-between gap-5">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <span className="font-display font-bold text-lg">
          <span style={{ color: '#818cf8', textShadow: '0 0 16px rgba(99,102,241,0.5)' }}>&lt;</span>
          <span className="text-white">Dev</span>
          <span style={{ color: '#06b6d4', textShadow: '0 0 16px rgba(6,182,212,0.4)' }}>/&gt;</span>
        </span>
        <span className="text-sm" style={{ color: '#334155' }}>Full-Stack Engineer</span>
      </div>

      {/* Nav links */}
      <div className="flex items-center gap-5 text-sm" style={{ color: '#475569' }}>
        {[['/', 'Profile'], ['/blog', 'Blog'], ['/services', 'Services'], ['/resume', 'Resume']].map(([to, label]) => (
          <Link key={to} to={to}
            className="transition-all duration-200 hover:-translate-y-0.5"
            style={{ color: '#475569' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#818cf8'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#475569'}
          >
            {label}
          </Link>
        ))}
      </div>

      <p className="text-xs font-mono" style={{ color: '#1e293b' }}>
        © {new Date().getFullYear()}
      </p>
    </div>
  </footer>
);

import { Link, useLocation } from 'react-router-dom';
import { ADMIN_URL, PUBLIC_URL } from '../../config/urls';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-0 overflow-hidden rounded-[32px] border border-sky-500/15 bg-slate-950/85 shadow-[0_35px_120px_rgba(2,6,23,0.8)] backdrop-blur-xl lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative p-8 sm:p-10 lg:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.24),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_42%)]" />
            <div className="relative">
              <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">
                Customer Portal
              </div>
              <div className="mt-8 text-7xl font-black leading-none text-white sm:text-8xl">404</div>
              <h1 className="mt-5 text-3xl font-bold text-white sm:text-5xl">
                That customer page isn’t here.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                The route <span className="rounded bg-white/5 px-2 py-1 font-mono text-sm text-sky-200">{location.pathname}</span> could not be found.
                You can return to the dashboard, view services, or jump back to the public portal.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/dashboard" className="btn-primary">
                  Open Dashboard
                </Link>
                <Link to="/services" className="btn-secondary">
                  View Services
                </Link>
              </div>
            </div>
          </div>

          <aside className="border-t border-white/10 bg-white/[0.03] p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Useful Shortcuts
              </p>
              <div className="mt-5 space-y-3">
                <Link to="/payments" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-400/10">
                  Payments
                </Link>
                <Link to="/contact-admin" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-sky-400/40 hover:bg-sky-400/10">
                  Contact Admin
                </Link>
                <a href={PUBLIC_URL} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-400/10">
                  Public Portal
                </a>
                <a href={ADMIN_URL} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10">
                  Admin Portal
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

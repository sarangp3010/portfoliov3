import { Link, useLocation } from 'react-router-dom';
import { ADMIN_URL, PUBLIC_URL } from '../../config/urls';

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center">
        <div className="grid w-full gap-0 overflow-hidden rounded-[32px] border border-indigo-500/15 bg-slate-950/85 shadow-[0_35px_120px_rgba(2,6,23,0.8)] backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative p-8 sm:p-10 lg:p-14">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.26),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_45%)]" />
            <div className="relative">
              <div className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-indigo-200">
                Admin Panel
              </div>
              <div className="mt-8 text-7xl font-black leading-none text-white sm:text-8xl">404</div>
              <h1 className="mt-5 text-3xl font-bold text-white sm:text-5xl">
                This admin route is not available.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                We couldn’t find <span className="rounded bg-white/5 px-2 py-1 font-mono text-sm text-indigo-200">{location.pathname}</span>.
                You can return to the dashboard, head to login, or open the public portal.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/" className="btn-primary">
                  Back To Dashboard
                </Link>
                <Link to="/login" className="btn-secondary">
                  Go To Login
                </Link>
              </div>
            </div>
          </div>

          <aside className="border-t border-white/10 bg-white/[0.03] p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
            <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Suggested Destinations
              </p>
              <div className="mt-5 space-y-3">
                <Link to="/analytics" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-400/10">
                  Analytics
                </Link>
                <Link to="/inquiries" className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-400/10">
                  Inquiries
                </Link>
                <a href={PUBLIC_URL} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10">
                  Public Portal
                </a>
                <a href={ADMIN_URL} className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/10">
                  Admin Home
                </a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

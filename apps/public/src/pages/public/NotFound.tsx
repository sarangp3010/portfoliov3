import { Link, useLocation } from 'react-router-dom';
import { ADMIN_URL, CUSTOMER_URL } from '../../config/urls';

export default function NotFound() {
  const location = useLocation();

  return (
    <section className="section min-h-[calc(100vh-10rem)] flex items-center">
      <div className="container-max">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[32px] border border-indigo-500/20 bg-slate-950/80 shadow-[0_30px_120px_rgba(15,23,42,0.65)] backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-8 sm:p-10 lg:p-14">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.14),transparent_40%)]" />
              <div className="relative">
                <div className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                  Public Portal
                </div>
                <div className="mt-8 text-7xl font-black leading-none text-white sm:text-8xl">404</div>
                <h1 className="mt-5 max-w-xl text-3xl font-bold text-white sm:text-5xl">
                  This page drifted out of the portfolio map.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  The route <span className="rounded bg-white/5 px-2 py-1 font-mono text-sm text-cyan-200">{location.pathname}</span> does not exist on the public site.
                  You can jump back to the homepage, explore services, or switch into another portal.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/" className="btn-primary">
                    Go To Homepage
                  </Link>
                  <Link to="/services" className="btn-outline">
                    Browse Services
                  </Link>
                </div>
              </div>
            </div>

            <aside className="border-t border-white/10 bg-white/[0.03] p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                  Quick Routes
                </p>
                <div className="mt-5 space-y-3">
                  <a
                    href={ADMIN_URL}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-indigo-400/40 hover:bg-indigo-400/10"
                  >
                    Admin Portal
                    <div className="mt-1 text-slate-400">Manage content, analytics, and operations.</div>
                  </a>
                  <a
                    href={CUSTOMER_URL}
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-200 transition hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    Customer Portal
                    <div className="mt-1 text-slate-400">Access payments, services, and notifications.</div>
                  </a>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-white/10 px-4 py-4 text-sm text-slate-400">
                  Tip: if you followed an old bookmark, the destination may have moved during a portal update.
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

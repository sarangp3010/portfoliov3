import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getTestimonials } from '../../api';
import { Testimonial } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';

const Stars = ({ n }: { n: number }) => (
  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <span key={i} className={i <= n ? 'text-amber-400' : 'text-slate-700'}>★</span>)}</div>
);

const Avatar = ({ name, url }: { name: string; url?: string }) => {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
  if (url) return <img src={url} alt={name} className="w-12 h-12 rounded-full object-cover border border-slate-700" />;
  return <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white font-bold text-sm font-display shrink-0">{initials}</div>;
};

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTestimonials().then(r => setTestimonials(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const featured = testimonials.filter(t => t.featured);
  const rest = testimonials.filter(t => !t.featured);

  return (
    <>
      <Helmet><title>Testimonials — What People Say</title></Helmet>
      <section className="section">
        <div className="container-max">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
            <p className="section-label mb-4">Social Proof</p>
            <h1 className="font-display text-5xl font-bold text-white mb-4">What People Say</h1>
            <p className="text-slate-400 max-w-md mx-auto text-lg">Feedback from managers, teammates, and clients I've had the pleasure of working with.</p>
          </motion.div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {featured.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="card-hover p-7 flex flex-col relative group">
                  <span className="absolute top-5 right-6 text-7xl text-accent/5 font-serif leading-none select-none group-hover:text-accent/10 transition-colors">"</span>
                  <Stars n={t.rating} />
                  <blockquote className="text-slate-400 text-sm leading-relaxed my-5 flex-1">"{t.content}"</blockquote>
                  <div className="flex items-center gap-3 pt-5 border-t border-slate-800">
                    <Avatar name={t.name} url={t.avatarUrl} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.role} · {t.company}</p>
                    </div>
                    {t.linkedinUrl && (
                      <a href={t.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-accent transition-colors" title="LinkedIn">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {rest.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  className="card p-5 flex gap-4">
                  <Avatar name={t.name} url={t.avatarUrl} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div><p className="font-medium text-white text-sm">{t.name}</p><p className="text-slate-500 text-xs">{t.role} · {t.company}</p></div>
                      <Stars n={t.rating} />
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">"{t.content}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {testimonials.length === 0 && <p className="text-center py-20 text-slate-500">No testimonials yet.</p>}

          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mt-16 text-center">
            <p className="text-slate-600 text-sm mb-6">More recommendations on <a href="https://linkedin.com/in/yourname" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">LinkedIn ↗</a></p>
            <Link to="/services" className="btn-primary">Work With Me →</Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}

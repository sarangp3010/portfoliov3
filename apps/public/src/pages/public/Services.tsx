import { FormEvent, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { submitInquiry, createCheckout } from '../../api';
import { Service, ServicePlan } from '../../types';
import { PageLoader } from '../../components/ui/Spinner';
import { trackServicePageVisit, trackServiceInquiryOpen, trackInquirySubmit } from '../../hooks/useTracker';
import { CUSTOMER_URL } from '../../config/urls';
import { useServicePlansQuery, useServicesQuery } from '../../hooks/queries/usePublicQueries';

const PROCESS_STEPS = [
  { icon: '🤝', n: '01', title: 'Discovery Call',  desc: 'We discuss your goals, timeline, and requirements. No commitment, 30 minutes.' },
  { icon: '📋', n: '02', title: 'Proposal',         desc: 'Fixed-price proposal with clear scope, milestones, and delivery timeline.' },
  { icon: '⚡', n: '03', title: 'Build',             desc: 'Weekly progress updates, live previews, iterative refinement.' },
  { icon: '🚀', n: '04', title: 'Launch',            desc: 'Deployed, documented, fully handed over. Code is yours.' },
];

const FAQS = [
  { q: 'How do we get started?',    a: "Fill in the inquiry form with your project details. I'll reply within 24 hours to schedule a discovery call." },
  { q: 'Do you work with teams?',   a: 'Both. I work independently on smaller projects and can embed with existing teams as a contractor for larger ones.' },
  { q: 'What if scope changes?',    a: 'We agree on a scope change document before any extra work begins. No hidden charges — ever.' },
  { q: 'Do you offer maintenance?', a: 'Yes — the Enterprise retainer includes ongoing support. Ad-hoc maintenance is also available for past clients.' },
  { q: 'Can I pay directly without an inquiry?', a: "Yes! Select any plan and click Pay Now. You'll be taken to the customer portal to log in and pay securely — no inquiry required." },
];

// ─── Redirect to Customer Portal ─────────────────────────────────────────────
// "Pay Now" on the public site takes the visitor to the customer portal,
// passing the plan ID as a query param so the portal pre-selects it.
function goToCustomerPortal(plan: ServicePlan) {
  const url = `${CUSTOMER_URL}/services?plan=${encodeURIComponent(plan.id)}`;
  window.location.href = url;
}

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, index, onGetQuote }: {
  plan: ServicePlan;
  index: number;
  onGetQuote: (name: string) => void;
}) {
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 180, damping: 20 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative flex flex-col rounded-2xl border overflow-hidden
        ${plan.popular
          ? 'border-accent/50 bg-gradient-to-b from-accent/8 via-surface-900 to-surface-900 shadow-xl shadow-accent/10'
          : 'border-slate-800 bg-surface-900 hover:border-slate-700 transition-colors'
        }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className={`text-center text-xs font-bold py-2.5 tracking-widest uppercase
          ${plan.popular ? 'bg-accent text-white' : 'bg-slate-800/80 text-slate-400'}`}>
          {plan.badge}
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        <h3 className="font-display text-xl font-bold text-white mb-1.5">{plan.name}</h3>
        <p className="text-slate-500 text-sm mb-5 leading-relaxed">{plan.description}</p>

        <div className="mb-6">
          <span className={`font-display text-4xl font-black ${plan.popular ? 'text-accent' : 'text-white'}`}>
            {fmt(plan.price)}
          </span>
          {plan.id === 'custom' && <span className="text-slate-500 text-sm ml-2">deposit</span>}
        </div>

        <ul className="space-y-2.5 flex-1 mb-7">
          {plan.features.map(f => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
              <span className={`mt-0.5 shrink-0 text-xs font-bold ${plan.popular ? 'text-accent' : 'text-emerald-400'}`}>✓</span>
              {f}
            </li>
          ))}
        </ul>

        <div className="space-y-2.5">
          {/* Pay Now → customer portal with plan pre-selected */}
          <button
            onClick={() => goToCustomerPortal(plan)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200
              ${plan.popular
                ? 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25 hover:shadow-accent/40'
                : 'bg-white/8 hover:bg-white/14 text-white border border-slate-700 hover:border-slate-500'
              }`}
          >
            💳 Pay Now
          </button>
          <button
            onClick={() => onGetQuote(plan.name)}
            className="w-full text-slate-500 hover:text-slate-300 text-xs py-2 transition-colors"
          >
            Prefer to discuss first? Get a quote →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Services() {
  const { data: services = [], isLoading: servicesLoading } = useServicesQuery();
  const { data: plans = [], isLoading: plansLoading } = useServicePlansQuery();
  const loading = servicesLoading || plansLoading;
  const [openFaq, setOpenFaq]       = useState<number | null>(null);

  const [form, setForm]       = useState({ name: '', email: '', subject: '', message: '', serviceType: '', budget: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);
  const [payStep, setPayStep] = useState<'idle' | 'pay'>('idle');
  const [inquiryId, setInquiryId] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    trackServicePageVisit();
  }, []);

  const scrollToInquiry = (serviceName: string) => {
    setForm(f => ({ ...f, serviceType: serviceName, subject: `${serviceName} Package Inquiry` }));
    trackServiceInquiryOpen(serviceName);
    setTimeout(() => document.getElementById('inquiry')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Client-side validation
    if (!form.name?.trim()) { setError('Please enter your name.'); return; }
    if (!form.email?.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) { setError('Please enter a valid email address.'); return; }
    if (!form.subject?.trim()) { setError('Please enter a subject.'); return; }
    if (!form.message?.trim() || form.message.trim().length < 20) { setError('Please describe your project (at least 20 characters).'); return; }

    setSending(true); setError('');
    try {
      const r = await submitInquiry(form);
      trackInquirySubmit();
      setInquiryId(r.data?.data?.id ?? '');
      setSent(true);
      if (form.serviceType) setPayStep('pay');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Something went wrong. Please try again.');
    } finally { setSending(false); }
  };

  const handleInquiryPay = async (amount: number) => {
    setSending(true);
    try {
      const r = await createCheckout({
        type: 'service', amount,
        description: `${form.serviceType} — Deposit`,
        customerName: form.name, customerEmail: form.email,
        serviceName: form.serviceType, inquiryId,
        paymentSource: 'inquiry',
      });
      window.location.href = r.data.data.url;
    } catch {
      setError('Unable to start checkout. Please contact me directly.');
      setSending(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <>
      <Helmet><title>Services & Pricing — Work With Me</title></Helmet>

      {/* ── Hero ── */}
      <section className="section pb-0">
        <div className="container-max text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="section-label mb-4">Work With Me</p>
            <h1 className="font-display text-5xl font-bold text-white mb-5">Services & Pricing</h1>
            <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
              Fixed-price packages. No hourly tracking, no scope creep —<br className="hidden sm:block" />
              just clean code and clear deliverables.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-7 text-sm text-slate-500">
              <span>🔒 Secure Stripe checkout</span>
              <span>⚡ Pay directly — no inquiry required</span>
              <span>💬 Or get a custom quote first</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Direct Payment Plans ── */}
      <section className="section">
        <div className="container-max">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="section-label mb-3">Transparent Pricing</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">Pay Now, Start Today</h2>
            <p className="text-slate-400 max-w-lg mx-auto text-sm">
              Select a plan and pay directly with a card — no back and forth required.
              Or click <span className="text-slate-300 font-medium">Get a quote</span> to discuss first.
            </p>
          </motion.div>

          {plans.length > 0 ? (
            <div className={`grid gap-6 ${
              plans.length <= 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
              plans.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
            }`}>
              {plans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} index={i} onGetQuote={scrollToInquiry} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">Payment plans loading…</p>
            </div>
          )}

          <p className="text-center text-slate-600 text-sm mt-7">
            All prices in USD · Secure checkout via Stripe · Receipt emailed automatically
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="container-max">
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-600 text-xs font-mono uppercase tracking-widest px-2">Service Packages</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>
      </div>

      {/* ── Legacy service cards ── */}
      <section className="section pt-8">
        <div className="container-max">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
            <h2 className="font-display text-3xl font-bold text-white mb-3">Prefer to Discuss First?</h2>
            <p className="text-slate-400 max-w-md mx-auto text-sm">
              Click <span className="text-slate-300 font-medium">Get Started</span> on any package to send an inquiry and discuss your exact needs before committing.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {services.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className={`relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-accent/5
                  ${s.popular ? 'border-accent/30 bg-gradient-to-b from-accent/5 to-surface-900' : 'border-slate-800 bg-surface-900 hover:border-slate-700'}`}
              >
                {s.popular && (
                  <div className="bg-accent/20 border-b border-accent/20 text-accent text-center text-xs font-bold py-2 tracking-widest uppercase">Most Popular</div>
                )}
                <div className="p-7 flex flex-col flex-1">
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-2">{s.tier}</p>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">{s.title}</h3>
                  <p className="text-slate-500 text-sm mb-6 leading-relaxed">{s.description}</p>
                  <div className="mb-7">
                    <span className={`font-display text-4xl font-black ${s.popular ? 'text-accent' : 'text-white'}`}>{s.price}</span>
                    {s.priceNote && <span className="text-slate-500 text-sm ml-2">{s.priceNote}</span>}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-7">
                    {s.features.map(f => (
                      <li key={f} className="flex items-start gap-3 text-sm text-slate-400">
                        <span className="text-accent mt-0.5 shrink-0 font-bold text-xs">✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => scrollToInquiry(s.title)} className={s.popular ? 'btn-primary justify-center text-sm' : 'btn-outline justify-center text-sm'}>
                    {s.ctaLabel || 'Get Started'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section border-t border-slate-800/50">
        <div className="container-max">
          <div className="text-center mb-14">
            <p className="section-label mb-4">How It Works</p>
            <h2 className="font-display text-4xl font-bold text-white">Simple, transparent process</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div key={step.n} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-6">
                <div className="text-3xl mb-4">{step.icon}</div>
                <p className="font-mono text-accent text-xs mb-2">{step.n}</p>
                <h3 className="font-display font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="section border-t border-slate-800/50">
        <div className="container-max max-w-2xl">
          <div className="text-center mb-12">
            <p className="section-label mb-4">FAQ</p>
            <h2 className="font-display text-4xl font-bold text-white">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full px-6 py-4 text-left flex items-center justify-between gap-4">
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 180 : 0 }} className="text-accent text-lg shrink-0">↓</motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                      <p className="px-6 pb-5 text-slate-400 text-sm leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inquiry Form ── */}
      <section id="inquiry" className="section border-t border-slate-800/50">
        <div className="container-max max-w-2xl">
          <div className="text-center mb-12">
            <p className="section-label mb-4">Get In Touch</p>
            <h2 className="font-display text-4xl font-bold text-white">Start a Conversation</h2>
            <p className="text-slate-400 mt-4 text-sm">Tell me about your project. I'll reply within 24 hours.</p>
          </div>

          {sent ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
              {payStep === 'pay' ? (
                <div className="space-y-6">
                  <div className="text-5xl mb-2">🎉</div>
                  <div>
                    <h3 className="font-display text-2xl font-bold text-white mb-2">Inquiry Received!</h3>
                    <p className="text-slate-400 text-sm">Ready to move forward? Secure your spot with a deposit.</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-2xl p-5 space-y-3">
                    <p className="text-slate-300 font-medium">{form.serviceType}</p>
                    <p className="text-slate-500 text-sm">Choose a deposit amount:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[25000, 50000, 100000].map(amt => (
                        <button key={amt} onClick={() => handleInquiryPay(amt)} disabled={sending}
                          className="bg-accent/15 border border-accent/30 text-accent rounded-xl py-3 text-sm font-bold hover:bg-accent/25 transition-colors disabled:opacity-50">
                          ${(amt / 100).toLocaleString()}
                        </button>
                      ))}
                    </div>
                    <p className="text-slate-600 text-xs">Secure Stripe checkout · SSL encrypted</p>
                  </div>
                  <button onClick={() => { setSent(false); setPayStep('idle'); setForm({ name:'',email:'',subject:'',message:'',serviceType:'',budget:'' }); }}
                    className="text-slate-500 text-sm hover:text-slate-300 transition-colors">
                    Skip for now — I'll wait for your reply
                  </button>
                </div>
              ) : (
                <div>
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="font-display text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-slate-400 text-sm">Thanks for reaching out. I'll get back to you within 24–48 hours.</p>
                  <button onClick={() => { setSent(false); setForm({ name:'',email:'',subject:'',message:'',serviceType:'',budget:'' }); }} className="btn-outline mt-6 text-sm px-4 py-2">
                    Send Another
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.form initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} onSubmit={handleSubmit} className="card p-8 space-y-5">
              {services.length > 0 && (
                <div>
                  <label className="label">Interested In</label>
                  <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value, subject: e.target.value ? `${e.target.value} Package Inquiry` : f.subject }))} className="input">
                    <option value="">Select a service (optional)</option>
                    {services.map(s => <option key={s.id} value={s.title}>{s.title} — {s.price}</option>)}
                  </select>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name *</label>
                  <input className="input" placeholder="Your name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="label">Subject *</label>
                <input className="input" placeholder="What's this about?" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} required />
              </div>
              <div>
                <label className="label">Message *</label>
                <textarea className="input resize-none" rows={5} placeholder="Tell me about your project, timeline, and budget…" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} required />
              </div>
              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={sending} className="btn-primary w-full justify-center py-3.5">
                {sending ? 'Sending…' : 'Send Message →'}
              </button>
            </motion.form>
          )}
        </div>
      </section>
    </>
  );
}

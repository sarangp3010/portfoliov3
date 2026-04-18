import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { getPaymentStatus } from '../../api';
import { downloadReceiptPDF } from '../../utils/pdf';
import { CUSTOMER_URL } from '../../config/urls';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    let attempts = 0;
    const poll = () => {
      getPaymentStatus(sessionId).then(r => {
        const d = r.data.data;
        if (d.status === 'PENDING' && attempts < 6) {
          attempts++;
          setTimeout(poll, 2000);
        } else {
          setPayment(d.payment ?? { status: d.status, amount: null });
          setLoading(false);
        }
      }).catch(() => setLoading(false));
    };
    poll();
  }, [sessionId]);

  const fmt = (cents: number, currency = 'usd') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

  const isDirect = payment?.paymentSource === 'direct';

  return (
    <>
      <Helmet><title>Payment Confirmed</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="card p-10 max-w-md w-full text-center">
          {loading ? (
            <div className="space-y-4">
              <div className="w-16 h-16 rounded-full border-4 border-accent/30 border-t-accent animate-spin mx-auto" />
              <p className="text-slate-400">Confirming your payment…</p>
              <p className="text-slate-600 text-xs">This usually takes just a moment.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success icon */}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <span className="text-4xl">✓</span>
              </motion.div>

              {/* Heading + context */}
              <div>
                <h1 className="font-display text-2xl font-bold text-white mb-2">Payment Confirmed!</h1>
                {isDirect ? (
                  <p className="text-slate-400 text-sm">
                    You're all set. I'll be in touch within 24 hours to kick things off.
                    A confirmation email with your receipt is on its way.
                  </p>
                ) : (
                  <p className="text-slate-400 text-sm">
                    Deposit received. I'll follow up on your inquiry shortly to get started.
                  </p>
                )}
              </div>

              {/* Source badge */}
              {payment?.paymentSource && (
                <div className="flex justify-center">
                  <span className={`text-xs px-3 py-1.5 rounded-full font-medium border ${
                    isDirect
                      ? 'text-accent bg-accent/10 border-accent/25'
                      : 'text-purple-400 bg-purple-500/10 border-purple-500/25'
                  }`}>
                    {isDirect ? '⚡ Direct Payment' : '💬 Inquiry Deposit'}
                  </span>
                </div>
              )}

              {/* Payment details */}
              {payment?.amount && (
                <div className="bg-slate-800/50 rounded-xl p-4 text-sm space-y-2.5 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white font-mono font-bold">{fmt(payment.amount, payment.currency)}</span>
                  </div>
                  {payment.description && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">For</span>
                      <span className="text-slate-200 text-right max-w-[200px]">{payment.description}</span>
                    </div>
                  )}
                  {payment.serviceName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Service</span>
                      <span className="text-slate-200">{payment.serviceName}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-700/50 pt-2.5">
                    <span className="text-slate-400">Status</span>
                    <span className="text-emerald-400 font-medium">Completed ✓</span>
                  </div>
                </div>
              )}

              {/* What's next */}
              {isDirect && (
                <div className="bg-slate-800/30 rounded-xl p-4 text-left space-y-2">
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-widest mb-3">What happens next</p>
                  {[
                    "You'll receive a receipt confirmation email",
                    "I'll review your payment and reach out within 24h",
                    "We'll schedule a kickoff call to align on scope",
                  ].map((step, i) => (
                    <p key={i} className="text-slate-400 text-xs flex gap-2">
                      <span className="text-accent font-bold shrink-0">{i + 1}.</span> {step}
                    </p>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2.5">
                {payment && (
                  <button onClick={() => downloadReceiptPDF(payment)} className="btn-outline py-2.5 text-sm w-full justify-center">
                    📥 Download Receipt PDF
                  </button>
                )}
                <Link to="/" className="btn-primary py-2.5 text-sm text-center">Back to Portfolio</Link>
                <a href={`${CUSTOMER_URL}/payments`} className="btn-ghost py-2.5 text-sm text-center">
                  View in Customer Portal →
                </a>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { getServicePlans, createCheckout } from '../../api';
import { ServicePlan } from '../../types';
import { loadStripe } from '@stripe/stripe-js';

const fmt = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export default function Services() {
  const [plans, setPlans] = useState<ServicePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  // ?plan=<id> is passed by the public site's "Pay Now" buttons
  const highlightedPlanId = searchParams.get('plan');

  useEffect(() => {
    getServicePlans()
      .then(r => setPlans(r.data.data || []))
      .finally(() => setLoading(false));
  }, []);

  // Scroll the pre-selected plan into view once plans are loaded
  useEffect(() => {
    if (!highlightedPlanId || loading) return;
    setTimeout(() => {
      document.getElementById(`plan-${highlightedPlanId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }, [highlightedPlanId, loading]);

  const handlePay = async (plan: ServicePlan) => {
    setError('');
    setPurchasing(plan.id);
    try {
      const r = await createCheckout({ planId: plan.id, planName: plan.name, amount: plan.price });
      const { sessionId, publishableKey } = r.data.data;
      const stripe = await loadStripe(publishableKey);
      await stripe?.redirectToCheckout({ sessionId });
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || 'Checkout failed. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Service Plans</h1>
        <p className="text-gray-400 mt-1">Choose a plan that fits your project needs.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="card h-80 animate-pulse bg-gray-800" />)}
        </div>
      ) : plans.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No service plans available right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const isHighlighted = plan.id === highlightedPlanId;
            return (
              <motion.div
                key={plan.id}
                id={`plan-${plan.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative card flex flex-col transition-all ${
                  isHighlighted
                    ? 'border-indigo-400/70 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-500/10'
                    : plan.popular
                    ? 'border-indigo-500/50 ring-1 ring-indigo-500/30'
                    : ''
                }`}
              >
                {isHighlighted && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-full">
                      ✦ Selected from portfolio
                    </span>
                  </div>
                )}
                {plan.popular && !isHighlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">Most Popular</span>
                  </div>
                )}
                {plan.badge && !plan.popular && !isHighlighted && (
                  <div className="absolute -top-3 left-4">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-semibold rounded-full">{plan.badge}</span>
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{plan.description}</p>
                  <div className="mt-4 mb-5">
                    <span className="text-3xl font-bold text-white">{plan.priceLabel}</span>
                  </div>
                  <ul className="space-y-2">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                        <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePay(plan)}
                  disabled={purchasing === plan.id}
                  className={`mt-6 w-full py-3 rounded-lg font-medium text-sm transition-all ${
                    isHighlighted
                      ? 'bg-indigo-500 hover:bg-indigo-400 text-white ring-1 ring-indigo-400/50'
                      : plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white'
                  } disabled:opacity-50`}
                >
                  {purchasing === plan.id ? 'Redirecting…' : `Pay ${fmt(plan.price)}`}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <p className="text-center text-gray-600 text-sm">
        Need something custom?{' '}
        <a href="/contact-admin" className="text-indigo-400 hover:text-indigo-300">Contact us</a>
      </p>
    </div>
  );
}

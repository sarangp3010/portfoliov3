import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#03050f' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="card">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background: 'rgba(34,197,94,0.1)',
              border: '1px solid rgba(34,197,94,0.2)',
              boxShadow: '0 0 30px rgba(34,197,94,0.15)',
            }}>
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
            Payment Successful!
          </h1>
          <p className="mb-6 text-sm" style={{ color: '#475569' }}>
            Your payment has been processed. You'll receive a confirmation email shortly.
          </p>
          {sessionId && (
            <p className="text-xs font-mono mb-6" style={{ color: '#334155' }}>
              Session: {sessionId.slice(-16)}
            </p>
          )}
          <div className="space-y-3">
            <Link to="/payments" className="btn-primary w-full block py-3">View Payment History</Link>
            <Link to="/dashboard" className="btn-secondary w-full block py-3">Back to Dashboard</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

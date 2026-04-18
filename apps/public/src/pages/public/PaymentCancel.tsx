import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function PaymentCancel() {
  return (
    <>
      <Helmet><title>Payment Cancelled</title></Helmet>
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="card p-10 max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto">
            <span className="text-4xl">✕</span>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">Payment Cancelled</h1>
            <p className="text-slate-400 text-sm">Your payment was not completed. No charge was made.</p>
          </div>
          <div className="flex flex-col gap-2">
            <Link to="/services" className="btn-primary py-2.5 text-sm">Try Again</Link>
            <Link to="/"         className="btn-ghost py-2.5 text-sm">Back to Home</Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

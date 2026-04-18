import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { sendMessage } from '../../api';

export default function ContactAdmin() {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) { setError('Please write at least 10 characters.'); return; }
    setError('');
    setLoading(true);
    try {
      await sendMessage(message.trim());
      setSent(true);
      setMessage('');
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
          Contact Admin
        </h1>
        <p className="mt-1 text-sm" style={{ color: '#475569' }}>
          Send a message directly to the developer.
        </p>
      </div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card text-center py-12"
        >
          <p className="text-4xl mb-4">✅</p>
          <h2 className="text-xl font-semibold text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Message Sent!
          </h2>
          <p className="mb-6 text-sm" style={{ color: '#475569' }}>
            The admin will get back to you via email soon.
          </p>
          <button onClick={() => setSent(false)} className="btn-secondary">Send Another</button>
        </motion.div>
      ) : (
        <div className="card">
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Message</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={8}
                className="input resize-none"
                placeholder="Describe your question, feedback, or request in detail…"
                required
              />
              <p className="text-xs mt-1" style={{ color: '#334155' }}>{message.length} characters</p>
            </div>
            <button type="submit" disabled={loading || message.trim().length < 10} className="btn-primary w-full py-3">
              {loading ? 'Sending…' : '✉️ Send Message'}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ background: 'rgba(99,102,241,0.04)' }}>
        <p className="text-sm" style={{ color: '#64748b' }}>
          <span className="font-medium text-white">Response time:</span>{' '}
          Typically within 24–48 hours during business days. For urgent matters, please mention it in your message.
        </p>
      </div>
    </div>
  );
}

/**
 * useToast.ts — lightweight toast notification hook
 * Usage:
 *   const { toast, showToast } = useToast();
 *   showToast('Saved!');          // success (default)
 *   showToast('Error', 'error');
 *   // In JSX: <Toast toast={toast} />
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  message: string;
  type: ToastType;
  id: number;
}

const TYPE_STYLE: Record<ToastType, { border: string; color: string; icon: string }> = {
  success: { border: 'rgba(74,222,128,0.25)',  color: '#4ade80', icon: '✓' },
  error:   { border: 'rgba(248,113,113,0.25)', color: '#f87171', icon: '✕' },
  warning: { border: 'rgba(251,191,36,0.25)',  color: '#fbbf24', icon: '⚠' },
  info:    { border: 'rgba(99,102,241,0.25)',  color: '#a5b4fc', icon: 'ℹ' },
};

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => setToast(t => t?.id === id ? null : t), 3500);
  }, []);

  return { toast, showToast };
}

export function Toast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium pointer-events-none"
          style={{
            background: 'rgba(8,10,20,0.97)',
            border: `1px solid ${TYPE_STYLE[toast.type].border}`,
            color: '#e2e8f0',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            maxWidth: '320px',
          }}
        >
          <span className="font-bold text-base flex-shrink-0"
            style={{ color: TYPE_STYLE[toast.type].color }}>
            {TYPE_STYLE[toast.type].icon}
          </span>
          <span>{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

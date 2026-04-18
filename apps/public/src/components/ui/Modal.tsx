import { ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.1 }}
            className={`relative w-full ${widths[size]} bg-surface-900 border border-slate-700/60 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col`}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-lg font-display font-bold text-white">{title}</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface ConfirmProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  danger?: boolean;
}

export const ConfirmDialog = ({ open, onConfirm, onCancel, title = 'Are you sure?', message = 'This action cannot be undone.', confirmLabel = 'Delete', danger = true }: ConfirmProps) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="text-slate-400 mb-6">{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="btn-outline text-sm px-4 py-2">Cancel</button>
      <button onClick={onConfirm} className={`btn text-sm px-4 py-2 ${danger ? 'btn-danger' : 'btn-primary'}`}>{confirmLabel}</button>
    </div>
  </Modal>
);

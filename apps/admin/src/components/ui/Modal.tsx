import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ open, onClose, title, children, size = 'md' }: ModalProps) => {
  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Escape key closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const widths = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  // Render into document.body via portal so fixed positioning is
  // always relative to the viewport, not the scrolling admin container
  return createPortal(
    <AnimatePresence>
      {open && (
        // Outer: full-viewport overlay, flex-centered
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ isolation: 'isolate' }}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
            className={`relative w-full ${widths[size]} flex flex-col`}
            style={{
              background: 'linear-gradient(135deg, rgba(10,13,26,0.98), rgba(5,7,15,0.99))',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px',
              boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.05)',
              maxHeight: '90vh',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top glow line */}
            <div className="absolute top-0 inset-x-0 h-px rounded-t-[20px]"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.5), rgba(6,182,212,0.3), transparent)' }} />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
              style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Syne, Outfit, sans-serif' }}>
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg transition-all duration-200"
                style={{ color: '#64748b' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.color = '#fff';
                  (e.currentTarget as HTMLElement).style.background = 'rgba(99,102,241,0.1)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.color = '#64748b';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable content */}
            <div className="p-6 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
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

export const ConfirmDialog = ({
  open, onConfirm, onCancel,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  danger = true,
}: ConfirmProps) => (
  <Modal open={open} onClose={onCancel} title={title} size="sm">
    <p className="mb-6" style={{ color: '#64748b' }}>{message}</p>
    <div className="flex gap-3 justify-end">
      <button onClick={onCancel} className="btn-outline text-sm px-4 py-2">Cancel</button>
      <button onClick={onConfirm} className={`btn text-sm px-4 py-2 ${danger ? 'btn-danger' : 'btn-primary'}`}>
        {confirmLabel}
      </button>
    </div>
  </Modal>
);

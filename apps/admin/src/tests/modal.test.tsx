/**
 * src/tests/modal.test.tsx
 * Tests: Modal open/close, Escape key, body scroll lock, ConfirmDialog
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal, ConfirmDialog } from '../components/ui/Modal';

// framer-motion: render children immediately (no animation delay in tests)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Modal ─────────────────────────────────────────────────────────────────────

describe('Modal', () => {
  const onClose = vi.fn();

  beforeEach(() => onClose.mockReset());

  it('renders nothing when open=false', () => {
    render(
      <Modal open={false} onClose={onClose} title="Test">
        <p>Content</p>
      </Modal>
    );
    expect(screen.queryByText('Test')).toBeNull();
    expect(screen.queryByText('Content')).toBeNull();
  });

  it('renders title and children when open=true', () => {
    render(
      <Modal open={true} onClose={onClose} title="My Dialog">
        <p>Dialog body</p>
      </Modal>
    );
    expect(screen.getByText('My Dialog')).toBeInTheDocument();
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  it('calls onClose when the × button is clicked', async () => {
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>content</p>
      </Modal>
    );
    // The close button contains an SVG — find button by its role
    const closeBtn = screen.getByRole('button');
    await userEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does NOT call onClose on Escape when closed', () => {
    render(
      <Modal open={false} onClose={onClose} title="Test">
        <p>content</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('sets body overflow to hidden when open', () => {
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>x</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body overflow when unmounted', () => {
    document.body.style.overflow = '';
    const { unmount } = render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>x</p>
      </Modal>
    );
    expect(document.body.style.overflow).toBe('hidden');
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('does not call onClose for non-Escape keys', () => {
    render(
      <Modal open={true} onClose={onClose} title="Test">
        <p>x</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

describe('ConfirmDialog', () => {
  const onConfirm = vi.fn();
  const onCancel  = vi.fn();

  beforeEach(() => { onConfirm.mockReset(); onCancel.mockReset(); });

  it('shows title and message', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        title="Delete item?"
        message="This cannot be undone."
      />
    );
    expect(screen.getByText('Delete item?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', async () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmLabel="Yes, delete"
      />
    );
    await userEvent.click(screen.getByText('Yes, delete'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel button clicked', async () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    await userEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel on Escape key', () => {
    render(
      <ConfirmDialog
        open={true}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses default confirmLabel "Delete" when not provided', () => {
    render(
      <ConfirmDialog open={true} onConfirm={onConfirm} onCancel={onCancel} />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
});

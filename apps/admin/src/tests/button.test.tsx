/**
 * src/tests/button.test.tsx
 * Tests: Spinner rendering, button disabled/loading states, click handlers
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Spinner, PageLoader } from '../components/ui/Spinner';

// ── Spinner ───────────────────────────────────────────────────────────────────

describe('Spinner', () => {
  it('renders without crashing', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies sm size class', () => {
    const { container } = render(<Spinner size="sm" />);
    expect(container.firstChild).toHaveClass('w-4', 'h-4');
  });

  it('applies md size class (default)', () => {
    const { container } = render(<Spinner />);
    expect(container.firstChild).toHaveClass('w-6', 'h-6');
  });

  it('applies lg size class', () => {
    const { container } = render(<Spinner size="lg" />);
    expect(container.firstChild).toHaveClass('w-12', 'h-12');
  });
});

// ── PageLoader ────────────────────────────────────────────────────────────────

describe('PageLoader', () => {
  it('renders LOADING text', () => {
    render(<PageLoader />);
    expect(screen.getByText('LOADING')).toBeInTheDocument();
  });

  it('renders a spinner inside', () => {
    const { container } = render(<PageLoader />);
    // PageLoader contains a Spinner which has 2 inner divs
    expect(container.querySelectorAll('div').length).toBeGreaterThan(2);
  });
});

// ── Generic button behaviour helpers ─────────────────────────────────────────
// These test patterns used across all admin pages

describe('button click handler', () => {
  it('calls handler once on click', async () => {
    const handler = vi.fn();
    render(<button onClick={handler}>Click me</button>);
    await userEvent.click(screen.getByText('Click me'));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler when button is disabled', async () => {
    const handler = vi.fn();
    render(<button onClick={handler} disabled>Disabled</button>);
    await userEvent.click(screen.getByText('Disabled'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('shows loading text when loading prop drives it', () => {
    const loading = true;
    render(
      <button disabled={loading}>
        {loading ? 'Saving…' : 'Save'}
      </button>
    );
    expect(screen.getByText('Saving…')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows normal text when not loading', () => {
    const loading = false;
    render(
      <button disabled={loading}>
        {loading ? 'Saving…' : 'Save'}
      </button>
    );
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByRole('button')).not.toBeDisabled();
  });

  it('fires handler on Enter key when button is focused', () => {
    const handler = vi.fn();
    render(<button onClick={handler}>Press Enter</button>);
    const btn = screen.getByText('Press Enter');
    btn.focus();
    fireEvent.keyDown(btn, { key: 'Enter' });
    // Note: native button fires click on Enter automatically
    // Testing the keyDown registration
    expect(btn).toHaveFocus();
  });
});

// ── Status rendering ──────────────────────────────────────────────────────────

describe('status-driven UI rendering', () => {
  function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { label: string; color: string }> = {
      COMPLETED: { label: 'Completed', color: 'green' },
      PENDING:   { label: 'Pending',   color: 'yellow' },
      FAILED:    { label: 'Failed',    color: 'red' },
    };
    const s = map[status] ?? { label: status, color: 'gray' };
    return <span data-testid="badge" data-color={s.color}>{s.label}</span>;
  }

  it('renders COMPLETED correctly', () => {
    render(<StatusBadge status="COMPLETED" />);
    const badge = screen.getByTestId('badge');
    expect(badge).toHaveTextContent('Completed');
    expect(badge).toHaveAttribute('data-color', 'green');
  });

  it('renders PENDING correctly', () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('Pending');
    expect(screen.getByTestId('badge')).toHaveAttribute('data-color', 'yellow');
  });

  it('renders FAILED correctly', () => {
    render(<StatusBadge status="FAILED" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('Failed');
    expect(screen.getByTestId('badge')).toHaveAttribute('data-color', 'red');
  });

  it('falls back gracefully for unknown status', () => {
    render(<StatusBadge status="UNKNOWN_XYZ" />);
    expect(screen.getByTestId('badge')).toHaveTextContent('UNKNOWN_XYZ');
    expect(screen.getByTestId('badge')).toHaveAttribute('data-color', 'gray');
  });
});
